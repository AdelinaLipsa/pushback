import Anthropic from '@anthropic-ai/sdk'
import { anthropic, CONTRACT_ANALYSIS_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, contractRateLimit } from '@/lib/rate-limit'
import { professionContext } from '@/lib/profession'
import { ContractAnalysis } from '@/types'

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
  const text = formData.get('text') as string | null
  const title = (formData.get('title') as string) || 'Untitled contract'
  const project_id = formData.get('project_id') as string | null

  const profCtx = professionContext(profileData?.profession)

  const { data: contract } = await supabase
    .from('contracts')
    .insert({ user_id: user.id, title, original_filename: file?.name ?? null, status: 'pending' })
    .select()
    .single()

  if (!contract) {
    // Compensate — contract row could not be created, undo gate increment
    await supabase
      .from('user_profiles')
      .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
      .eq('id', user.id)
    return Response.json({ error: 'DB error' }, { status: 500 })
  }

  try {
    let messageContent: Anthropic.MessageParam['content']

    if (file) {
      // File type and size validation (VALID-03) — before Anthropic Files API upload
      if (file.type !== 'application/pdf') {
        await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
        await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
        return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
        await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
        return Response.json({ error: 'File must be under 10 MB' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const fileUpload = await (anthropic.beta.files as any).upload(
        { file: new File([bytes], file.name, { type: 'application/pdf' }) },
        { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
      )
      await supabase.from('contracts').update({ anthropic_file_id: fileUpload.id }).eq('id', contract.id)
      messageContent = [
        { type: 'document', source: { type: 'file', file_id: fileUpload.id } } as any,
        { type: 'text', text: `Analyze this freelance contract and return the JSON analysis.${profCtx ? `\n\n${profCtx}` : ''}` }
      ]
    } else if (text) {
      await supabase.from('contracts').update({ contract_text: text }).eq('id', contract.id)
      messageContent = [{ type: 'text', text: `${profCtx ? `${profCtx}\n\n` : ''}Analyze this freelance contract:\n\n${text}` }]
    } else {
      await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
      await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
      return Response.json({ error: 'No file or text provided' }, { status: 400 })
    }

    const message = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: CONTRACT_ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }]
      } as any,
      { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
    )

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    // RELY-02: use extractJson instead of bare JSON.parse — handles preamble and markdown wrapping
    const analysis: ContractAnalysis = extractJson(rawText)

    // Credit-safe update — check result before returning (D-03)
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ analysis, risk_score: analysis.risk_score, risk_level: analysis.risk_level, status: 'analyzed' })
      .eq('id', contract.id)

    if (updateError) {
      // Compensating decrement — RPC already incremented, undo it
      await supabase
        .from('user_profiles')
        .update({ contracts_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: 'Failed to save analysis — your credit was not used. Please try again.' }, { status: 500 })
    }

    if (project_id) {
      await supabase.from('projects').update({ contract_id: contract.id }).eq('id', project_id).eq('user_id', user.id)
    }

    // Note: no manual contracts_used increment needed — RPC already handled it atomically

    return Response.json({ contract: { ...contract, analysis, risk_score: analysis.risk_score, risk_level: analysis.risk_level } })
  } catch (err) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
    // Compensating decrement — undo RPC increment on any unhandled error
    await supabase
      .from('user_profiles')
      .update({ contracts_used: preIncrementCount, period_contracts_used: prePeriodCount })
      .eq('id', user.id)
    console.error('Contract analysis error:', err)
    // D-13: distinguish malformed AI output from other failures
    const isParseError = err instanceof Error && err.message === 'No valid JSON found in response'
    return Response.json(
      { error: isParseError ? 'Contract analysis returned malformed output — please try again' : 'Analysis failed' },
      { status: 500 }
    )
  }
}
