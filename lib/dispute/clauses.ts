import type { DisputeType, ClauseExcerpt } from '@/types'

export const clauseKeywords: Record<DisputeType, string[]> = {
  not_as_described: [
    'scope of work', 'scope', 'deliverable', 'deliverables', 'acceptance', 'approval', 'revision',
    'specification', 'milestone', 'sign-off', 'signoff',
  ],
  not_received: [
    'delivery', 'deliverable', 'handoff', 'hand-off', 'transfer', 'access', 'final asset',
    'completion', 'milestone',
  ],
  cancelled: [
    'cancellation', 'terminate', 'termination', 'kill fee', 'killfee', 'withdrawal',
    'refund', 'partial payment', 'work completed',
  ],
  unauthorized: [
    'authorization', 'authorize', 'consent', 'identity', 'signature', 'signed', 'invoice',
    'payment terms', 'agreed party',
  ],
}

const MAX_PARAGRAPH_CHARS = 500
const MAX_EXCERPTS_PER_TYPE = 8

function normalize(s: string): string {
  return s.toLowerCase().replace(/[‘’“”]/g, "'")
}

function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

function deriveHeading(paragraph: string, keyword: string): string {
  const firstLine = paragraph.split('\n')[0]?.trim() ?? ''
  if (
    firstLine &&
    firstLine.length < 80 &&
    /^[A-Z0-9]/.test(firstLine) &&
    (/[:.]$/.test(firstLine) || /^[A-Z][A-Z0-9 ]+$/.test(firstLine))
  ) {
    return firstLine.replace(/[:]$/, '')
  }
  return keyword.replace(/\b\w/g, c => c.toUpperCase())
}

export function extractClauses(
  contractText: string | null | undefined,
  disputeType: DisputeType,
): ClauseExcerpt[] {
  if (!contractText || contractText.trim().length === 0) return []

  const paras = paragraphs(contractText)
  if (paras.length === 0) return []

  const keywords = clauseKeywords[disputeType]
  const out: ClauseExcerpt[] = []
  const seen = new Set<number>()

  for (const kw of keywords) {
    const needle = normalize(kw)
    for (let i = 0; i < paras.length; i++) {
      if (seen.has(i)) continue
      const para = paras[i]
      if (!normalize(para).includes(needle)) continue
      seen.add(i)
      const trimmedPara =
        para.length > MAX_PARAGRAPH_CHARS
          ? para.slice(0, MAX_PARAGRAPH_CHARS).trimEnd() + '…'
          : para
      out.push({
        heading: deriveHeading(para, kw),
        paragraph: trimmedPara,
        matchedKeyword: kw,
      })
      if (out.length >= MAX_EXCERPTS_PER_TYPE) return out
    }
    if (out.length >= MAX_EXCERPTS_PER_TYPE) break
  }

  return out
}
