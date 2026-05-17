import type { DisputeType, PackData, ClauseExcerpt } from '@/types'
import { rankMessages } from './ranking'
import { extractClauses } from './clauses'

const MAX_TIMELINE_EVENTS = 20
const CASE_REF_MAX = 80

type AssembleInput = {
  disputeType: DisputeType
  caseReference: string | null | undefined
  user: { id: string; email: string; full_name: string | null }
  project: {
    id: string
    title: string
    client_name: string
    project_value: number | null
    currency: string
    payment_due_date: string | null
    payment_received_at: string | null
    payment_amount: number | null
  }
  contract: { contract_text: string | null; clausesPresent?: string[] | null } | null
  responses: Array<{
    id: string
    tool_type: string
    response: string
    situation: string
    created_at: string
    was_sent: boolean
  }>
  now?: Date
}

function sanitizeCaseRef(s: string | null | undefined): string | null {
  if (s === null || s === undefined) return null
  const trimmed = s.replace(/[^\x20-\x7E]/g, '').trim().slice(0, CASE_REF_MAX)
  return trimmed.length > 0 ? trimmed : null
}

function businessNameFor(user: { email: string; full_name: string | null }): string {
  if (user.full_name && user.full_name.trim().length > 0) return user.full_name.trim()
  const local = user.email.split('@')[0] ?? user.email
  return local
}

export function assemblePackData(input: AssembleInput): PackData {
  const now = (input.now ?? new Date()).toISOString()
  const { project, contract, responses, disputeType } = input

  let clauses: ClauseExcerpt[] = []
  let contractAvailable = false
  if (contract && contract.contract_text && contract.contract_text.trim().length > 0) {
    const hasClausesPresent =
      contract.clausesPresent === undefined || contract.clausesPresent === null
        ? true
        : contract.clausesPresent.length > 0
    if (hasClausesPresent) {
      clauses = extractClauses(contract.contract_text, disputeType)
      contractAvailable = clauses.length > 0
    }
  }

  type TimelineEntry = { when: string; label: string; detail: string | null }
  const timeline: TimelineEntry[] = []
  if (project.payment_due_date) {
    timeline.push({
      when: project.payment_due_date,
      label: 'Payment due',
      detail: project.payment_amount !== null ? `${project.payment_amount} ${project.currency}` : null,
    })
  }
  if (project.payment_received_at) {
    timeline.push({
      when: project.payment_received_at,
      label: 'Payment received',
      detail: project.payment_amount !== null ? `${project.payment_amount} ${project.currency}` : null,
    })
  }
  for (const r of responses) {
    if (r.tool_type === 'delivery_signoff') {
      timeline.push({
        when: r.created_at,
        label: 'Delivery sign-off sent',
        detail: r.situation ? r.situation.slice(0, 120) : null,
      })
    }
  }
  timeline.sort((a, b) => a.when.localeCompare(b.when))
  const timelineCapped = timeline.slice(0, MAX_TIMELINE_EVENTS)

  const rankedMessages = rankMessages(responses, disputeType, {
    payment_received_at: project.payment_received_at,
  })

  const signOffs = responses
    .filter(r => r.tool_type === 'delivery_signoff' && r.was_sent === true)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(r => ({ when: r.created_at, text: (r.response ?? r.situation ?? '').trim() }))

  const placeholder = project.payment_amount === null && project.payment_received_at === null
  const paymentRecord = {
    amount: project.payment_amount,
    currency: project.currency,
    receivedAt: project.payment_received_at,
    dueDate: project.payment_due_date,
    placeholder,
  }

  return {
    disputeType,
    caseReference: sanitizeCaseRef(input.caseReference),
    generatedAt: now,
    user: { businessName: businessNameFor(input.user), email: input.user.email },
    project: {
      id: project.id,
      title: project.title,
      clientName: project.client_name,
      projectValue: project.project_value,
      currency: project.currency,
      paymentDueDate: project.payment_due_date,
      paymentReceivedAt: project.payment_received_at,
      paymentAmount: project.payment_amount,
    },
    contractExcerpt: { available: contractAvailable, clauses },
    timeline: timelineCapped,
    rankedMessages,
    signOffs,
    paymentRecord,
  }
}
