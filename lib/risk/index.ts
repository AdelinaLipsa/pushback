import type {
  ContractAnalysis,
  DefenseResponse,
  Project,
} from '@/types'
import { pickNextAction } from './actions'
import { scoreChargeback } from './chargeback'
import { pickMitigationAction } from './mitigations'
import { scorePayment } from './payment'
import { scoreScope } from './scope'
import type {
  DimensionScore,
  RiskDimension,
  RiskInput,
  RiskResult,
  RiskSignal,
} from './types'
import { COMPOSITE_WEIGHTS, levelFromScore } from './weights'

// Phase 14 — Public orchestrator and single import surface for the risk engine.
//
// This file is the only place callers should import from: `@/lib/risk`. The
// per-dimension scorers, the weights/thresholds module, and the static action
// + mitigation tables are deliberately treated as internal — Plan 03 wires the
// UI strictly against `computeRisk` and the re-exported types/constants below.
//
// Determinism (D-26 / success criteria 1): the only non-pure input is the
// optional `today` parameter, which is normalised to an ISO string exactly
// once at the top of `computeRisk`. After that point the function is pure CPU
// over its inputs. No `new Date()` calls happen anywhere downstream.
//
// Compute budget (D-24): each call performs three O(n) scans over
// `defense_responses` (one per scorer), a constant-time weighted sum, and one
// constant-size mitigation simulation. At the ≤50-sent-response volume D-24
// targets, this completes in well under 50ms per project on commodity hardware.

// ---------------------------------------------------------------------------
// Public re-exports — `import { computeRisk, RISK_LEVEL_COLORS } from '@/lib/risk'`
// ---------------------------------------------------------------------------

export type {
  DimensionScore,
  RiskDimension,
  RiskInput,
  RiskResult,
  RiskSignal,
} from './types'
export type { RiskLevel } from './types'
export {
  COMPOSITE_WEIGHTS,
  LEVEL_THRESHOLDS,
  RISK_LEVEL_COLORS,
  levelFromScore,
} from './weights'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000

/**
 * Known clause-vocabulary tokens. A clause is "present" on a project iff one of
 * these tokens appears (case-insensitive, word-boundary) in either a
 * `flagged_clauses[].title` or a `positive_notes[]` string from the project's
 * ContractAnalysis. See `deriveContractClauses` below.
 *
 * Locked to the exact set the Plan 01 scorers check via `contractClauses.includes`
 * — keep in sync with `lib/risk/{payment,scope}.ts`.
 */
const KNOWN_CLAUSE_TOKENS = [
  'late_fee',
  'kill_fee',
  'payment_schedule',
  'scope',
  'revision_cap',
] as const

type ClauseToken = (typeof KNOWN_CLAUSE_TOKENS)[number]

/**
 * Display synonyms for each clause token. Real-world contract-analysis text
 * uses human language ("Late Fee Clause", "Payment schedule", "Revision cap")
 * rather than the snake_case token. We accept any of the synonyms below as
 * evidence the clause is present, case-insensitively. The token itself is
 * always also accepted so an explicit `clauses_present`-style array still
 * works if a future analyzer emits one.
 */
const CLAUSE_SYNONYMS: Record<ClauseToken, readonly string[]> = {
  late_fee: ['late_fee', 'late fee', 'late-fee'],
  kill_fee: ['kill_fee', 'kill fee', 'kill-fee', 'termination fee'],
  payment_schedule: [
    'payment_schedule',
    'payment schedule',
    'payment milestone',
    'milestone payment',
  ],
  scope: ['scope', 'scope of work', 'sow', 'statement of work'],
  revision_cap: [
    'revision_cap',
    'revision cap',
    'revisions cap',
    'revision limit',
    'revision policy',
  ],
}

/**
 * Case-insensitive whole-word search across a haystack. Avoids partial-token
 * false positives (e.g. the literal string "scope" inside "telescope").
 */
function haystackIncludesToken(haystack: string, needle: string): boolean {
  if (haystack.length === 0 || needle.length === 0) return false
  const hay = haystack.toLowerCase()
  const ndl = needle.toLowerCase()
  const idx = hay.indexOf(ndl)
  if (idx === -1) return false
  const before = idx === 0 ? '' : hay[idx - 1]
  const after = idx + ndl.length >= hay.length ? '' : hay[idx + ndl.length]
  const isBoundary = (c: string): boolean =>
    c === '' || !/[a-z0-9_]/.test(c)
  return isBoundary(before) && isBoundary(after)
}

