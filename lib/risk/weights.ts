import type { RiskDimension, RiskLevel } from './types'

// Phase 14 — locked weights, thresholds, and Phase 12 visual carryover.
// All values are constants (D-07 / D-08). Not env-configurable in v1.
// Plan 02 (orchestrator) and Plan 03 (UI rewire) both import from this module —
// it is the single source of truth so any future tuning lives in one place.

/**
 * Composite weights per D-07 — payment 40 / scope 30 / chargeback 30.
 *
 * The values are tuned so PaymentRisk dominates because late or missing payment
 * is the highest-confidence signal the engine has. Sum is 1.0 — if the dimension
 * triad ever expands, this contract must be revisited.
 */
export const COMPOSITE_WEIGHTS: Record<RiskDimension, number> = {
  payment: 0.4,
  scope: 0.3,
  chargeback: 0.3,
}

/**
 * Level thresholds per D-08:
 *   0–25  → green
 *   26–65 → amber
 *   66+   → red
 *
 * Phase 12 used 0–25 / 26–60 / 61+. Phase 14 shifts the red boundary up by
 * five points to 66 for cleaner thirds; the Plan 04 compat shim absorbs the
 * boundary shift for legacy callers.
 */
export const LEVEL_THRESHOLDS = {
  amber: 26,
  red: 66,
} as const

/**
 * Phase 12 D-04 visual carryover. Hex values are duplicated from
 * `lib/clientRisk.ts` (Phase 12) so this constant works in inline style objects
 * without a CSSStyleDeclaration lookup. The `amber` key replaces Phase 12's
 * `yellow` key but uses the same orange hex.
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  green: '#22c55e',
  amber: '#f97316',
  red: '#ef4444',
}

/**
 * Pure helper — map a composite score to its level band per D-08. The
 * orchestrator (Plan 02) reuses this so band derivation lives in exactly one
 * place. Inputs outside [0, 100] are not normalised here; callers clamp.
 */
export function levelFromScore(score: number): RiskLevel {
  if (score >= LEVEL_THRESHOLDS.red) return 'red'
  if (score >= LEVEL_THRESHOLDS.amber) return 'amber'
  return 'green'
}
