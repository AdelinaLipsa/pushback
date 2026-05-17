export type DisputeType = 'not_as_described' | 'not_received' | 'cancelled' | 'unauthorized'

export type ClauseExcerpt = {
  heading: string
  paragraph: string
  matchedKeyword: string
}

export type ScoredMessage = {
  responseId: string
  toolType: string
  response: string
  createdAt: string
  wasSent: boolean
  score: number
}

export type PackData = {
  disputeType: DisputeType
  caseReference: string | null
  generatedAt: string
  user: {
    businessName: string
    email: string
  }
  project: {
    id: string
    title: string
    clientName: string
    projectValue: number | null
    currency: string
    paymentDueDate: string | null
    paymentReceivedAt: string | null
    paymentAmount: number | null
  }
  contractExcerpt: {
    available: boolean
    clauses: ClauseExcerpt[]
  }
  timeline: Array<{
    when: string
    label: string
    detail: string | null
  }>
  rankedMessages: ScoredMessage[]
  signOffs: Array<{
    when: string
    text: string
  }>
  paymentRecord: {
    amount: number | null
    currency: string
    receivedAt: string | null
    dueDate: string | null
    placeholder: boolean
  }
}
