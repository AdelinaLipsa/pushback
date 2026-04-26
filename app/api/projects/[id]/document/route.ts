import { anthropic, DOCUMENT_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { acquireAnthropicSlot, releaseAnthropicSlot, checkRateLimit, defendRateLimit } from '@/lib/rate-limit'
import type { ContractAnalysis, DefenseResponse } from '@/types'
import { z } from 'zod'

// Zod 4.x — typed tuple, not array. Mirrors DEFENSE_TOOL_VALUES pattern.
const DOCUMENT_TYPE_VALUES = ['sow_amendment', 'kill_fee_invoice', 'dispute_package'] as const
type DocumentType = typeof DOCUMENT_TYPE_VALUES[number]

const documentSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPE_VALUES),
  context: z.string().max(2000).optional(),
})

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'STATEMENT OF WORK AMENDMENT',
  kill_fee_invoice: 'KILL FEE INVOICE',
  dispute_package: 'DISPUTE PACKAGE',
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Pro gate — direct profile fetch, no RPC, no usage counter (D-09, D-02)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!profile || profile.plan !== 'pro') {
    return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
  }

  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Validate request body
    const body = await request.json()
    const parsed = documentSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return Response.json(
        { error: `${String(issue.path[0])}: ${issue.message}` },
        { status: 400 }
      )
    }
    const { document_type, context } = parsed.data

    // Project fetch with IDOR guard + contracts.analysis + defense_responses (D-10)
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, client_name, project_value, currency, notes, contracts(analysis), defense_responses(tool_type, situation, response, created_at)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // Normalize contracts join — Supabase returns object OR array (defend/route.ts pattern lines 189–191)
    const contractAnalysis = Array.isArray(project.contracts)
      ? (project.contracts[0]?.analysis as ContractAnalysis | null | undefined)
      : ((project.contracts as { analysis: ContractAnalysis | null } | null)?.analysis ?? null)

    // Build project context block
    const projectLines = [
      `PROJECT: ${project.title}`,
      `CLIENT: ${project.client_name}`,
      project.project_value ? `VALUE: ${project.project_value} ${project.currency}` : null,
      project.notes ? `NOTES: ${project.notes}` : null,
    ].filter(Boolean).join('\n')

    // Contract analysis summary — only include high-signal fields
    const contractBlock = contractAnalysis
      ? [
          '\nCONTRACT ANALYSIS:',
          `Risk: ${contractAnalysis.risk_level} (${contractAnalysis.risk_score}/10) — ${contractAnalysis.verdict}`,
          ...contractAnalysis.flagged_clauses.slice(0, 3).map(c => `• ${c.title}: ${c.plain_english}`),
        ].join('\n')
      : '\n(No contract attached — do not invent contract terms)'

    // Defense responses — last 5 (most recent first) for timeline reconstruction
    const responses = (project.defense_responses ?? []) as Pick<DefenseResponse, 'tool_type' | 'situation' | 'response' | 'created_at'>[]
    const sortedResponses = [...responses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    const responsesBlock = sortedResponses.length > 0
      ? [
          '\nRECENT DEFENSE HISTORY (most recent first):',
          ...sortedResponses.map(r => `• ${r.created_at.slice(0, 10)} — ${r.tool_type}: ${r.situation}`),
        ].join('\n')
      : ''

    const safeContext = context
      ? context
          .replace(/[^\x20-\x7E\n\r]/g, '')
          .replace(/\bignore\s+(all\s+)?(previous|above|prior)\s+instructions?\b/gi, '[removed]')
          .slice(0, 2000)
      : ''
    const contextBlock = safeContext ? `\n\n<user_context>\n${safeContext}\n</user_context>` : ''

    const userMessage = [
      projectLines,
      contractBlock,
      responsesBlock,
      contextBlock,
      `\nDOCUMENT TYPE REQUESTED: ${document_type} (${DOCUMENT_LABELS[document_type]})`,
      '\nGenerate the document now.',
    ].join('')

    // Concurrency control — same as defend route
    const slotResponse = await acquireAnthropicSlot()
    if (slotResponse) return slotResponse

    let document: string
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: DOCUMENT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })
      document = message.content[0].type === 'text' ? message.content[0].text : ''
    } finally {
      await releaseAnthropicSlot()
    }

    if (!document) {
      return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
    }

    // Documents are ephemeral — no DB insert (CONTEXT.md Deferred)
    return Response.json({ document })
  } catch (err) {
    console.error('Document route error:', err)
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }
}
