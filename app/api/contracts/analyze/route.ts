export const maxDuration = 30

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { after } from 'next/server'
import { anthropic, CONTRACT_ANALYSIS_SYSTEM_PROMPT, NDA_ANALYSIS_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, contractRateLimit } from '@/lib/rate-limit'
import { professionContext } from '@/lib/profession'
import { ContractAnalysis } from '@/types'

const formSchema = z.object({
  title: z.string().max(200).optional(),
  project_id: z.string().uuid().nullable().optional(),
  text: z.string().max(100_000).nullable().optional(),
  contract_type: z.enum(['service_agreement', 'nda']).optional(),
})

// D-13: Inline JSON extraction helper — handles preamble-wrapped and markdown-fenced output
function extractJson(rawText: string): ContractAnalysis {
  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('No valid JSON found in response')
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(contractRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Atomic plan gate — check-and-increment in single Postgres transaction (GATE-02)
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_contracts',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; current_count: number; period_count: number; reason?: string } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
  }
  // Store pre-increment counts for compensating decrements on failure (D-03 credit-safe)
  const preIncrementCount = gate.current_count
  const prePeriodCount = gate.period_count

  const [formData, { data: profileData }] = await Promise.all([
    request.formData(),
    supabase.from('user_profiles').select('profession').eq('id', user.id).single(),
  ])
  const file = formData.get('file') as File | null

  const parsed = formSchema.safeParse({
    title: formData.get('title'),
    project_id: formData.get('project_id') || null,
    text: formData.get('text') || null,
  })
  if (!parsed.success) {
    await supabase.from('user_profiles')
      .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
      .eq('id', user.id)
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const text = parsed.data.text ?? null
  const title = parsed.data.title || 'Untitled contract'
  const project_id = parsed.data.project_id ?? null
  const contract_type = parsed.data.contract_type ?? 'service_agreement'
  const systemPrompt = contract_type === 'nda' ? NDA_ANALYSIS_SYSTEM_PROMPT : CONTRACT_ANALYSIS_SYSTEM_PROMPT

  // Validate inputs and read file bytes in request context (bytes unavailable inside after())
  let fileBytes: ArrayBuffer | null = null
  let fileName: string | null = null

  if (file) {
    if (file.type !== 'application/pdf') {
      await supabase.from('user_profiles')
        .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
        .eq('id', user.id)
      return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      await supabase.from('user_profiles')
        .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
        .eq('id', user.id)
      return Response.json({ error: 'File must be under 10 MB' }, { status: 400 })
    }
    fileBytes = await file.arrayBuffer()
    fileName = file.name
  } else if (!text) {
    await supabase.from('user_profiles')
      .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
      .eq('id', user.id)
    return Response.json({ error: 'No file or text provided' }, { status: 400 })
  }

  const profCtx = professionContext(profileData?.profession)

  const { data: contract } = await supabase
    .from('contracts')
    .insert({ user_id: user.id, title, original_filename: file?.name ?? null, status: 'pending', contract_type } as any)
    .select()
    .single()

  if (!contract) {
    await supabase.from('user_profiles')
      .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
      .eq('id', user.id)
    return Response.json({ error: 'DB error' }, { status: 500 })
  }

  // Capture for background closure — request context is unavailable inside after()
  const contractId = contract.id
  const userId = user.id

  after(async () => {
    const admin = createAdminSupabaseClient()
    try {
      let messageContent: Anthropic.MessageParam['content']

      if (fileBytes && fileName) {
        const fileUpload = await (anthropic.beta.files as any).upload(
          { file: new File([fileBytes], fileName, { type: 'application/pdf' }) },
          { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
        )
        await admin.from('contracts').update({ anthropic_file_id: fileUpload.id }).eq('id', contractId)
        messageContent = [
          { type: 'document', source: { type: 'file', file_id: fileUpload.id } } as any,
          { type: 'text', text: `Analyze this freelance contract and return the JSON analysis.${profCtx ? `\n\n${profCtx}` : ''}` }
        ]
      } else {
        await admin.from('contracts').update({ contract_text: text }).eq('id', contractId)
        messageContent = [{ type: 'text', text: `${profCtx ? `${profCtx}\n\n` : ''}Analyze this freelance contract:\n\n${text}` }]
      }

      const message = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: messageContent }]
        } as any,
        { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
      )

      const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
      // RELY-02: use extractJson instead of bare JSON.parse — handles preamble and markdown wrapping
      const analysis: ContractAnalysis = extractJson(rawText)

      // Credit-safe update — check result before clearing pending status (D-03)
      const { error: updateError } = await admin
        .from('contracts')
        .update({ analysis, risk_score: analysis.risk_score, risk_level: analysis.risk_level, status: 'analyzed' })
        .eq('id', contractId)

      if (updateError) {
        // Compensating decrement — RPC already incremented, undo it
        await admin.from('user_profiles')
          .update({ contracts_used: preIncrementCount })
          .eq('id', userId)
        return
      }

      if (project_id) {
        await admin.from('projects').update({ contract_id: contractId }).eq('id', project_id).eq('user_id', userId)
      }
    } catch (err) {
      await admin.from('contracts').update({ status: 'error' }).eq('id', contractId)
      // Compensating decrement — undo RPC increment on any unhandled error
      await admin.from('user_profiles')
        .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
        .eq('id', userId)
      console.error('Contract analysis error:', err)
    }
  })

  return Response.json({ contract: { id: contractId } })
}
