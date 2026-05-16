import { describe, it, expect } from 'vitest'
import { scoreScope } from '@/lib/risk/scope'
import type { RiskInput } from '@/lib/risk/types'

// Phase 14 — Plan 04, scope scorer unit tests.
// Anchored on a fixed `today` ISO for determinism (D-26).

const TODAY = '2026-05-16T00:00:00.000Z'

function makeInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    projectId: 'p1',
    today: TODAY,
    paymentDueDate: null,
    paymentReceivedAt: null,
    projectValue: null,
    // Default has every scope-relevant clause present so clause-gap signals are inert
    contractClauses: ['scope', 'revision_cap'],
    sentResponses: [],
    daysSinceLastResponse: null,
    ...overrides,
  }
}

describe('scoreScope', () => {
  describe('baseline', () => {
    it('returns { score: 0, signals: [] } for no responses with full clause coverage', () => {
      const result = scoreScope(makeInput())
      expect(result.score).toBe(0)
      expect(result.signals).toEqual([])
    })

    it('returns zero contribution when sentResponses is empty (D-14 pre-filter precondition)', () => {
      // Scope scorer assumes orchestrator already filtered to was_sent === true.
      // With no entries, no per-tool signals can fire regardless of contract.
      const result = scoreScope(makeInput({ sentResponses: [] }))
      const responseSignals = result.signals.filter((s) => s.source === 'responses')
      expect(responseSignals).toEqual([])
    })
  })

  describe('per-tool caps (D-13)', () => {
    it('caps scope_change_sent at +32 for 5 sent scope_change responses', () => {
      const result = scoreScope(
        makeInput({
          sentResponses: Array.from({ length: 5 }, () => ({
            tool_type: 'scope_change' as const,
            created_at: TODAY,
          })),
        }),
      )
      const sig = result.signals.find((s) => s.code === 'scope_change_sent')
      expect(sig).toBeDefined()
      // raw 8*5 = 40 → capped to 32
      expect(sig?.points).toBe(32)
      expect(sig?.source).toBe('responses')
    })

    it('caps goalpost_shift_sent at +24 for 3 sent moving_goalposts responses', () => {
      const result = scoreScope(
        makeInput({
          sentResponses: Array.from({ length: 3 }, () => ({
            tool_type: 'moving_goalposts' as const,
            created_at: TODAY,
          })),
        }),
      )
      const sig = result.signals.find((s) => s.code === 'goalpost_shift_sent')
      expect(sig).toBeDefined()
      // raw 12*3 = 36 → capped to 24
      expect(sig?.points).toBe(24)
    })

    it('emits revision_pressure_sent and no_revision_cap as separate signals when both apply', () => {
      const result = scoreScope(
        makeInput({
          // missing 'revision_cap' but keeping 'scope'
          contractClauses: ['scope'],
          sentResponses: [{ tool_type: 'revision_limit', created_at: TODAY }],
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('revision_pressure_sent')
      expect(codes).toContain('no_revision_cap')

      const responsePts = result.signals.find((s) => s.code === 'revision_pressure_sent')?.points
      const clausePts = result.signals.find((s) => s.code === 'no_revision_cap')?.points
      expect(responsePts).toBe(6)
      expect(clausePts).toBe(8)
      expect(result.score).toBe(14)
    })

    it('uncapped sums apply when below the cap (1 scope_change = +8)', () => {
      const result = scoreScope(
        makeInput({
          sentResponses: [{ tool_type: 'scope_change', created_at: TODAY }],
        }),
      )
      const sig = result.signals.find((s) => s.code === 'scope_change_sent')
      expect(sig?.points).toBe(8)
    })
  })

  describe('contract-gap signals (D-13)', () => {
    it('does NOT fire no_scope_clause or no_revision_cap when both clauses are present', () => {
      const result = scoreScope(
        makeInput({ contractClauses: ['scope', 'revision_cap'] }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('no_scope_clause')
      expect(codes).not.toContain('no_revision_cap')
    })

    it('fires both clause-gap signals when contractClauses is empty (total +18)', () => {
      const result = scoreScope(makeInput({ contractClauses: [] }))
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('no_scope_clause')
      expect(codes).toContain('no_revision_cap')
      expect(result.score).toBe(18)
    })
  })

  describe('non-scope tools are ignored', () => {
    it('does not emit any per-tool signals for unrelated tool_types', () => {
      const result = scoreScope(
        makeInput({
          sentResponses: [
            { tool_type: 'chargeback_threat', created_at: TODAY },
            { tool_type: 'payment_first', created_at: TODAY },
            { tool_type: 'delivery_signoff', created_at: TODAY },
          ],
        }),
      )
      const responseSignals = result.signals.filter((s) => s.source === 'responses')
      expect(responseSignals).toEqual([])
    })
  })
})
