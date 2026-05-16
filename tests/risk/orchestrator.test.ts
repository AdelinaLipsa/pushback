import { describe, it, expect } from 'vitest'
import { computeRisk } from '@/lib/risk'
import { levelFromScore } from '@/lib/risk/weights'
import { MITIGATION_TABLE } from '@/lib/risk/mitigations'
import type { ContractAnalysis, DefenseResponse, Project } from '@/types'

// Phase 14 — Plan 04, orchestrator integration tests for computeRisk.
//
// All tests anchor on a fixed `today` ISO string per D-26 (reproducibility,
// success criteria 1). `computeRisk` is otherwise pure.

const TODAY = '2026-05-17T00:00:00.000Z'

/**
 * Build a synthetic `ContractAnalysis` whose `positive_notes` list contains the
 * canonical clause tokens we want the orchestrator's `deriveContractClauses`
 * helper to see as "present". The orchestrator scans these notes for the
 * locked synonym set in `lib/risk/index.ts`.
 */
function analysisWithClauses(present: readonly string[]): ContractAnalysis {
  return {
    summary: '',
    risk_score: 0,
    risk_level: 'low',
    verdict: '',
    positive_notes: [...present],
  }
}

const FULL_CLAUSES = analysisWithClauses([
  'late fee',
  'kill fee',
  'payment schedule',
  'scope',
  'revision cap',
])

function makeResponse(
  tool_type: DefenseResponse['tool_type'],
  created_at: string,
  was_sent = true,
): DefenseResponse {
  return {
    id: `r-${tool_type}-${created_at}`,
    project_id: 'p1',
    user_id: 'u1',
    tool_type,
    situation: '',
    extra_context: {},
    response: '',
    was_copied: false,
    was_sent,
    created_at,
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    user_id: 'u1',
    contract_id: null,
    title: 'Test',
    client_name: 'Test client',
    client_email: null,
    project_value: null,
    currency: 'USD',
    status: 'active',
    notes: null,
    payment_due_date: null,
    payment_amount: null,
    payment_received_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    contracts: null,
    defense_responses: [],
    ...overrides,
  }
}

