import { DefenseToolMeta } from '@/types'

export const DEFENSE_TOOLS: DefenseToolMeta[] = [
  {
    type: 'scope_change',
    label: 'Scope Change',
    description: 'Client asking for work outside the original agreement',
    icon: '🔴',
    urgency: 'high',
    contextFields: [
      { key: 'original_scope', label: 'What was the original scope?', placeholder: 'e.g. 5-page website with 2 revision rounds', type: 'text', required: false },
      { key: 'requested_addition', label: 'What are they asking to add?', placeholder: 'e.g. Full e-commerce integration', type: 'text', required: false }
    ]
  },
  {
    type: 'payment_first',
    label: 'Payment Reminder',
    description: 'First friendly nudge — invoice 0–7 days overdue',
    icon: '💛',
    urgency: 'low',
    contextFields: [
      { key: 'invoice_amount', label: 'Invoice amount', placeholder: 'e.g. 1500', type: 'number', required: false },
      { key: 'due_date', label: 'Original due date', placeholder: 'e.g. April 15', type: 'text', required: false }
    ]
  },
  {
    type: 'payment_second',
    label: 'Payment Follow-Up',
    description: 'Firm second reminder — 8–14 days overdue, references contract',
    icon: '🟠',
    urgency: 'medium',
    contextFields: [
      { key: 'invoice_amount', label: 'Invoice amount', placeholder: 'e.g. 1500', type: 'number', required: false },
      { key: 'days_overdue', label: 'Days overdue', placeholder: 'e.g. 10', type: 'number', required: false }
    ]
  },
  {
    type: 'payment_final',
    label: 'Final Payment Notice',
    description: 'Last notice before work stops — 15+ days overdue',
    icon: '🔴',
    urgency: 'high',
    contextFields: [
      { key: 'invoice_amount', label: 'Invoice amount', placeholder: 'e.g. 1500', type: 'number', required: false },
      { key: 'days_overdue', label: 'Days overdue', placeholder: 'e.g. 22', type: 'number', required: false }
    ]
  },
  {
    type: 'revision_limit',
    label: 'Revision Limit',
    description: 'Client exceeded agreed revisions and wants more for free',
    icon: '🔁',
    urgency: 'medium',
    contextFields: [
      { key: 'revisions_agreed', label: 'Revisions in contract', placeholder: 'e.g. 2', type: 'number', required: false },
      { key: 'revisions_used', label: 'Revisions already used', placeholder: 'e.g. 3', type: 'number', required: false }
    ]
  },
  {
    type: 'kill_fee',
    label: 'Kill Fee',
    description: 'Client wants to cancel mid-project — enforce your kill fee',
    icon: '⚫',
    urgency: 'high',
    contextFields: [
      { key: 'project_value', label: 'Total project value', placeholder: 'e.g. 3000', type: 'number', required: false },
      { key: 'work_completed_pct', label: '% of work completed', placeholder: 'e.g. 60', type: 'number', required: false }
    ]
  },
  {
    type: 'delivery_signoff',
    label: 'Delivery Sign-Off',
    description: 'Project complete — get written acceptance before transferring files',
    icon: '✅',
    urgency: 'low',
    contextFields: [
      { key: 'deliverables', label: 'What did you deliver?', placeholder: 'e.g. Final website files, source code, brand assets', type: 'text', required: false }
    ]
  },
  {
    type: 'dispute_response',
    label: 'Dispute Response',
    description: 'Client unhappy, making unfair claims, or threatening a dispute',
    icon: '🔵',
    urgency: 'high',
    contextFields: []
  }
]

export const URGENCY_COLORS = {
  low: { border: '#6b7280', glow: 'rgba(107,114,128,0.12)', bg: 'rgba(107,114,128,0.08)' },
  medium: { border: '#f97316', glow: 'rgba(249,115,22,0.12)', bg: 'rgba(249,115,22,0.08)' },
  high: { border: '#ef4444', glow: 'rgba(239,68,68,0.12)', bg: 'rgba(239,68,68,0.08)' },
}

export const TOOL_LABELS: Record<string, string> = Object.fromEntries(
  DEFENSE_TOOLS.map(t => [t.type, t.label])
)
