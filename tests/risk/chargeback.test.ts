import { describe, it, expect } from 'vitest'
import { scoreChargeback } from '@/lib/risk/chargeback'
import type { RiskInput } from '@/lib/risk/types'

// Phase 14 — Plan 04, chargeback scorer unit tests.
// Anchored on a fixed `today` ISO for determinism (D-26).

const TODAY = '2026-05-16T00:00:00.000Z'

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

describe('scoreChargeback', () => {
  describe('chargeback_threat cap (D-16)', () => {
    it('caps chargeback_threat_sent at +60 for 3 sent chargeback_threat responses', () => {
      const result = scoreChargeback(
        makeInput({
          sentResponses: Array.from({ length: 3 }, () => ({
            tool_type: 'chargeback_threat' as const,
            created_at: TODAY,
          })),
        }),
      )
      const sig = result.signals.find((s) => s.code === 'chargeback_threat_sent')
      expect(sig).toBeDefined()
      // raw 30*3 = 90 → cap 60
      expect(sig?.points).toBe(60)
      expect(sig?.source).toBe('responses')
    })

    it('does NOT cap at 1 response (uncapped 30 points)', () => {
      const result = scoreChargeback(
        makeInput({
          sentResponses: [{ tool_type: 'chargeback_threat', created_at: TODAY }],
        }),
      )
      const sig = result.signals.find((s) => s.code === 'chargeback_threat_sent')
      expect(sig?.points).toBe(30)
    })
  })

  describe('silence_14d gating (D-16)', () => {
    it('fires when daysSinceLastResponse=14 AND unpaid past-due invoice', () => {
      const result = scoreChargeback(
        makeInput({
          paymentDueDate: '2026-04-01T00:00:00.000Z',  // unpaid past-due
          paymentReceivedAt: null,
          daysSinceLastResponse: 14,
        }),
      )
      const sig = result.signals.find((s) => s.code === 'silence_14d')
      expect(sig).toBeDefined()
      expect(sig?.points).toBe(15)
    })

    it('does NOT fire when daysSinceLastResponse=14 but no due-date set (gating requires unpaid invoice)', () => {
      const result = scoreChargeback(
        makeInput({
          paymentDueDate: null,
          paymentReceivedAt: null,
          daysSinceLastResponse: 14,
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('silence_14d')
    })

    it('does NOT fire when daysSinceLastResponse=13 even with unpaid invoice (strict >= 14)', () => {
      const result = scoreChargeback(
        makeInput({
          paymentDueDate: '2026-04-01T00:00:00.000Z',
          paymentReceivedAt: null,
          daysSinceLastResponse: 13,
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('silence_14d')
    })

    it('does NOT fire when invoice is paid (paymentReceivedAt set)', () => {
      const result = scoreChargeback(
        makeInput({
          paymentDueDate: '2026-04-01T00:00:00.000Z',
          paymentReceivedAt: '2026-04-05T00:00:00.000Z',
          daysSinceLastResponse: 30,
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('silence_14d')
    })
  })

  describe('no_signoff_on_delivery window (D-16)', () => {
    it('fires when a sent response landed in the last 30 days and no delivery_signoff was sent', () => {
      // 10 days ago, scope_change (non-chargeback so we can isolate the signal)
      const result = scoreChargeback(
        makeInput({
          sentResponses: [{ tool_type: 'scope_change', created_at: '2026-05-06T00:00:00.000Z' }],
        }),
      )
      const sig = result.signals.find((s) => s.code === 'no_signoff_on_delivery')
      expect(sig).toBeDefined()
      expect(sig?.points).toBe(18)
    })

    it('does NOT fire when a delivery_signoff exists alongside the recent activity', () => {
      const result = scoreChargeback(
        makeInput({
          sentResponses: [
            { tool_type: 'scope_change', created_at: '2026-05-06T00:00:00.000Z' },
            { tool_type: 'delivery_signoff', created_at: '2026-05-07T00:00:00.000Z' },
          ],
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('no_signoff_on_delivery')
    })

    it('does NOT fire when there are no sent responses in the last 30 days regardless of signoff', () => {
      // 60 days ago — outside the 30-day recent window
      const result = scoreChargeback(
        makeInput({
          sentResponses: [
            { tool_type: 'scope_change', created_at: '2026-03-17T00:00:00.000Z' },
          ],
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).not.toContain('no_signoff_on_delivery')
    })

    it('fires when chargeback_threat is the recent activity (any sent response counts)', () => {
      const result = scoreChargeback(
        makeInput({
          sentResponses: [
            { tool_type: 'chargeback_threat', created_at: '2026-05-10T00:00:00.000Z' },
          ],
        }),
      )
      const codes = result.signals.map((s) => s.code)
      expect(codes).toContain('no_signoff_on_delivery')
      // and chargeback_threat_sent also fires
      expect(codes).toContain('chargeback_threat_sent')
    })
  })

  describe('clamping (D-17)', () => {
    it('clamps the final score at 100', () => {
      // 5 chargeback_threats (cap 60) + 5 review_threats (cap 40) + 5 disputes (cap 36) + silence + no_signoff = 169 → clamp 100
      const result = scoreChargeback(
        makeInput({
          paymentDueDate: '2026-04-01T00:00:00.000Z',
          daysSinceLastResponse: 20,
          sentResponses: [
            ...Array.from({ length: 5 }, () => ({ tool_type: 'chargeback_threat' as const, created_at: '2026-05-10T00:00:00.000Z' })),
            ...Array.from({ length: 5 }, () => ({ tool_type: 'review_threat' as const, created_at: '2026-05-10T00:00:00.000Z' })),
            ...Array.from({ length: 5 }, () => ({ tool_type: 'dispute_response' as const, created_at: '2026-05-10T00:00:00.000Z' })),
          ],
        }),
      )
      expect(result.score).toBe(100)
    })
  })
})