/**
 * Derive a `clauses_present`-shaped array from a ContractAnalysis. The locked
 * ContractAnalysis shape (see types/index.ts) does NOT expose a literal
 * `clauses_present` array — it exposes `flagged_clauses[].title` and
 * `positive_notes[]` strings. We scan those for any of the synonyms in
 * `CLAUSE_SYNONYMS` and emit the canonical token when matched.
 *
 * Empty analysis → empty array → all clause-gap signals fire (correct default
 * for "no contract on file"). Same precedent as the Plan 01 scorers, which
 * assume an empty `contractClauses` array means "no contract".
 */
function deriveContractClauses(analysis: ContractAnalysis | null | undefined): string[] {
  if (analysis === null || analysis === undefined) return []

  // Aggregate every searchable string in one bag — easier to reason about than
  // per-field branching, and the token search is whole-word so cross-field
  // matches are still safe.
  const haystacks: string[] = []
  if (Array.isArray(analysis.flagged_clauses)) {
    for (const fc of analysis.flagged_clauses) {
      if (typeof fc.title === 'string') haystacks.push(fc.title)
    }
  }
  if (Array.isArray(analysis.positive_notes)) {
    for (const note of analysis.positive_notes) {
      if (typeof note === 'string') haystacks.push(note)
    }
  }

  const present = new Set<ClauseToken>()
  for (const token of KNOWN_CLAUSE_TOKENS) {
    const synonyms = CLAUSE_SYNONYMS[token]
    outer: for (const hay of haystacks) {
      for (const syn of synonyms) {
        if (haystackIncludesToken(hay, syn)) {
          present.add(token)
          break outer
        }
      }
    }
  }
  return Array.from(present)
}

/** Sub-projection of DefenseResponse needed by the scorers (D-14). */
type SentResponseLite = { tool_type: DefenseResponse['tool_type']; created_at: string }

/**
 * Build the `sentResponses` array per D-14: only `was_sent === true` entries
 * contribute. Preserves the order of the input array so any deterministic
 * downstream tie-breaks (e.g. "first signal wins") remain stable.
 */
function buildSentResponses(
  responses: DefenseResponse[] | undefined | null,
): SentResponseLite[] {
  if (responses === undefined || responses === null) return []
  const out: SentResponseLite[] = []
  for (const r of responses) {
    if (r.was_sent === true) {
      out.push({ tool_type: r.tool_type, created_at: r.created_at })
    }
  }
  return out
}

/**
 * Days since the most recent sent response (anchored on `todayIso`). Returns
 * null when no responses have been sent — the chargeback scorer's
 * `silence_14d` signal treats null as "no contact ever", which is correct
 * silence behaviour when paired with an unpaid invoice.
 */
function computeDaysSinceLastResponse(
  sentResponses: SentResponseLite[],
  todayIso: string,
): number | null {
  if (sentResponses.length === 0) return null
  const todayMs = new Date(todayIso).getTime()
  if (Number.isNaN(todayMs)) return null
  let maxCreatedMs = -Infinity
  for (const r of sentResponses) {
    const ms = new Date(r.created_at).getTime()
    if (!Number.isNaN(ms) && ms > maxCreatedMs) {
      maxCreatedMs = ms
    }
  }
  if (maxCreatedMs === -Infinity) return null
  return Math.floor((todayMs - maxCreatedMs) / MS_PER_DAY)
}

/**
 * Composite per D-18: weighted sum, rounded to integer, clamped to [0, 100].
 * Consumers render integer badges (Phase 12 D-04 visual carryover) so we
 * commit the round at the engine boundary — never punt it to the UI.
 */
function computeComposite(payment: number, scope: number, chargeback: number): number {
  const raw =
    COMPOSITE_WEIGHTS.payment * payment +
    COMPOSITE_WEIGHTS.scope * scope +
    COMPOSITE_WEIGHTS.chargeback * chargeback
  return Math.max(0, Math.min(100, Math.round(raw)))
}

/**
 * Pick the dimension with the largest raw score. Tie-break in declared order
 * `payment > scope > chargeback` (deterministic — D-26 reproducibility). The
 * declared order matches the order PaymentRisk is weighted highest in D-07,
 * so on ties the most actionable dimension wins.
 */
function pickTopDimension(
  payment: DimensionScore,
  scope: DimensionScore,
  chargeback: DimensionScore,
): RiskDimension {
  if (payment.score >= scope.score && payment.score >= chargeback.score) {
    return 'payment'
  }
  if (scope.score >= chargeback.score) {
    return 'scope'
  }
  return 'chargeback'
}

