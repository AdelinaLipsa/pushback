import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { DEFENSE_TOOLS, DEFENSE_TOOL_VALUES } from '@/lib/defenseTools'
import { professionContext } from '@/lib/profession'
import { DefenseTool, ContractAnalysis } from '@/types'
import { z } from 'zod'

// Tool-type-to-clause keyword groupings (Phase 9 — D-05 through D-10)
const TOOL_CLAUSE_KEYWORDS: Record<string, string[]> = {
  scope: ['scope', 'revision', 'deliverable', 'change', 'amendment'],
  payment: ['payment', 'invoice', 'fee', 'net-30', 'late', 'interest'],
  kill_fee: ['cancel', 'termination', 'kill'],
  revision: ['revision', 'change', 'rounds', 'unlimited'],
  ip: ['ip', 'intellectual property', 'source', 'ownership', 'license'],
  dispute: [],
}

const TOOL_GROUP_MAP: Record<DefenseTool, keyof typeof TOOL_CLAUSE_KEYWORDS> = {
  scope_change: 'scope',
  moving_goalposts: 'scope',
  post_handoff_request: 'scope',
  payment_first: 'payment',
  payment_second: 'payment',
  payment_final: 'payment',
  retroactive_discount: 'payment',
  chargeback_threat: 'payment',
  kill_fee: 'kill_fee',
  revision_limit: 'revision',
  ip_dispute: 'ip',
  dispute_response: 'dispute',
  review_threat: 'dispute',
  delivery_signoff: 'dispute',
  ghost_client: 'dispute',
  feedback_stall: 'dispute',
  discount_pressure: 'dispute',
  rate_increase_pushback: 'dispute',
  rush_fee_demand: 'dispute',
  spec_work_pressure: 'dispute',
  disputed_hours: 'payment',
}

function buildContractContext(
  analysis: ContractAnalysis | null,
  toolType: DefenseTool
): { contextBlock: string; clauseTitlesUsed: string[] } {
  if (!analysis) return { contextBlock: '', clauseTitlesUsed: [] }

  const group = TOOL_GROUP_MAP[toolType] ?? 'dispute'
  const keywords = TOOL_CLAUSE_KEYWORDS[group] ?? []

  const header = `Risk level: ${analysis.risk_level.charAt(0).toUpperCase() + analysis.risk_level.slice(1)} (${analysis.risk_score}/10) — ${analysis.verdict}`

  const matchedClauses = keywords.length > 0
    ? analysis.flagged_clauses.filter(c =>
        keywords.some(kw => c.title.toLowerCase().includes(kw))
      )
    : analysis.flagged_clauses

  const topClauses = matchedClauses.slice(0, 3).length > 0
    ? matchedClauses.slice(0, 3)
    : analysis.flagged_clauses.slice(0, 3)

  const clauseLines = topClauses.map(c =>
    `• ${c.title}\n  → "${c.pushback_language}"`
  )
  const clauseTitlesUsed = topClauses.map(c => c.title)

  const matchedMissing = keywords.length > 0
    ? analysis.missing_protections.filter(mp =>
        keywords.some(kw =>
          mp.title.toLowerCase().includes(kw) ||
          mp.why_you_need_it.toLowerCase().includes(kw)
        )
      )
    : analysis.missing_protections
  const topMissing = matchedMissing.slice(0, 2)

  const missingLines = topMissing.map(mp =>
    `• ${mp.title} — Suggested: "${mp.suggested_clause}"`
  )

  const parts = [
    header,
    ...(clauseLines.length > 0 ? ['\nRELEVANT CLAUSES:', ...clauseLines] : []),
    ...(missingLines.length > 0 ? ['\nMISSING PROTECTIONS:', ...missingLines] : []),
  ]

  return { contextBlock: parts.join('\n'), clauseTitlesUsed }
}

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
  disputed_hours: 'DISPUTED HOURS — TIME & MATERIALS',
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
  const gate = gateResult as { allowed: boolean; reason?: string; period_count?: number } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
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

    const [{ data: project }, { data: profileData }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, title, client_name, project_value, currency, notes, contracts(analysis)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_profiles')
        .select('profession')
        .eq('id', user.id)
        .single(),
    ])

    if (!project) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const contextLines = [
      professionContext(profileData?.profession),
      `PROJECT: ${project.title}`,
      `CLIENT: ${project.client_name}`,
      project.project_value ? `VALUE: ${project.project_value} ${project.currency}` : null,
      project.notes ? `NOTES: ${project.notes}` : null,
    ].filter(Boolean).join('\n')

    const contractAnalysis = Array.isArray(project.contracts)
      ? project.contracts[0]?.analysis
      : project.contracts?.analysis
    const { contextBlock, clauseTitlesUsed } = buildContractContext(contractAnalysis ?? null, tool_type as DefenseTool)
    const contractContext = contextBlock
      ? `\n\nCONTRACT CONTEXT:\n${contextBlock}`
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

    const newPeriodCount = (gate?.period_count ?? 0) + 1
    const usageWarning = newPeriodCount >= 120 ? `${newPeriodCount} of 150 responses used this period` : undefined
    return Response.json({ response, id: saved.id, contract_clauses_used: clauseTitlesUsed, usage_warning: usageWarning })
  } catch (err) {
    console.error('Defend route error:', err)
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }
}
