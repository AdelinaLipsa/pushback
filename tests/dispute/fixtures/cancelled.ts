import type { PackData } from '@/types'

export const fixture: PackData = {
  disputeType: 'cancelled',
  caseReference: 'CB-2026-04-12-CAN',
  generatedAt: '2026-04-15T12:00:00.000Z',
  user: { businessName: 'Adelina Lipsa', email: 'adelina@example.com' },
  project: {
    id: 'proj-003',
    title: 'Mobile app prototype',
    clientName: 'Globex Inc',
    projectValue: 4500,
    currency: 'USD',
    paymentDueDate: '2026-03-30T00:00:00.000Z',
    paymentReceivedAt: null,
    paymentAmount: null,
  },
  contractExcerpt: {
    available: true,
    clauses: [
      {
        heading: 'Cancellation',
        paragraph: 'Either party may cancel with 14 days written notice. Kill fee equals 40% of the remaining unpaid balance plus the full value of all work completed up to the cancellation date.',
        matchedKeyword: 'cancellation',
      },
      {
        heading: 'Kill Fee',
        paragraph: 'The Kill Fee shall be invoiced within 7 days of the cancellation notice and is payable in line with the original payment terms.',
        matchedKeyword: 'kill fee',
      },
    ],
  },
  timeline: [
    { when: '2026-03-30T00:00:00.000Z', label: 'Payment due', detail: null },
    { when: '2026-04-02T16:00:00.000Z', label: 'Delivery sign-off sent', detail: 'Milestones 1 and 2 work-in-progress demo' },
  ],
  rankedMessages: [
    {
      responseId: 'r-201',
      toolType: 'kill_fee',
      response: 'Per the cancellation clause, the kill fee due is USD 2,100 — covering Milestone 1 fully delivered and Milestone 2 at 80% completion.',
      createdAt: '2026-04-05T09:00:00.000Z',
      wasSent: true,
      score: 9.20,
    },
  ],
  signOffs: [],
  paymentRecord: {
    amount: null,
    currency: 'USD',
    receivedAt: null,
    dueDate: '2026-03-30T00:00:00.000Z',
    placeholder: true,
  },
}
