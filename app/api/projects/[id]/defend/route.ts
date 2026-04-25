import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit } from '@/lib/rate-limit'
import { DefenseTool } from '@/types'
import { z } from 'zod'

const TOOL_LABELS: Record<DefenseTool, string> = {
  scope_change: 'SCOPE CHANGE REQUEST',
  payment_first: 'PAYMENT REMINDER — FIRST (0–7 days late)',
  payment_second: 'PAYMENT FOLLOW-UP — SECOND (8–14 days late)',
  payment_final: 'FINAL PAYMENT NOTICE (15+ days late)',
  revision_limit: 'REVISION LIMIT REACHED',
  kill_fee: 'KILL FEE ENFORCEMENT',
  delivery_signoff: 'DELIVERY SIGN-OFF REQUEST',
  dispute_response: 'DISPUTE RESPONSE',
  ghost_client: 'GHOST CLIENT — RADIO SILENCE',
  feedback_stall: 'FEEDBACK DELAY — TIMELINE RECALIBRATION',
  moving_goalposts: 'APPROVED THEN REJECTED — GOALPOST SHIFT',
  discount_pressure: 'RATE NEGOTIATION — HOLD YOUR RATE',
  retroactive_discount: 'POST-DELIVERY DISCOUNT DEMAND',
  rate_increase_pushback: 'RATE INCREASE — HOLD THE NEW RATE',
  rush_fee_demand: 'RUSH DEMAND WITHOUT RUSH FEE',
  ip_dispute: 'IP / SOURCE FILE OWNERSHIP DISPUTE',
  chargeback_threat: 'CHARGEBACK / PAYMENT REVERSAL THREAT',
  spec_work_pressure: 'EXPOSURE / SPEC WORK DEMAND',
  post_handoff_request: 'POST-HANDOFF REQUEST — CLOSED PROJECT',
  review_threat: 'REVIEW / REPUTATION THREAT',
}

const defendSchema = z.object({
  tool_type: z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]]),
  situation: z.string().min(10).max(2000),
  extra_context: z.record(
    z.string(),
    z.union([z.string().max(500), z.number()])
  ).optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Atomic plan gate — check-and-increment in a single Postgres transaction (GATE-01)
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; current_count: number } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
  }
  // Store pre-increment count for compensating decrement on failure (RELY-04)
  const preIncrementCount = gate.current_count

  try {
    // Validate request body (VALID-01)
    const body = await request.json()
    const parsed = defendSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      // Undo the RPC increment — user did not consume a credit
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: `${String(issue.path[0])}: ${issue.message}` }, { status: 400 })
    }
    const { tool_type, situation, extra_context } = parsed.data

    const { data: project } = await supabase
      .from('projects')
      .select('id, title, client_name, project_value, currency, notes, contracts(analysis)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const contextLines = [
      `PROJECT: ${project.title}`,
      `CLIENT: ${project.client_name}`,
      project.project_value ? `VALUE: ${project.project_value} ${project.currency}` : null,
      project.notes ? `NOTES: ${project.notes}` : null,
    ].filter(Boolean).join('\n')

    const contractAnalysis = Array.isArray(project.contracts)
      ? project.contracts[0]?.analysis
      : project.contracts?.analysis
    const contractContext = contractAnalysis
      ? `\n\nCONTRACT DATA:\n${JSON.stringify(contractAnalysis, null, 2)}`
      : '\n\n(No contract — do not reference or invent contract terms)'

    const extraBlock = extra_context && Object.keys(extra_context).length > 0
      ? `\n\nADDITIONAL CONTEXT:\n${Object.entries(extra_context).map(([k, v]) => `${k}: ${v}`).join('\n')}`
      : ''

    const userMessage = [
      contextLines, contractContext, extraBlock,
      `\nTOOL: ${TOOL_LABELS[tool_type as DefenseTool]}`,
      `\nSITUATION:\n${situation}`,
      '\nWrite the message now.'
    ].join('')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: DEFENSE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''

    // Credit-safe insert — only proceed if save succeeds (RELY-04)
    const { data: saved, error: saveError } = await supabase
      .from('defense_responses')
      .insert({ project_id: id, user_id: user.id, tool_type, situation, extra_context: extra_context ?? {}, response })
      .select()
      .single()

    if (saveError || !saved) {
      // Compensating decrement — RPC already incremented, undo it
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: 'Failed to save response — your credit was not used. Please try again.' }, { status: 500 })
    }

    return Response.json({ response, id: saved.id })
  } catch (err) {
    console.error('Defend route error:', err)
    // Compensating decrement — RPC already incremented, undo it on any unhandled error (RELY-01, RELY-04)
    await supabase
      .from('user_profiles')
      .update({ defense_responses_used: preIncrementCount })
      .eq('id', user.id)
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }
}