describe('computeRisk — orchestrator', () => {
  // -------------------------------------------------------------------------
  // Case 1: Determinism (success criteria 1)
  // -------------------------------------------------------------------------
  describe('determinism (D-26 / success criteria 1)', () => {
    it('returns deep-equal results when called twice with the same (project, today)', () => {
      const project = makeProject({
        payment_due_date: '2026-04-15T00:00:00.000Z',
        contracts: { risk_score: null, risk_level: null, analysis: null },
        defense_responses: [
          makeResponse('chargeback_threat', '2026-05-12T00:00:00.000Z'),
          makeResponse('scope_change', '2026-05-13T00:00:00.000Z'),
          makeResponse('payment_first', '2026-05-12T00:00:00.000Z'),
        ],
      })
      const a = computeRisk(project, TODAY)
      const b = computeRisk(project, TODAY)
      expect(a).toEqual(b)
    })
  })

  // -------------------------------------------------------------------------
  // Case 2: Empty / neutrally-scored project (green path lookup)
  // -------------------------------------------------------------------------
  describe('green path (empty signals)', () => {
    it('returns composite 0, level green, payment nextAction, null topMitigation for a fully-clean project', () => {
      // "Empty" in the plan-text sense means "all clauses present, no late
      // payment, no responses" — the engine's clause-gap signals fire on
      // missing contracts so a truly empty `contracts: null` project still
      // surfaces ~16 points of audit signal. Construct full clauses to test
      // the pure-zero baseline.
      const project = makeProject({
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
      })
      const result = computeRisk(project, TODAY)
      expect(result.composite).toBe(0)
      expect(result.level).toBe('green')
      // Locks the (green, payment) cell of D-19's ACTION_TABLE.
      expect(result.nextAction).toBe('Payment behavior looks healthy — no action needed.')
      expect(result.topMitigation).toBeNull()
      expect(result.dimensions.payment.score).toBe(0)
      expect(result.dimensions.scope.score).toBe(0)
      expect(result.dimensions.chargeback.score).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Case 3: Composite math (D-18) — verify the weighted-sum formula
  // -------------------------------------------------------------------------
  describe('composite math (D-18)', () => {
    it('composite always equals round(0.4*payment + 0.3*scope + 0.3*chargeback) clamped to [0,100]', () => {
      // Use a representative project that scores in all three dimensions.
      const project = makeProject({
        payment_due_date: '2026-05-07T00:00:00.000Z', // 10 days late (moderate)
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [
          makeResponse('scope_change', '2026-05-12T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-12T00:00:00.000Z'),
          makeResponse('delivery_signoff', '2026-05-12T00:00:00.000Z'),
        ],
      })
      const result = computeRisk(project, TODAY)
      const expected = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            0.4 * result.dimensions.payment.score +
              0.3 * result.dimensions.scope.score +
              0.3 * result.dimensions.chargeback.score,
          ),
        ),
      )
      expect(result.composite).toBe(expected)
    })
  })

  // -------------------------------------------------------------------------
  // Case 4: Level boundaries (D-08) — 0-25 green, 26-65 amber, 66+ red
  // -------------------------------------------------------------------------
  describe('level boundaries (D-08)', () => {
    it('levelFromScore exact thresholds: 25 green, 26 amber, 65 amber, 66 red', () => {
      expect(levelFromScore(0)).toBe('green')
      expect(levelFromScore(25)).toBe('green')
      expect(levelFromScore(26)).toBe('amber')
      expect(levelFromScore(65)).toBe('amber')
      expect(levelFromScore(66)).toBe('red')
      expect(levelFromScore(100)).toBe('red')
    })

    it('computeRisk applies levelFromScore consistently with the composite', () => {
      // Build a chargeback-light amber: composite around 30 expected.
      const project = makeProject({
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [
          makeResponse('chargeback_threat', '2026-05-12T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-13T00:00:00.000Z'),
          makeResponse('delivery_signoff', '2026-05-14T00:00:00.000Z'),
        ],
      })
      const result = computeRisk(project, TODAY)
      expect(result.level).toBe(levelFromScore(result.composite))
    })
  })

  // -------------------------------------------------------------------------
  // Case 5: Top dimension tie-break (payment > scope > chargeback)
  // -------------------------------------------------------------------------
  describe('top dimension tie-break', () => {
    it('selects payment when payment.score === scope.score (declared-order tie-break)', () => {
      // Build clauses such that payment-gap points (=18) equal scope-gap points (=18).
      // P gets no_late_fee(10) + no_kill_fee(8) = 18; S gets no_scope_clause(10) + no_revision_cap(8) = 18.
      // payment_schedule is "present" so no_payment_schedule does NOT fire.
      const analysis = analysisWithClauses(['payment schedule'])
      const project = makeProject({
        contracts: { risk_score: null, risk_level: null, analysis },
      })
      const result = computeRisk(project, TODAY)
      expect(result.dimensions.payment.score).toBe(result.dimensions.scope.score)
      // composite stays under 26 → green; nextAction grabs the green/payment cell.
      expect(result.level).toBe('green')
      expect(result.nextAction).toBe('Payment behavior looks healthy — no action needed.')
    })
  })

  // -------------------------------------------------------------------------
  // Case 6: Red/chargeback exact-string lock (D-19) — Phase 15 trigger
  // -------------------------------------------------------------------------
  describe('red/chargeback action lookup (D-19)', () => {
    it('emits the locked Phase 15 trigger sentence when (level=red, top=chargeback)', () => {
      // Construction (math worked out in the plan-execution scratchpad):
      //   payment   = late_severe(25) + 3 clause gaps(10+8+8) + 3 cadence(15) = 66
      //   scope     = 2 scope_change(8*2) + no_scope(10) + no_revision_cap(8) = 34
      //   chargeback= 3 chargeback_threat capped(60) + 2 dispute_response capped(36)
      //              + no_signoff(18) + silence_14d disabled (no_signoff already
      //              implies recent contact) — clamped at 100
      // composite = round(0.4*66 + 0.3*34 + 0.3*100) = round(66.6) = 67 → red
      // top dim   = chargeback (100 > 66 > 34)
      const project = makeProject({
        payment_due_date: '2026-04-15T00:00:00.000Z', // 32 days late
        contracts: { risk_score: null, risk_level: null, analysis: null }, // empty clauses
        defense_responses: [
          // payment cadence — 3 reminders → partial_payment_pressure (cap 15)
          makeResponse('payment_first', '2026-05-12T00:00:00.000Z'),
          makeResponse('payment_second', '2026-05-13T00:00:00.000Z'),
          makeResponse('payment_final', '2026-05-14T00:00:00.000Z'),
          // scope
          makeResponse('scope_change', '2026-05-12T00:00:00.000Z'),
          makeResponse('scope_change', '2026-05-13T00:00:00.000Z'),
          // chargeback
          makeResponse('chargeback_threat', '2026-05-12T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-13T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-14T00:00:00.000Z'),
          makeResponse('dispute_response', '2026-05-12T00:00:00.000Z'),
          makeResponse('dispute_response', '2026-05-13T00:00:00.000Z'),
        ],
      })

      const result = computeRisk(project, TODAY)

      expect(result.level).toBe('red')
      // Locks the D-19 example cell — exact string with em-dash.
      expect(result.nextAction).toBe('Compile a dispute evidence pack now — see Phase 15 trigger.')

      // Sanity: chargeback is indeed the top dimension.
      expect(result.dimensions.chargeback.score).toBeGreaterThanOrEqual(
        result.dimensions.payment.score,
      )
      expect(result.dimensions.chargeback.score).toBeGreaterThanOrEqual(
        result.dimensions.scope.score,
      )
    })
  })

  // -------------------------------------------------------------------------
  // Case 7: topMitigation (D-20) — non-null on red with payment top
  // -------------------------------------------------------------------------
  describe('topMitigation (D-20)', () => {
    it('returns a payment-dimension mitigation with positive deltaPoints when payment is top', () => {
      // Payment-dominant project: severe-late + missing clauses, plus recent
      // cadence reminders (within 14d so silence_14d does NOT fire).
      const project = makeProject({
        payment_due_date: '2026-04-15T00:00:00.000Z',
        contracts: { risk_score: null, risk_level: null, analysis: null },
        defense_responses: [
          makeResponse('payment_first', '2026-05-14T00:00:00.000Z'),
          makeResponse('payment_second', '2026-05-15T00:00:00.000Z'),
          makeResponse('payment_final', '2026-05-16T00:00:00.000Z'),
        ],
      })

      const result = computeRisk(project, TODAY)
      // Payment-dominant by construction.
      expect(result.dimensions.payment.score).toBeGreaterThan(
        result.dimensions.scope.score,
      )
      expect(result.dimensions.payment.score).toBeGreaterThan(
        result.dimensions.chargeback.score,
      )
      expect(result.level).not.toBe('green')
      expect(result.topMitigation).not.toBeNull()
      expect(result.topMitigation?.dimension).toBe('payment')

      // The highest-points payment signal is late_severe (25) — the action
      // should match its MITIGATION_TABLE entry.
      expect(result.topMitigation?.action).toBe(MITIGATION_TABLE['late_severe'])
      expect(result.topMitigation?.deltaPoints).toBeGreaterThan(0)
    })

    it('returns null topMitigation when level is green', () => {
      const project = makeProject({
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
      })
      const result = computeRisk(project, TODAY)
      expect(result.composite).toBe(0)
      expect(result.level).toBe('green')
      expect(result.topMitigation).toBeNull()
    })
  })
})
