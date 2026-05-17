import type { DisputeType, ScoredMessage } from '@/types'
import { disputeVocab } from './vocab'

type InputResponse = {
  id: string
  tool_type: string
  response: string
  created_at: string
  was_sent: boolean
}

type InputProject = {
  payment_received_at: string | null
}

const CAP = 15
const SENT_BOOST = 1.5
const DATE_BOOST = 1.3
const DATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9'\- ]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2)
}

function computeDocFreq(corpus: string[][], vocabSet: Set<string>): Map<string, number> {
  const df = new Map<string, number>()
  for (const term of vocabSet) df.set(term, 0)
  for (const doc of corpus) {
    const seen = new Set<string>()
    for (const tok of doc) {
      if (vocabSet.has(tok) && !seen.has(tok)) {
        seen.add(tok)
        df.set(tok, (df.get(tok) ?? 0) + 1)
      }
    }
  }
  return df
}

function computeTermFreq(doc: string[], vocabSet: Set<string>): Map<string, number> {
  const tf = new Map<string, number>()
  for (const tok of doc) {
    if (vocabSet.has(tok)) tf.set(tok, (tf.get(tok) ?? 0) + 1)
  }
  return tf
}

export function rankMessages(
  responses: InputResponse[],
  disputeType: DisputeType,
  project: InputProject,
): ScoredMessage[] {
  if (!responses || responses.length === 0) return []
  const vocab = disputeVocab[disputeType]
  const vocabSet = new Set(vocab)

  const tokenized = responses.map(r => tokenize(r.response ?? ''))

  const N = responses.length
  const df = computeDocFreq(tokenized, vocabSet)
  const idf = new Map<string, number>()
  for (const term of vocab) {
    const d = df.get(term) ?? 0
    idf.set(term, Math.log((N + 1) / (d + 1)) + 1)
  }

  const paymentReceivedAt = project.payment_received_at
    ? new Date(project.payment_received_at).getTime()
    : null

  const scored: ScoredMessage[] = responses.map((r, i) => {
    const tf = computeTermFreq(tokenized[i], vocabSet)
    let raw = 0
    for (const [term, count] of tf) raw += count * (idf.get(term) ?? 0)

    if (r.was_sent === true) raw *= SENT_BOOST

    if (paymentReceivedAt !== null) {
      const t = new Date(r.created_at).getTime()
      if (!isNaN(t) && Math.abs(t - paymentReceivedAt) <= DATE_WINDOW_MS) raw *= DATE_BOOST
    }

    return {
      responseId: r.id,
      toolType: r.tool_type,
      response: r.response,
      createdAt: r.created_at,
      wasSent: r.was_sent,
      score: raw,
    }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.createdAt.localeCompare(a.createdAt)
  })

  return scored.slice(0, CAP)
}
