import type { PackData } from '@/types'

export const fixture: PackData = {
  disputeType: 'not_as_described',
  caseReference: 'CB-2026-04-12-NAD',
  generatedAt: '2026-04-15T12:00:00.000Z',
  user: { businessName: 'Adelina Lipsa', email: 'adelina@example.com' },
  project: {
    id: 'proj-001',
    title: 'Brand site redesign',
    clientName: 'Acme GmbH',
    projectValue: 2400,
    currency: 'EUR',
    paymentDueDate: '2026-03-15T00:00:00.000Z',
    paymentReceivedAt: '2026-03-18T09:30:00.000Z',
    paymentAmount: 2400,
  },
  contractExcerpt: {
    available: true,
    clauses: [
      {
        heading: 'Scope of Work',
        paragraph: 'The Contractor shall deliver three (3) homepage design mockups in PNG format by the Acceptance Date, plus two (2) revision rounds per deliverable.',
        matchedKeyword: 'scope',
      },
      {
        heading: 'Acceptance',
        paragraph: 'Client acceptance occurs upon written approval of each deliverable. Acceptance is presumed if no written objection is raised within 7 business days of delivery.',
        matchedKeyword: 'acceptance',
      },
    ],
  },
  timeline: [
    { when: '2026-03-15T00:00:00.000Z', label: 'Payment due', detail: '2400 EUR' },
    { when: '2026-03-18T09:30:00.000Z', label: 'Payment received', detail: '2400 EUR' },
    { when: '2026-03-20T10:00:00.000Z', label: 'Delivery sign-off sent', detail: 'Final homepage mockups delivered' },
  ],
  rankedMessages: [
    {
      responseId: 'r-001',
      toolType: 'delivery_signoff',
      response: 'Hi — confirming delivery of all three mockups. Acceptance window per contract is 7 business days.',
      createdAt: '2026-03-20T10:00:00.000Z',
      wasSent: true,
      score: 8.42,
    },
    {
      responseId: 'r-002',
      toolType: 'scope_change',
      response: 'Noting that the additional motion treatment you asked for falls outside the agreed scope. Happy to scope it as a follow-on.',
      createdAt: '2026-03-25T14:15:00.000Z',
      wasSent: true,
      score: 5.91,
    },
  ],
  signOffs: [
    {
      when: '2026-03-20T10:00:00.000Z',
      text: 'Hi — confirming delivery of all three mockups. Acceptance window per contract is 7 business days.',
    },
  ],
  paymentRecord: {
    amount: 2400,
    currency: 'EUR',
    receivedAt: '2026-03-18T09:30:00.000Z',
    dueDate: '2026-03-15T00:00:00.000Z',
    placeholder: false,
  },
}
