import type { DimensionScore, RiskInput, RiskSignal } from './types'

// Phase 14 — ChargebackRisk scorer per D-15 / D-16 / D-17.
// Pure function. No on-time bonus (D-17). The orchestrator pre-filters
// `sentResponses` to `was_sent === true` entries (D-14). No DB, no fetch, no
// async, no module-scope `new Date()` — date math anchors on `input.today`.

const MS_PER_DAY = 86_400_000
const RECENT_RESPONSE_WINDOW_DAYS = 30

/**
 * Per-tool aggregation rule for chargeback signals. Identical pattern to the
 * scope scorer (each tool contributes `perResponse` points up to `cap`) but
 * with different code/label phrasing locked per D-16.
 */
type ToolRule = {
  code: string
  perResponse: number
  cap: number
  singular: string
  plural: (n: number) => string
}

const TOOL_RULES: Record<string, ToolRule> = {
  chargeback_threat: {
    code: 'chargeback_threat_sent',
    perResponse: 30,
    cap: 60,
    singular: '1 chargeback threat handled',
    plural: (n) => `${n} chargeback threats handled`,
  },
  dispute_response: {
    code: 'dispute_response_sent',
    perResponse: 18,
    cap: 36,
    singular: '1 formal dispute response sent',
    plural: (n) => `${n} formal dispute responses sent`,
  },
  review_threat: {
    code: 'review_threat_sent',
    perResponse: 20,
    cap: 40,
    singular: '1 review-threat response sent',
    plural: (n) => `${n} review-threat responses sent`,
  },
}

/**
 * Parse an ISO date/timestamp to milliseconds. Returns NaN on bad input — the
 * caller guards before doing arithmetic.
 */
function parseIsoMs(iso: string): number {
  return new Date(iso).getTime()
}

/**
 * Pure ChargebackRisk scorer. Score clamped to [0, 100] per D-17.
 *
 * Signal semantics:
 * - `chargeback_threat_sent` caps at 60 (D-16) — the strongest single signal
 *   short of the cap; never alone enough to push the dimension to red without
 *   accompanying evidence.
 * - `silence_14d` fires only when there is an unpaid past-due invoice; without
 *   that financial anchor, silence is just normal post-delivery quiet.
 * - `no_signoff_on_delivery` fires when there has been recent activity (within
 *   the 30-day window anchored on `input.today`) but no `delivery_signoff`
 *   tool has been used — proxy for "delivery happened without acceptance"
 *   per D-15 sign-off-proxy heuristic.
 */
export function scoreChargeback(input: RiskInput): DimensionScore {
  const signals: RiskSignal[] = []

  // Tally chargeback-related tool counts. Orchestrator has filtered to sent.
  const counts: Record<string, number> = {}
  let hasDeliverySignoff = false
  let hasRecentResponse = false
  const todayMs = parseIsoMs(input.today)

  for (const r of input.sentResponses) {
    if (TOOL_RULES[r.tool_type] !== undefined) {
      counts[r.tool_type] = (counts[r.tool_type] ?? 0) + 1
    }
    if (r.tool_type === 'delivery_signoff') {
      hasDeliverySignoff = true
    }
    // Track whether ANY sent response landed within the recent window — feeds
    // the no_signoff_on_delivery heuristic.
    if (!hasRecentResponse && !Number.isNaN(todayMs)) {
      const createdMs = parseIsoMs(r.created_at)
      if (!Number.isNaN(createdMs)) {
        const ageDays = Math.floor((todayMs - createdMs) / MS_PER_DAY)
        if (ageDays >= 0 && ageDays <= RECENT_RESPONSE_WINDOW_DAYS) {
          hasRecentResponse = true
        }
      }
    }
  }

  // Capped-sum signals per chargeback tool (D-16).
  for (const [tool, n] of Object.entries(counts)) {
    const rule = TOOL_RULES[tool]
    const rawPoints = rule.perResponse * n
    const cappedPoints = Math.min(rule.cap, rawPoints)
    const capped = rawPoints > rule.cap
    const baseLabel = n === 1 ? rule.singular : rule.plural(n)
    signals.push({
      code: rule.code,
      label: capped ? `${baseLabel} (capped)` : baseLabel,
      points: cappedPoints,
      source: 'responses',
    })
  }

  // silence_14d (D-16): unpaid past-due invoice AND no contact in 14+ days.
  // `daysSinceLastResponse` of null means "no responses ever sent" — still
  // counts as silence when there is an unpaid past-due invoice.
  const hasUnpaidInvoice =
    input.paymentDueDate !== null && input.paymentReceivedAt === null
  if (hasUnpaidInvoice) {
    const silentEnough =
      input.daysSinceLastResponse === null ||
      input.daysSinceLastResponse >= 14
    if (silentEnough) {
      signals.push({
        code: 'silence_14d',
        label:
          input.daysSinceLastResponse === null
            ? 'No client contact recorded with unpaid invoice'
            : `No client contact for ${input.daysSinceLastResponse} days with unpaid invoice`,
        points: 15,
        source: 'responses',
      })
    }
  }

  // no_signoff_on_delivery (D-16): recent activity but zero delivery_signoff.
  if (hasRecentResponse && !hasDeliverySignoff) {
    signals.push({
      code: 'no_signoff_on_delivery',
      label: 'Recent client activity without a recorded delivery sign-off',
      points: 18,
      source: 'responses',
    })
  }

  // Sum and clamp per D-17 — no on-time bonus.
  let score = 0
  for (const s of signals) score += s.points
  score = Math.max(0, Math.min(100, score))

  return { score, signals }
}
