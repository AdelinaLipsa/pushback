import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { DEFENSE_TOOLS, DEFENSE_TOOL_VALUES } from '@/lib/defenseTools'
import { DefenseTool } from '@/types'
import { z } from 'zod'

// IN-02: renamed from TOOL_LABELS to avoid collision with lib/defenseTools display labels
const PROMPT_TOOL_LABELS: Record<DefenseTool, string> = {
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

// WR-01: use shared DEFENSE_TOOL_VALUES for properly-typed enum (no `as DefenseTool` cast needed downstream)
// CR-01 + IN-01: superRefine validates key allowlist per tool and caps key count at 10
const defendSchema = z.object({
  tool_type: z.enum(DEFENSE_TOOL_VALUES),
  situation: z.string().min(10).max(2000),
  extra_context: z.record(
    z.string().regex(/^[a-z][a-z0-9_]{0,49}$/, 'key must be snake_case'),
    z.union([z.string().max(500), z.number()])
  ).optional(),
}).superRefine((data, ctx) => {
  if (!data.extra_context) return
  const keys = Object.keys(data.extra_context)
  if (keys.length > 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'extra_context: too many keys (max 10)' })
    return
  }
  const tool = DEFENSE_TOOLS.find(t => t.type === data.tool_type)
  if (!tool || tool.contextFields.length === 0) return
  const validKeys = new Set(tool.contextFields.map(f => f.key))
  for (const k of keys) {
    if (!validKeys.has(k)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `extra_context: unknown key '${k}' for tool '${data.tool_type}'` })
    }
  }
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
  const gate = gateResult as { allowed: boolean } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  try {
    // Validate request body (VALID-01)
    const body = await request.json()
    const parsed = defendSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
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
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
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
      `\nTOOL: ${PROMPT_TOOL_LABELS[tool_type as DefenseTool]}`,
      `\nSITUATION:\n${situation}`,
      '\nWrite the message now.'
    ].join('')

    const slotResponse = await acquireAnthropicSlot()
    if (slotResponse) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return slotResponse
    }

    let response: string
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: DEFENSE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
      response = message.content[0].type === 'text' ? message.content[0].text : ''
    } finally {
      await releaseAnthropicSlot()
    }

    // Credit-safe insert — only proceed if save succeeds (RELY-04)
    const { data: saved, error: saveError } = await supabase
      .from('defense_responses')
      .insert({ project_id: id, user_id: user.id, tool_type, situation, extra_context: extra_context ?? {}, response })
      .select()
      .single()

    if (saveError || !saved) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Failed to save response — your credit was not used. Please try again.' }, { status: 500 })
    }

    return Response.json({ response, id: saved.id })
  } catch (err) {
    console.error('Defend route error:', err)
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }
}
