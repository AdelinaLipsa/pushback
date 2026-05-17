import type { PackData } from '@/types'

export const fixture: PackData = {
  disputeType: 'not_received',
  caseReference: 'CB-2026-04-12-NR',
  generatedAt: '2026-04-15T12:00:00.000Z',
  user: { businessName: 'Adelina Lipsa', email: 'adelina@example.com' },
  project: {
    id: 'proj-002',
    title: 'Pitch deck production',
    clientName: 'Northwind Ltd',
    projectValue: 1200,
    currency: 'EUR',
    paymentDueDate: '2026-02-28T00:00:00.000Z',
    paymentReceivedAt: '2026-03-03T11:00:00.000Z',
    paymentAmount: 1200,
  },
  contractExcerpt: {
    available: true,
    clauses: [
      {
        heading: 'Delivery',
        paragraph: 'Final deliverables shall be transferred via a shared Dropbox link upon receipt of final payment. The transfer event is logged automatically by the file-sharing platform.',
        matchedKeyword: 'delivery',
      },
    ],
  },
  timeline: [
    { when: '2026-02-28T00:00:00.000Z', label: 'Payment due', detail: '1200 EUR' },
    { when: '2026-03-03T11:00:00.000Z', label: 'Payment received', detail: '1200 EUR' },
    { when: '2026-03-03T12:30:00.000Z', label: 'Files delivered via Dropbox', detail: 'Shared with vince@northwind.example' },
  ],
  rankedMessages: [
    {
      responseId: 'r-101',
      toolType: 'dispute_response',
      response: 'Confirming the Dropbox link was shared with your work email immediately after payment cleared on March 3. The platform logs receipt.',
      createdAt: '2026-03-04T09:00:00.000Z',
      wasSent: true,
      score: 7.10,
    },
    {
      responseId: 'r-102',
      toolType: 'feedback_stall',
      response: 'Following up — please confirm you were able to access the shared folder. Let me know if you need a re-share to a different address.',
      createdAt: '2026-03-18T10:00:00.000Z',
      wasSent: true,
      score: 4.55,
    },
  ],
  signOffs: [],
  paymentRecord: {
    amount: 1200,
    currency: 'EUR',
    receivedAt: '2026-03-03T11:00:00.000Z',
    dueDate: '2026-02-28T00:00:00.000Z',
    placeholder: false,
  },
}
