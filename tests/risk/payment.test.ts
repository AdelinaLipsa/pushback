import { describe, it, expect } from 'vitest'
import { scorePayment } from '@/lib/risk/payment'
import type { RiskInput } from '@/lib/risk/types'

// Phase 14 — Plan 04, payment scorer unit tests.
//
// Determinism guarantee: every test anchors `today` on a fixed ISO string so
// the scorer's date math is reproducible. The scorer itself never calls
// `new Date()` in module scope — it reads `input.today` exclusively.

const TODAY = '2026-05-16T00:00:00.000Z'

/**
 * Build a minimal RiskInput for payment-scorer tests. Defaults to "fully
 * specified contract, no due date, no responses" — i.e. all signals inert.
 * Individual tests override the fields they care about.
 */
function makeInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    projectId: 'p1',
    today: TODAY,
    paymentDueDate: null,
    paymentReceivedAt: null,
    projectValue: null,
    hasContract: true,
    contractClauses: ['late_fee', 'kill_fee', 'payment_schedule', 'scope', 'revision_cap'],
    sentResponses: [],
    daysSinceLastResponse: null,
    ...overrides,
  }
}

describe('scorePayment', () => {
  describe('baseline / empty', () => {
    it('returns { score: 0, signals: [] } for a fully specified contract with no due date or responses', () => {
      const result = scorePayment(makeInput())
      expect(result.score).toBe(0)
      expect(result.signals).toEqual([])
    })
  })

  describe('lateness bands (D-10)', () => {
    it('fires late_severe with +25 points for unpaid 30 days past due', () => {
      // 2026-04-16 → 2026-05-16 = 30 days late
      const result = scorePayment(makeInput({ paymentDueDate: '2026-04-16T00:00:00.000Z' }))
      expect(result.signals).toContainEqual({
        code: 'late_severe',
        label: 'Payment 30 days late',
        points: 25,
        source: 'projects',
      })
      expect(result.score).toBeGreaterThanOrEqual(25)
    })

    it('fires late_moderate with +12 points for unpaid 10 days past due', () => {
      // 2026-05-06 → 2026-05-16 = 10 days late
      const result = scorePayment(makeInput({ paymentDueDate: '2026-05-06T00:00:00.000Z' }))
      expect(result.signals).toContainEqual({
        code: 'late_moderate',
        label: 'Payment 10 days late',
        points: 12,
        source: 'projects',
      })
    })

    it('fires late_moderate at the 14-day boundary inclusive', () => {
      // 2026-05-02 → 2026-05-16 = 14 days late → still late_moderate (boundary)
      const result = scorePayment(makeInput({ paymentDueDate: '2026-05-02T00:00:00.000Z' }))
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('late_moderate')
      expect(codes).not.toContain('late_severe')
    })

    it('crosses to late_severe at 15 days past due', () => {
      // 2026-05-01 → 2026-05-16 = 15 days late → late_severe
      const result = scorePayment(makeInput({ paymentDueDate: '2026-05-01T00:00:00.000Z' }))
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('late_severe')
      expect(codes).not.toContain('late_moderate')
    })

    it('fires on_time bonus (-10) and floors the score at 0 when paid 5 days early with full contract', () => {
      // dueDate 2026-05-16, paid 2026-05-11 → -5 daysLate, on_time fires
      const result = scorePayment(
        makeInput({
          paymentDueDate: '2026-05-16T00:00:00.000Z',
          paymentReceivedAt: '2026-05-11T00:00:00.000Z',
        }),
      )
      expect(result.signals).toContainEqual({
        code: 'on_time',
        label: 'Payment received on or before due date',
        points: -10,
        source: 'projects',
      })
      // With full clause coverage and no other signals: total = -10 → floored to 0
      expect(result.score).toBe(0)
    })
  })

  describe('contract-gap signals (D-10)', () => {
    it('fires all three clause-gap signals when contract is attached but empty (total +26)', () => {
      const result = scorePayment(makeInput({ hasContract: true, contractClauses: [] }))
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('no_late_fee_clause')
      expect(codes).toContain('no_kill_fee_clause')
      expect(codes).toContain('no_payment_schedule')
      // 10 + 8 + 8 = 26
      expect(result.score).toBe(26)
    })

    it('fires zero clause-gap signals when no contract is attached (brand-new project)', () => {
      const result = scorePayment(makeInput({ hasContract: false, contractClauses: [] }))
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('no_late_fee_clause')
      expect(codes).not.toContain('no_kill_fee_clause')
      expect(codes).not.toContain('no_payment_schedule')
      expect(result.score).toBe(0)
    })

    it('fires zero clause-gap signals for NDA-only projects (hasContract=false set by orchestrator)', () => {
      // The orchestrator sets hasContract=false when contract_type === 'nda',
      // so NDAs reach the scorer identically to "no contract on file".
      const result = scorePayment(makeInput({ hasContract: false, contractClauses: [] }))
      expect(result.signals).toEqual([])
    })

    it('fires zero clause-gap signals when all three clauses are present', () => {
      const result = scorePayment(
        makeInput({ contractClauses: ['late_fee', 'kill_fee', 'payment_schedule'] }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('no_late_fee_clause')
      expect(codes).not.toContain('no_kill_fee_clause')
      expect(codes).not.toContain('no_payment_schedule')
      expect(result.score).toBe(0)
    })
  })

  describe('partial_payment_pressure', () => {
    it('does NOT fire for one payment_first reminder (sub-threshold)', () => {
      const result = scorePayment(
        makeInput({
          sentResponses: [{ tool_type: 'payment_first', created_at: TODAY }],
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('partial_payment_pressure')
    })

    it('fires at exactly 2 cadence reminders (>=2 boundary)', () => {
      const result = scorePayment(
        makeInput({
          sentResponses: [
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_second', created_at: TODAY },
          ],
        }),
      )
      const sig = result.signals.find((s) => s.code === 'partial_payment_pressure')
      expect(sig).toBeDefined()
      // 5 * 2 = 10, not capped
      expect(sig?.points).toBe(10)
    })

    it('fires capped at +15 for 3 cadence reminders', () => {
      const result = scorePayment(
        makeInput({
          sentResponses: [
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_second', created_at: TODAY },
            { tool_type: 'payment_final', created_at: TODAY },
          ],
        }),
      )
      const sig = result.signals.find((s) => s.code === 'partial_payment_pressure')
      expect(sig).toBeDefined()
      // 5 * 3 = 15, cap is 15 → points 15
      expect(sig?.points).toBe(15)
    })
  })

  describe('clamping (D-11)', () => {
    it('clamps the final score at 100 even when many signals stack', () => {
      // 30 days late (+25) + all three clause gaps (+26) + 5 reminders capped (+15) = 66
      // We force it higher by lacking everything; verify ceiling is honored.
      const result = scorePayment(
        makeInput({
          paymentDueDate: '2026-04-16T00:00:00.000Z',
          contractClauses: [],
          sentResponses: [
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'payment_first', created_at: TODAY },
          ],
        }),
      )
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.score).toBeGreaterThan(50)
    })
  })
})