/**
 * Pick the highest-points signal in a dimension. Ties are broken by array
 * order — each Plan 01 scorer emits signals in a deterministic order, so the
 * first signal at the max wins reproducibly. Returns null on empty arrays.
 */
function pickTopSignal(signals: RiskSignal[]): RiskSignal | null {
  if (signals.length === 0) return null
  let best = signals[0]
  for (let i = 1; i < signals.length; i++) {
    if (signals[i].points > best.points) {
      best = signals[i]
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Compute the locked D-06 `RiskResult` for a project.
 *
 * Pure for a given `(project, today)` pair: same inputs → identical output.
 * No DB access, no fetch, no async, no LLM. The orchestrator is the only
 * place that knows how to project a `Project` row (with its joined
 * `contracts` and `defense_responses`) into the typed `RiskInput` bundle
 * the scorers expect.
 *
 * @param project — already loaded via the caller's RLS-scoped query.
 * @param today — optional override (Date or ISO string). Defaults to "now".
 *   The dashboard insight card passes a single anchor for all projects so
 *   the per-project order is reproducible within a request (D-25).
 */
export function computeRisk(
  project: Project,
  today?: Date | string,
): RiskResult {
  // Normalise `today` to an ISO string exactly once. Every downstream call
  // anchors on this string, so identical inputs always yield identical output.
  let todayIso: string
  if (today === undefined) {
    todayIso = new Date().toISOString()
  } else if (typeof today === 'string') {
    todayIso = today
  } else {
    todayIso = today.toISOString()
  }

  // Build the typed input bundle. Each piece of the projection is documented
  // alongside the corresponding RiskInput field in lib/risk/types.ts.
  const sentResponses = buildSentResponses(project.defense_responses)
  const contractClauses = deriveContractClauses(project.contracts?.analysis)
  const daysSinceLastResponse = computeDaysSinceLastResponse(sentResponses, todayIso)

  const input: RiskInput = {
    projectId: project.id,
    today: todayIso,
    paymentDueDate: project.payment_due_date,
    paymentReceivedAt: project.payment_received_at,
    projectValue: project.project_value,
    contractClauses,
    sentResponses,
    daysSinceLastResponse,
  }

  // Three independent pure scorers (D-01). Order is irrelevant for output but
  // we call them in declared dimension order so a future profile/log step can
  // be added without re-ordering callers.
  const payment = scorePayment(input)
  const scope = scoreScope(input)
  const chargeback = scoreChargeback(input)

  const composite = computeComposite(payment.score, scope.score, chargeback.score)
  const level = levelFromScore(composite)
  const topDimension = pickTopDimension(payment, scope, chargeback)
  const nextAction = pickNextAction(level, topDimension)

  // topMitigation per D-20: simulate "if I removed this signal, the composite
  // would drop by X points". For green, the recommended next action is "no
  // action needed" — there is no actionable lever, so return null.
  let topMitigation: RiskResult['topMitigation'] = null
  if (level !== 'green') {
    const dimensions = { payment, scope, chargeback }
    let chosenDimension: RiskDimension = topDimension
    let chosenSignal = pickTopSignal(dimensions[topDimension].signals)

    // Edge case (D-20): top dimension has zero signals — composite was pulled
    // up by other dimensions. Fall back to the highest-points signal across
    // all three, scanning in declared dimension order to break ties.
    if (chosenSignal === null) {
      for (const dim of ['payment', 'scope', 'chargeback'] as const) {
        const candidate = pickTopSignal(dimensions[dim].signals)
        if (candidate !== null) {
          if (chosenSignal === null || candidate.points > chosenSignal.points) {
            chosenSignal = candidate
            chosenDimension = dim
          }
        }
      }
    }

    if (chosenSignal !== null) {
      const action = pickMitigationAction(chosenSignal.code)
      if (action !== null) {
        const oldDimScore = dimensions[chosenDimension].score
        // Mirror the per-scorer floor/cap: subtracting points cannot drop the
        // dimension below 0, and clamp keeps the simulated value sane even if
        // a future signal ever carried negative points.
        const newDimScore = Math.max(0, Math.min(100, oldDimScore - chosenSignal.points))
        const newComposite = computeComposite(
          chosenDimension === 'payment' ? newDimScore : payment.score,
          chosenDimension === 'scope' ? newDimScore : scope.score,
          chosenDimension === 'chargeback' ? newDimScore : chargeback.score,
        )
        const deltaPoints = composite - newComposite
        topMitigation = {
          dimension: chosenDimension,
          action,
          deltaPoints,
        }
      }
    }
  }

  return {
    composite,
    level,
    nextAction,
    dimensions: { payment, scope, chargeback },
    topMitigation,
  }
}
