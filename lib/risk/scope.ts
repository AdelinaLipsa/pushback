import type { DimensionScore, RiskInput, RiskSignal } from './types'

// Phase 14 — ScopeRisk scorer per D-12 / D-13 / D-14.
// Pure function. The orchestrator (Plan 02) pre-filters `sentResponses` to
// `was_sent === true` entries per D-14 — this scorer does NOT re-filter.
// No DB, no fetch, no async, no module-scope `new Date()`.

/**
 * Per-tool aggregation rule. Each scope-related defense tool contributes a
 * capped sum: every sent response adds `perResponse` points, but the dimension
 * does not exceed `cap` from this tool. Labels are plural-aware and tag the
 * "(capped)" suffix when the raw sum would have exceeded the cap — Plan 03's
 * evidence table renders the label verbatim.
 */
type ToolRule = {
  code: string
  perResponse: number
  cap: number
  singular: string
  plural: (n: number) => string
}

const TOOL_RULES: Record<string, ToolRule> = {
  scope_change: {
    code: 'scope_change_sent',
    perResponse: 8,
    cap: 32,
    singular: '1 scope change sent',
    plural: (n) => `${n} scope changes sent`,
  },
  revision_limit: {
    code: 'revision_pressure_sent',
    perResponse: 6,
    cap: 18,
    singular: '1 revision-limit pushback sent',
    plural: (n) => `${n} revision-limit pushbacks sent`,
  },
  moving_goalposts: {
    code: 'goalpost_shift_sent',
    perResponse: 12,
    cap: 24,
    singular: '1 goalpost-shift response sent',
    plural: (n) => `${n} goalpost-shift responses sent`,
  },
  post_handoff_request: {
    code: 'post_handoff_request_sent',
    perResponse: 10,
    cap: 20,
    singular: '1 post-handoff request sent',
    plural: (n) => `${n} post-handoff requests sent`,
  },
}

/**
 * Pure ScopeRisk scorer. No on-time bonus — scope creep does not "heal" the
 * way on-time payment does (D-13 implicit). Score is clamped to [0, 100].
 */
export function scoreScope(input: RiskInput): DimensionScore {
  const signals: RiskSignal[] = []

  // Tally sent responses per scope-related tool_type. The orchestrator has
  // already filtered to was_sent === true.
  const counts: Record<string, number> = {}
  for (const r of input.sentResponses) {
    if (TOOL_RULES[r.tool_type] !== undefined) {
      counts[r.tool_type] = (counts[r.tool_type] ?? 0) + 1
    }
  }

  // Emit a capped-sum signal per tool that fired at least once.
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

  // Contract-gap signals — D-13. Empty `contractClauses` (no contract) fires
  // both. Same precedent as the payment scorer.
  if (!input.contractClauses.includes('scope')) {
    signals.push({
      code: 'no_scope_clause',
      label: 'Contract has no scope clause',
      points: 10,
      source: 'contracts',
    })
  }
  if (!input.contractClauses.includes('revision_cap')) {
    signals.push({
      code: 'no_revision_cap',
      label: 'Contract has no revision cap',
      points: 8,
      source: 'contracts',
    })
  }

  // Sum and clamp per D-13 implicit / phase-wide D-09.
  let score = 0
  for (const s of signals) score += s.points
  score = Math.max(0, Math.min(100, score))

  return { score, signals }
}
