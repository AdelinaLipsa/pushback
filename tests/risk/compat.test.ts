import { describe, it, expect } from 'vitest'
import {
  CLIENT_RISK_COLORS,
  LEVEL_LABELS,
  RISK_WEIGHTS,
  computeClientRisk,
} from '@/lib/clientRisk'
import { computeRisk } from '@/lib/risk'
import type { ContractAnalysis, DefenseResponse, Project } from '@/types'

// Phase 14 — Plan 04 compat shim tests.
//
// Validates that the Phase 12 public surface continues to honour the Phase 12
// contract while delegating internals to the new engine, and that the D-08
// handoff rule (legacy 61+ red boundary on this code path) is preserved
// regardless of Phase 14 raising red to 66.

const TODAY = '2026-05-17T00:00:00.000Z'

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
    was_sent: true,
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

describe('lib/clientRisk compat shim', () => {
  // -------------------------------------------------------------------------
  // Surface preservation
  // -------------------------------------------------------------------------
  describe('Phase 12 public surface', () => {
    it('CLIENT_RISK_COLORS keys are exactly { green, yellow, red } with Phase 12 hex values', () => {
      expect(CLIENT_RISK_COLORS).toEqual({
        green: '#22c55e',
        yellow: '#f97316',
        red: '#ef4444',
      })
    })

    it('LEVEL_LABELS keys are exactly { green, yellow, red } with Phase 12 strings', () => {
      expect(LEVEL_LABELS).toEqual({
        green: 'No concerns',
        yellow: 'Watch this client',
        red: 'High-risk client',
      })
    })

    it('RISK_WEIGHTS is still exported with Phase 12 entries', () => {
      // Spot-check a few weights — full table is locked in the Phase 12 docstring.
      expect(RISK_WEIGHTS.chargeback_threat).toBe(30)
      expect(RISK_WEIGHTS.delivery_signoff).toBe(0)
      expect(RISK_WEIGHTS.scope_change).toBe(10)
    })

    it('computeClientRisk returns the Phase 12 shape { score, level, signals }', () => {
      const result = computeClientRisk({
        payment_due_date: null,
        payment_received_at: null,
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [],
      })
      expect(result).toMatchObject({
        score: expect.any(Number),
        level: expect.stringMatching(/^(green|yellow|red)$/),
        signals: expect.any(Array),
      })
    })
  })

  // -------------------------------------------------------------------------
  // Empty / neutrally-scored project
  // -------------------------------------------------------------------------
  describe('empty project', () => {
    it('returns { score: 0, level: "green", signals: [] } when all clauses present and no responses/due date', () => {
      const result = computeClientRisk({
        payment_due_date: null,
        payment_received_at: null,
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [],
      })
      expect(result.score).toBe(0)
      expect(result.level).toBe('green')
      expect(result.signals).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // D-08 handoff rule: Phase 12 61+ boundary preserved on the shim path
  // -------------------------------------------------------------------------
  describe('Phase 12 level boundary preserved (D-08 handoff)', () => {
    it('a project whose Phase 14 composite is 61 is amber under @/lib/risk but red under @/lib/clientRisk', () => {
      // Construction targets composite = 61:
      //   payment   = late_severe(25) + 3 clause gaps(26) + 3 cadence(15)  = 66
      //   scope     = 2 scope_change(16) + no_scope(10) + no_revision(8) = 34
      //   chargeback= 3 chargeback_threat capped(60) + 1 review_threat(20)
      //              = 80, with delivery_signoff in window to neutralise
      //              no_signoff_on_delivery, and daysSinceLastResponse<14 to
      //              keep silence_14d inert
      // composite = round(0.4*66 + 0.3*34 + 0.3*80) = round(60.6) = 61
      const project = makeProject({
        payment_due_date: '2026-04-15T00:00:00.000Z',
        contracts: { risk_score: null, risk_level: null, analysis: null },
        defense_responses: [
          makeResponse('payment_first', '2026-05-12T00:00:00.000Z'),
          makeResponse('payment_second', '2026-05-13T00:00:00.000Z'),
          makeResponse('payment_final', '2026-05-14T00:00:00.000Z'),
          makeResponse('scope_change', '2026-05-12T00:00:00.000Z'),
          makeResponse('scope_change', '2026-05-13T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-12T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-13T00:00:00.000Z'),
          makeResponse('chargeback_threat', '2026-05-14T00:00:00.000Z'),
          makeResponse('review_threat', '2026-05-12T00:00:00.000Z'),
          // delivery_signoff present — neutralises no_signoff_on_delivery
          makeResponse('delivery_signoff', '2026-05-15T00:00:00.000Z'),
        ],
      })

      // Phase 14 direct path: amber (composite < 66)
      const phase14 = computeRisk(project, TODAY)
      expect(phase14.composite).toBeGreaterThanOrEqual(61)
      expect(phase14.composite).toBeLessThanOrEqual(65)
      expect(phase14.level).toBe('amber')

      // Phase 12 shim path: red (composite >= 61 under legacy boundary)
      const shim = computeClientRisk(project)
      expect(shim.score).toBe(phase14.composite)
      expect(shim.level).toBe('red')
    })
  })

  // -------------------------------------------------------------------------
  // Negative-points filtering (on_time bonus)
  // -------------------------------------------------------------------------
  describe('signal filtering', () => {
    it('does NOT surface the on_time bonus signal in the Phase 12 signals array', () => {
      // Paid 5 days early with full contract → on_time fires internally (-10),
      // floored to 0 in the dimension score. The shim must drop this signal
      // from its output (Phase 12 never surfaced negative signals).
      const result = computeClientRisk({
        payment_due_date: '2026-05-20T00:00:00.000Z',
        payment_received_at: '2026-05-15T00:00:00.000Z',
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [],
      })
      expect(result.score).toBe(0)
      expect(result.level).toBe('green')
      // Specifically: no signal carrying the on_time label.
      for (const sig of result.signals) {
        expect(sig.label).not.toMatch(/on or before due date/i)
      }
    })
  })

  // -------------------------------------------------------------------------
  // Icon mapping
  // -------------------------------------------------------------------------
  describe('icon mapping (engine source/code → Phase 12 icon)', () => {
    it('maps chargeback_threat_sent → icon "ShieldAlert"', () => {
      const result = computeClientRisk({
        payment_due_date: null,
        payment_received_at: null,
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [
          makeResponse('chargeback_threat', '2026-05-15T00:00:00.000Z'),
        ],
      })
      const icons = result.signals.map((s) => s.icon)
      expect(icons).toContain('ShieldAlert')
    })

    it('maps late_severe (source=projects) → icon "CreditCard"', () => {
      // 32 days late, full contract so only the late_severe signal fires from
      // the payment dimension.
      const result = computeClientRisk({
        payment_due_date: '2026-04-15T00:00:00.000Z',
        payment_received_at: null,
        contracts: { risk_score: null, risk_level: null, analysis: FULL_CLAUSES },
        defense_responses: [],
      })
      const lateSignal = result.signals.find((s) =>
        s.label.toLowerCase().includes('days late'),
      )
      expect(lateSignal).toBeDefined()
      expect(lateSignal?.icon).toBe('CreditCard')
    })

    it('maps no_scope_clause (source=contracts) → icon "FileText"', () => {
      // Missing scope clause but everything else present.
      const analysis = analysisWithClauses([
        'late fee',
        'kill fee',
        'payment schedule',
        'revision cap',
      ])
      const result = computeClientRisk({
        payment_due_date: null,
        payment_received_at: null,
        contracts: { risk_score: null, risk_level: null, analysis },
        defense_responses: [],
      })
      const scopeGapSignal = result.signals.find((s) =>
        s.label.toLowerCase().includes('scope clause'),
      )
      expect(scopeGapSignal).toBeDefined()
      expect(scopeGapSignal?.icon).toBe('FileText')
    })
  })
})
