import type { PackData } from '@/types'

export const fixture: PackData = {
  disputeType: 'unauthorized',
  caseReference: 'CB-2026-04-12-UNA',
  generatedAt: '2026-04-15T12:00:00.000Z',
  user: { businessName: 'Adelina Lipsa', email: 'adelina@example.com' },
  project: {
    id: 'proj-004',
    title: 'Quarterly retainer — copy',
    clientName: 'Initech',
    projectValue: 800,
    currency: 'EUR',
    paymentDueDate: '2026-03-01T00:00:00.000Z',
    paymentReceivedAt: '2026-03-01T08:45:00.000Z',
    paymentAmount: 800,
  },
  contractExcerpt: {
    available: false,
    clauses: [],
  },
  timeline: [
    { when: '2026-03-01T00:00:00.000Z', label: 'Payment due', detail: '800 EUR' },
    { when: '2026-03-01T08:45:00.000Z', label: 'Payment received', detail: '800 EUR' },
  ],
  rankedMessages: [
    {
      responseId: 'r-301',
      toolType: 'chargeback_threat',
      response: 'This retainer has been active for two quarters and was authorized in writing via the agreement signed by your finance lead on Jan 12. Happy to share the signed copy and the original invoice.',
      createdAt: '2026-03-25T11:00:00.000Z',
      wasSent: true,
      score: 6.40,
    },
  ],
  signOffs: [],
  paymentRecord: {
    amount: 800,
    currency: 'EUR',
    receivedAt: '2026-03-01T08:45:00.000Z',
    dueDate: '2026-03-01T00:00:00.000Z',
    placeholder: false,
  },
}
