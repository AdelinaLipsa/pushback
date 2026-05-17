import { describe, it, expect } from 'vitest'
import { rankMessages } from '@/lib/dispute/ranking'

function msg(
  over: Partial<{
    id: string
    tool_type: string
    response: string
    created_at: string
    was_sent: boolean
  }> = {},
) {
  return {
    id: over.id ?? 'r1',
    tool_type: over.tool_type ?? 'scope_change',
    response: over.response ?? '',
    created_at: over.created_at ?? '2026-01-01T00:00:00Z',
    was_sent: over.was_sent ?? false,
  }
}

const noPaymentDate = { payment_received_at: null }

describe('rankMessages', () => {
  it('returns [] for empty corpus', () => {
    expect(rankMessages([], 'not_as_described', noPaymentDate)).toEqual([])
  })

  it('single message with vocab hits scores positively', () => {
    const out = rankMessages(
      [msg({ response: 'The scope and deliverables were approved by the client.' })],
      'not_as_described',
      noPaymentDate,
    )
    expect(out).toHaveLength(1)
    expect(out[0].score).toBeGreaterThan(0)
  })

  it('messages with no vocab hits score zero', () => {
    const out = rankMessages(
      [msg({ response: 'Hello world, lovely weather.' })],
      'not_as_described',
      noPaymentDate,
    )
    expect(out[0].score).toBe(0)
  })

  it('was_sent boost: identical message sent vs unsent — sent ranks higher', () => {
    const out = rankMessages(
      [
        msg({ id: 'a', response: 'Scope was approved and deliverables signed off.', was_sent: false }),
        msg({ id: 'b', response: 'Scope was approved and deliverables signed off.', was_sent: true }),
      ],
      'not_as_described',
      noPaymentDate,
    )
    expect(out[0].responseId).toBe('b')
    expect(out[0].score).toBeCloseTo(out[1].score * 1.5, 5)
  })

  it('±7d date boost relative to payment_received_at', () => {
    const out = rankMessages(
      [
        msg({ id: 'near', response: 'Scope deliverables approved.', created_at: '2026-01-05T00:00:00Z' }),
        msg({ id: 'far', response: 'Scope deliverables approved.', created_at: '2026-02-15T00:00:00Z' }),
      ],
      'not_as_described',
      { payment_received_at: '2026-01-04T00:00:00Z' },
    )
    expect(out[0].responseId).toBe('near')
    expect(out[0].score).toBeCloseTo(out[1].score * 1.3, 5)
  })

  it('combines both boosts multiplicatively', () => {
    const out = rankMessages(
      [
        msg({ id: 'plain', response: 'Scope deliverables approved.', created_at: '2026-06-01T00:00:00Z', was_sent: false }),
        msg({ id: 'both', response: 'Scope deliverables approved.', created_at: '2026-01-05T00:00:00Z', was_sent: true }),
      ],
      'not_as_described',
      { payment_received_at: '2026-01-04T00:00:00Z' },
    )
    expect(out[0].responseId).toBe('both')
    expect(out[0].score).toBeCloseTo(out[1].score * 1.5 * 1.3, 5)
  })

  it('caps output at 15', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      msg({ id: `r${i}`, response: 'scope deliverable approved' }),
    )
    expect(rankMessages(many, 'not_as_described', noPaymentDate)).toHaveLength(15)
  })

  it('is deterministic — same inputs twice yield identical output', () => {
    const corpus = [
      msg({ id: 'a', response: 'scope approved' }),
      msg({ id: 'b', response: 'deliverable signed off' }),
      msg({ id: 'c', response: 'no relevant terms here' }),
    ]
    const a = rankMessages(corpus, 'not_as_described', noPaymentDate)
    const b = rankMessages(corpus, 'not_as_described', noPaymentDate)
    expect(a).toEqual(b)
  })

  it('ties broken by created_at descending', () => {
    const out = rankMessages(
      [
        msg({ id: 'old', response: 'scope approved', created_at: '2026-01-01T00:00:00Z' }),
        msg({ id: 'new', response: 'scope approved', created_at: '2026-06-01T00:00:00Z' }),
      ],
      'not_as_described',
      noPaymentDate,
    )
    expect(out[0].responseId).toBe('new')
  })

  it('works for all 4 dispute types without throwing', () => {
    const corpus = [msg({ response: 'cancellation kill fee unauthorized scope approved' })]
    for (const dt of ['not_as_described', 'not_received', 'cancelled', 'unauthorized'] as const) {
      const out = rankMessages(corpus, dt, noPaymentDate)
      expect(out).toHaveLength(1)
      expect(out[0].score).toBeGreaterThanOrEqual(0)
    }
  })
})
