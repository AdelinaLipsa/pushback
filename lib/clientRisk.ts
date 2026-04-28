import type { DefenseTool, Project } from '@/types'

export type ClientRiskLevel = 'green' | 'yellow' | 'red'

export type ClientRiskSignal = {
  icon: string   // Lucide icon name
  label: string  // Human-readable: "3 scope changes", "Payment overdue 12 days", etc.
}

export type ClientRiskResult = {
  score: number              // 0..100 inclusive
  level: ClientRiskLevel
  signals: ClientRiskSignal[]
}

// Hex values are duplicated from globals.css CSS vars so this constant works in
// inline style objects without needing a CSSStyleDeclaration lookup.
export const CLIENT_RISK_COLORS: Record<ClientRiskLevel, string> = {
  green: '#22c55e',   // matches --brand-green
  yellow: '#f97316',  // matches --urgency-medium
  red: '#ef4444',     // matches --urgency-high
}

export const LEVEL_LABELS: Record<ClientRiskLevel, string> = {
  green: 'No concerns',
  yellow: 'Watch this client',
  red: 'High-risk client',
}

// Severity weights per tool_type for ONE sent response of that type.
// Calibrated so a single chargeback_threat (30) plus baseline overdue (+15) reaches red,
// and a single chargeback_threat (30) alone reaches yellow (>=26).
export const RISK_WEIGHTS: Record<DefenseTool, number> = {
  chargeback_threat: 30,
  dispute_response: 25,
  review_threat: 20,
  ip_dispute: 20,
  retroactive_discount: 18,
  moving_goalposts: 15,
  kill_fee: 15,
  post_handoff_request: 12,
  scope_change: 10,
  payment_final: 10,
  disputed_hours: 10,
  payment_second: 8,
  discount_pressure: 8,
  rush_fee_demand: 6,
  rate_increase_pushback: 6,
  ghost_client: 6,
  feedback_stall: 4,
  revision_limit: 4,
  payment_first: 3,
  spec_work_pressure: 3,
  delivery_signoff: 0,
  red_flag: 0,
  intake: 0,
}

// Independent additive contribution (NOT from sent responses) — applied when the
// project has payment_due_date in the past with no payment_received_at.
const OVERDUE_PAYMENT_WEIGHT = 15

// On-time payment bonus — subtractive, applies once when payment was received
// strictly before the due date.
const ON_TIME_BONUS = -10

// Maps a tool_type to the Lucide icon and human-readable singular/plural labels.
// Used to emit signals when 1+ sent responses of that type exist on the project.
type SignalRule = {
  icon: string
  singular: string
  plural: (n: number) => string
}

