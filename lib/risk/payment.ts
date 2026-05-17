import type { DimensionScore, RiskInput, RiskSignal } from './types'

// Phase 14 — PaymentRisk scorer per D-10 / D-11.
// Pure function: same inputs always yield identical output. No `new Date()` in
// module scope; date math anchors on the injected `input.today` ISO string so
// the orchestrator (Plan 02) controls "now". No fetch, no DB, no async, no
// console — D-01 / D-03 / D-26.

const MS_PER_DAY = 86_400_000

/**
 * Parse an ISO date/timestamp string to a millisecond epoch. Returns NaN if the
 * value cannot be parsed — callers must guard via `Number.isNaN` before doing
 * arithmetic on the result.
 */
function parseIsoMs(iso: string): number {
  return new Date(iso).getTime()
}

/**
 * Days late = (effective payment moment) − (due date), expressed in whole days
 * via floor division. Negative = on-time (paid before due). When the payment
 * has not yet been received the comparison uses `today` instead, capturing
 * overdue-and-unpaid invoices.
 *
 * Returns null when there is no due date (the late-signal branch is then
 * inert; only contract-gap signals apply).
 */
function computeDaysLate(input: RiskInput): number | null {
  if (input.paymentDueDate === null) return null
  const dueMs = parseIsoMs(input.paymentDueDate)
  if (Number.isNaN(dueMs)) return null
  const anchorMs =
    input.paymentReceivedAt !== null
      ? parseIsoMs(input.paymentReceivedAt)
      : parseIsoMs(input.today)
  if (Number.isNaN(anchorMs)) return null
  return Math.floor((anchorMs - dueMs) / MS_PER_DAY)
}

/**
 * Pure PaymentRisk scorer. Signal codes, point values, and source attribution
 * are locked per D-10. Final score is clamped to [0, 100] per D-11 — the
 * on-time bonus can drive the running sum negative; the floor pulls it back to
 * zero so the bonus never "leaks" into the chargeback dimension at composite
 * time.
 */
export function scorePayment(input: RiskInput): DimensionScore {
  const signals: RiskSignal[] = []
  const daysLate = computeDaysLate(input)

  // Lateness signals — D-10. The bands are exhaustive (only one fires).
  if (daysLate !== null) {
    if (daysLate > 14) {
      signals.push({
        code: 'late_severe',
        label: `Payment ${daysLate} days late`,
        points: 25,
        source: 'projects',
      })
    } else if (daysLate >= 1) {
      signals.push({
        code: 'late_moderate',
        label: daysLate === 1 ? 'Payment 1 day late' : `Payment ${daysLate} days late`,
        points: 12,
        source: 'projects',
      })
    } else if (daysLate > 0) {
      // Fractional-day band (0 < daysLate <= 1) — floor pushes this branch to
      // dead code in practice, but keep it for spec parity with D-10's
      // exclusive boundary phrasing.
      signals.push({
        code: 'late_minor',
        label: 'Payment less than one day late',
        points: 4,
        source: 'projects',
      })
    } else if (input.paymentReceivedAt !== null) {
      // daysLate <= 0 AND payment actually received — on-time bonus (D-10).
      signals.push({
        code: 'on_time',
        label: 'Payment received on or before due date',
        points: -10,
        source: 'projects',
      })
    }
  }

  // Contract-gap signals — D-10. Apply whether or not a due date exists, but
  // only when a contract is actually attached. A brand-new project with no
  // contract on file should not be flagged for "missing clauses" — the user
  // simply hasn't uploaded yet; the Contract tab handles that prompt.
  if (input.hasContract) {
    if (!input.contractClauses.includes('late_fee')) {
      signals.push({
        code: 'no_late_fee_clause',
        label: 'Contract has no late-fee clause',
        points: 10,
        source: 'contracts',
      })
    }
    if (!input.contractClauses.includes('kill_fee')) {
      signals.push({
        code: 'no_kill_fee_clause',
        label: 'Contract has no kill-fee clause',
        points: 8,
        source: 'contracts',
      })
    }
    if (!input.contractClauses.includes('payment_schedule')) {
      signals.push({
        code: 'no_payment_schedule',
        label: 'Contract has no payment-schedule clause',
        points: 8,
        source: 'contracts',
      })
    }
  }

  // Repeated payment-cadence pressure — D-10 (Claude's discretion to include).
  // Only fires when the freelancer has sent the cadence reminder twice or more
  // to this project, indicating chasing pattern; a single payment_first
  // reminder is normal hygiene and not a risk signal on its own.
  let paymentReminderCount = 0
  for (const r of input.sentResponses) {
    if (
      r.tool_type === 'payment_first' ||
      r.tool_type === 'payment_second' ||
      r.tool_type === 'payment_final'
    ) {
      paymentReminderCount += 1
    }
  }
  if (paymentReminderCount >= 2) {
    const rawPoints = 5 * paymentReminderCount
    const cappedPoints = Math.min(15, rawPoints)
    signals.push({
      code: 'partial_payment_pressure',
      label: `${paymentReminderCount} payment-cadence reminders sent${
        rawPoints > 15 ? ' (capped)' : ''
      }`,
      points: cappedPoints,
      source: 'responses',
    })
  }

  // Sum, then clamp per D-11. The on-time bonus can drive the running sum
  // negative when no contract gaps and no reminders fire — Math.max floors it.
  let score = 0
  for (const s of signals) score += s.points
  score = Math.max(0, Math.min(100, score))

  return { score, signals }
}
