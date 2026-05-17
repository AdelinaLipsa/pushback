import { describe, it, expect } from 'vitest'
import { extractClauses } from '@/lib/dispute/clauses'

const SAMPLE_CONTRACT = `Scope of Work:
The Contractor shall deliver three (3) website mockups in PNG format by the Acceptance Date.

Acceptance:
Client acceptance occurs upon written approval of each deliverable. Two revision rounds are included.

Payment Terms:
50% on signing, 50% on final delivery and acceptance.

CANCELLATION
Either party may cancel with 14 days written notice. Kill fee is 30% of remaining unpaid balance for work completed.`

describe('extractClauses', () => {
  it('returns [] for null / empty contract_text', () => {
    expect(extractClauses(null, 'not_as_described')).toEqual([])
    expect(extractClauses('', 'not_as_described')).toEqual([])
    expect(extractClauses('   \n\n  ', 'not_as_described')).toEqual([])
  })

  it('not_as_described: finds Scope and Acceptance paragraphs', () => {
    const out = extractClauses(SAMPLE_CONTRACT, 'not_as_described')
    expect(out.length).toBeGreaterThanOrEqual(2)
    const headings = out.map(c => c.heading)
    expect(headings).toContain('Scope of Work')
    expect(headings).toContain('Acceptance')
  })

  it('cancelled: finds CANCELLATION paragraph including kill fee', () => {
    const out = extractClauses(SAMPLE_CONTRACT, 'cancelled')
    expect(out.length).toBeGreaterThanOrEqual(1)
    expect(out.some(c => c.paragraph.toLowerCase().includes('kill fee'))).toBe(true)
  })

  it('deduplicates paragraphs (one excerpt per paragraph even when multiple keywords match)', () => {
    const out = extractClauses(SAMPLE_CONTRACT, 'not_as_described')
    const paragraphIndices = new Set(out.map(c => c.paragraph))
    expect(paragraphIndices.size).toBe(out.length)
  })

  it('truncates paragraphs over 500 chars with ellipsis', () => {
    const long = 'Scope of Work:\n' + 'word '.repeat(200) + 'end'
    const out = extractClauses(long, 'not_as_described')
    expect(out[0]?.paragraph.length).toBeLessThanOrEqual(501)
    expect(out[0]?.paragraph.endsWith('…')).toBe(true)
  })

  it('is deterministic — same input twice yields same output', () => {
    const a = extractClauses(SAMPLE_CONTRACT, 'not_as_described')
    const b = extractClauses(SAMPLE_CONTRACT, 'not_as_described')
    expect(a).toEqual(b)
  })
})