const SIGNAL_RULES: Record<DefenseTool, SignalRule | null> = {
  scope_change:           { icon: 'Layers',        singular: 'scope change',                 plural: (n) => `${n} scope changes` },
  moving_goalposts:       { icon: 'Layers',        singular: 'approved-then-rejected',       plural: (n) => `${n} approved-then-rejected` },
  chargeback_threat:      { icon: 'CreditCard',    singular: 'chargeback threat',            plural: (n) => `${n} chargeback threats` },
  retroactive_discount:   { icon: 'CreditCard',    singular: 'post-delivery discount demand',plural: (n) => `${n} post-delivery discount demands` },
  dispute_response:       { icon: 'ShieldAlert',   singular: 'formal dispute',               plural: (n) => `${n} formal disputes` },
  review_threat:          { icon: 'ShieldAlert',   singular: 'review threat',                plural: (n) => `${n} review threats` },
  ghost_client:           { icon: 'EyeOff',        singular: 'ghost client situation',       plural: (n) => `${n} ghost client situations` },
  feedback_stall:         { icon: 'EyeOff',        singular: 'feedback delay',               plural: (n) => `${n} feedback delays` },
  ip_dispute:             { icon: 'FileText',      singular: 'IP dispute',                   plural: (n) => `${n} IP disputes` },
  kill_fee:               { icon: 'FileText',      singular: 'kill fee invoked',             plural: (n) => `${n} kill fees invoked` },
  post_handoff_request:   { icon: 'FileText',      singular: 'post-handoff request',         plural: (n) => `${n} post-handoff requests` },
  discount_pressure:      { icon: 'TrendingDown',  singular: 'rate negotiation',             plural: (n) => `${n} rate negotiations` },
  rate_increase_pushback: { icon: 'TrendingDown',  singular: 'rate-increase pushback',       plural: (n) => `${n} rate-increase pushbacks` },
  rush_fee_demand:        { icon: 'TrendingDown',  singular: 'rush-without-fee demand',      plural: (n) => `${n} rush-without-fee demands` },
  disputed_hours:         { icon: 'TrendingDown',  singular: 'disputed-hours dispute',       plural: (n) => `${n} disputed-hours disputes` },
  revision_limit:         { icon: 'RefreshCw',     singular: 'revision limit situation',     plural: (n) => `${n} revision limit situations` },
  spec_work_pressure:     { icon: 'RefreshCw',     singular: 'spec/exposure request',        plural: (n) => `${n} spec/exposure requests` },
  // Payment cadence reminders are not surfaced as separate signals (they roll into
  // the "Payment currently overdue" signal when applicable). Counts still feed the score.
  payment_first:          null,
  payment_second:         null,
  payment_final:          null,
  // Normal delivery — never a risk signal.
  delivery_signoff:       null,
  // Pre-engagement tools — not project-level signals.
  red_flag:               null,
  intake:                 null,
}

export function computeClientRisk(
  project: Pick<Project, 'payment_due_date' | 'payment_received_at'> & {
    defense_responses?: Array<{ tool_type: DefenseTool; was_sent: boolean }> | null
  }
): ClientRiskResult {
  const responses = (project.defense_responses ?? []).filter((r) => r.was_sent === true)

  // 1. Tally sent responses per tool_type.
  const counts: Partial<Record<DefenseTool, number>> = {}
  for (const r of responses) {
    counts[r.tool_type] = (counts[r.tool_type] ?? 0) + 1
  }

  // 2. Sum weighted score from sent responses.
  let score = 0
  for (const [tool, n] of Object.entries(counts) as [DefenseTool, number][]) {
    score += (RISK_WEIGHTS[tool] ?? 0) * n
  }

  // 3. Overdue payment contribution (independent additive).
  const isOverdue =
    project.payment_due_date !== null &&
    project.payment_received_at === null &&
    new Date(project.payment_due_date) < new Date()
  if (isOverdue) score += OVERDUE_PAYMENT_WEIGHT

  // 4. On-time payment bonus (subtractive, once).
  if (
    project.payment_received_at !== null &&
    project.payment_due_date !== null &&
    new Date(project.payment_received_at) < new Date(project.payment_due_date)
  ) {
    score += ON_TIME_BONUS
  }

  // 5. Clamp to [0, 100].
  score = Math.max(0, Math.min(100, score))

  // 6. Build signal list (only for tool_types that have a SIGNAL_RULES entry).
  const signals: ClientRiskSignal[] = []
  for (const [tool, n] of Object.entries(counts) as [DefenseTool, number][]) {
    const rule = SIGNAL_RULES[tool]
    if (!rule || n <= 0) continue
    const label = n === 1 ? `1 ${rule.singular}` : rule.plural(n)
    signals.push({ icon: rule.icon, label })
  }

  // 7. Overdue surfaces its own dedicated signal (not a sent-response).
  if (isOverdue && project.payment_due_date) {
    const due = new Date(project.payment_due_date)
    due.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    signals.push({
      icon: 'CreditCard',
      label: daysOverdue === 1 ? 'Payment overdue 1 day' : `Payment overdue ${daysOverdue} days`,
    })
  }

  // 8. Map score to level.
  const level: ClientRiskLevel = score >= 61 ? 'red' : score >= 26 ? 'yellow' : 'green'

  return { score, level, signals }
}
