import type { RiskDimension, RiskLevel } from './types'

// Phase 14 — Static `nextAction` decision table per D-19.
//
// The whole engine is LLM-free at runtime (D-26). The recommended next-action
// sentence is selected by a pure 2-key lookup keyed on (level, topDimension):
// no template strings, no string concatenation, no user input ever interpolates
// into these strings. The 3×3 grid below ships verbatim to users — every cell
// holds the final sentence the dashboard renders.
//
// Locked v1 phrasing — future variants are a copy-only change to this table.
// The red/chargeback cell intentionally contains the literal "Phase 15 trigger"
// substring (CONTEXT D-19 example + Plan 02 done-criterion + grep verification).

/**
 * The 3×3 (level × dimension) action grid. Each cell is the final sentence
 * the UI renders — no formatting, no concatenation downstream. Treat the
 * strings as user-facing copy: any change here is a product decision, not
 * a bug fix.
 */
export const ACTION_TABLE: Record<RiskLevel, Record<RiskDimension, string>> = {
  green: {
    payment: 'Payment behavior looks healthy — no action needed.',
    scope: 'Scope is stable — no action needed.',
    chargeback: 'No chargeback signals — no action needed.',
  },
  amber: {
    payment:
      'Send a polite payment reminder and confirm the next invoice date in writing.',
    scope:
      'Re-state the agreed scope in writing before accepting any further changes.',
    chargeback:
      'Save dated proof of delivery and sign-off for this project — keep it organized.',
  },
  red: {
    payment:
      'Escalate: issue a final payment notice and pause new work until the outstanding invoice clears.',
    scope:
      'Stop accepting changes. Issue a written scope-change order with revised price before proceeding.',
    chargeback:
      'Compile a dispute evidence pack now — see Phase 15 trigger.',
  },
}

/**
 * Pure 2-key lookup into `ACTION_TABLE`. Returns the locked v1 sentence for the
 * given (level, dimension) pair. No defaulting, no fallback — every cell is
 * populated, so any input combination is total over its domain.
 */
export function pickNextAction(
  level: RiskLevel,
  topDimension: RiskDimension,
): string {
  return ACTION_TABLE[level][topDimension]
}
