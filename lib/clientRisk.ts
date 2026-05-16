import type { DefenseTool, Project } from '@/types'
import { computeRisk } from './risk'
import type { RiskSignal } from './risk/types'

// Phase 14 — Plan 04 compat shim.
//
// Phase 12 shipped a single-aggregate `computeClientRisk` in this file. Phase 14
// replaces the implementation with a multi-dimensional engine under `lib/risk/`.
// CONTEXT D-05 mandates that `lib/clientRisk.ts` remain a valid import path —
// any caller still importing from `@/lib/clientRisk` (and that we haven't
// migrated to `@/lib/risk` directly) keeps working without modification.
//
// This file therefore:
//   1. Re-exports the Phase 12 public surface byte-for-byte (types, color map,
//      label map, RISK_WEIGHTS constant) so every legacy import resolves.
//   2. Re-implements `computeClientRisk` as a translation adapter that delegates
//      all scoring to `computeRisk` from `./risk` and maps the Phase 14
//      `RiskResult` back to the Phase 12 `ClientRiskResult` shape.
//   3. Preserves the **Phase 12 level boundary** (61+ = red) on this code path
//      per the D-08 handoff rule. Phase 14 raised the red threshold to 66 for
//      cleaner thirds — the shim absorbs that shift so a legacy consumer whose
//      pixel-level visual depended on the old boundary does not silently change
//      one project from red to amber on the 61–65 fence.
//
// There is no business logic of our own here. Adding any new weight, threshold,
// or signal rule belongs in `lib/risk/`.

// ---------------------------------------------------------------------------
// Phase 12 public types — preserved verbatim
// ---------------------------------------------------------------------------

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
// inline style objects without needing a CSSStyleDeclaration lookup. Phase 14's
// `RISK_LEVEL_COLORS` uses the key `amber` instead of `yellow` — we cannot
// re-export it directly because the Phase 12 key set must remain.
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

// Frozen at Phase 12 values for backward compatibility. The Phase 14 engine
// uses its own per-dimension caps + points under `lib/risk/` and does not
// reference this table — but the constant is part of the documented Phase 12
// public surface, so we preserve it verbatim. Plan 04 makes no behavioral
// promise that these weights match the engine internals.
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

// ---------------------------------------------------------------------------
// Internal — engine signal → Phase 12 signal mapping
// ---------------------------------------------------------------------------

// Map the Phase 14 RiskSignal.source field to the Lucide icon name the Phase 12
// signal shape uses. The chargeback-specific codes override below with
// `ShieldAlert` because Phase 12 visually grouped formal-dispute/review-threat
// surfaces under that icon.
const SOURCE_ICON: Record<RiskSignal['source'], string> = {
  projects: 'CreditCard',
  responses: 'Layers',
  contracts: 'FileText',
}

// Signal codes that should override SOURCE_ICON to render as ShieldAlert in the
// Phase 12 visual — matches the original SIGNAL_RULES grouping that put
// dispute_response and review_threat under that icon.
function isShieldAlertCode(code: string): boolean {
  return (
    code.startsWith('chargeback') ||
    code.startsWith('dispute') ||
    code.startsWith('review')
  )
}

// Re-derive the Phase 12 level band from a Phase 14 composite score using the
// OLD thresholds (61+ red, 26+ yellow). Intentional — see file-header note on
// the D-08 handoff rule.
function phase12LevelFromComposite(composite: number): ClientRiskLevel {
  if (composite >= 61) return 'red'
  if (composite >= 26) return 'yellow'
  return 'green'
}

// ---------------------------------------------------------------------------
// Public adapter — Phase 12 surface, Phase 14 internals
// ---------------------------------------------------------------------------

/**
 * Phase 12 compat adapter. Delegates all scoring to the Phase 14 engine
 * (`computeRisk`) and translates the result back into the Phase 12
 * `ClientRiskResult` shape:
 *
 *   - `score`  := engine composite (0–100)
 *   - `level`  := Phase 12 band derived from the composite using the OLD 61+
 *                 boundary (preserving the legacy visual on this code path)
 *   - `signals := [payment, scope, chargeback].flatMap(d => d.signals)`,
 *                 filtered to `points > 0` (Phase 12 never surfaced negative
 *                 signals — the on-time bonus is internal-only), then mapped
 *                 to `{ icon, label }` via the SOURCE_ICON table above.
 *
 * The Phase 14 engine takes a full `Project` row. The Phase 12 signature
 * accepted only a `Pick<Project, ...>` subset — we accept the same subset and
 * pad in the optional fields the engine needs but a Phase 12 caller may not
 * have supplied. None of the padded fields contribute signals when absent,
 * so callers see no behavior change beyond the engine's improved coverage.
 */
export function computeClientRisk(
  project: Pick<Project, 'payment_due_date' | 'payment_received_at'> & {
    id?: string
    user_id?: string
    contract_id?: string | null
    title?: string
    client_name?: string
    client_email?: string | null
    project_value?: number | null
    currency?: string
    status?: string
    notes?: string | null
    payment_amount?: number | null
    created_at?: string
    contracts?: Project['contracts']
    defense_responses?: Project['defense_responses'] | null
  },
): ClientRiskResult {
  // Pad the Phase 12 input subset into a full Project the engine can consume.
  // Synthetic defaults are inert — the engine reads only:
  //   payment_due_date, payment_received_at, project_value, contracts.analysis,
  //   defense_responses[*].{tool_type, was_sent, created_at}
  // Every other Project field is unused by `computeRisk` so the defaults below
  // never influence scoring.
  const fullProject: Project = {
    id: project.id ?? '',
    user_id: project.user_id ?? '',
    contract_id: project.contract_id ?? null,
    title: project.title ?? '',
    client_name: project.client_name ?? '',
    client_email: project.client_email ?? null,
    project_value: project.project_value ?? null,
    currency: project.currency ?? 'USD',
    status: project.status ?? '',
    notes: project.notes ?? null,
    payment_due_date: project.payment_due_date,
    payment_amount: project.payment_amount ?? null,
    payment_received_at: project.payment_received_at,
    created_at: project.created_at ?? '',
    contracts: project.contracts ?? null,
    defense_responses: project.defense_responses ?? [],
  }

  const r = computeRisk(fullProject)

  // Collapse the engine's per-dimension signals into a flat Phase 12 array.
  // Filter out non-positive contributions (e.g. the on-time bonus -10) — Phase
  // 12 never surfaced negative signals; the bonus only ever lowered the score.
  const engineSignals: RiskSignal[] = [
    ...r.dimensions.payment.signals,
    ...r.dimensions.scope.signals,
    ...r.dimensions.chargeback.signals,
  ].filter((s) => s.points > 0)

  const signals: ClientRiskSignal[] = engineSignals.map((s) => ({
    icon: isShieldAlertCode(s.code) ? 'ShieldAlert' : SOURCE_ICON[s.source],
    label: s.label,
  }))

  return {
    score: r.composite,
    level: phase12LevelFromComposite(r.composite),
    signals,
  }
}
