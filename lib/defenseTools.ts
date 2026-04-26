import { DefenseToolMeta } from '@/types'

export const DEFENSE_TOOLS: DefenseToolMeta[] = [
  {
    type: 'scope_change',
    label: 'Scope Change',
    description: 'Client asking for work outside the original agreement',
    icon: 'Layers',
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
    icon: 'Clock',
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
    icon: 'AlertTriangle',
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
    icon: 'Ban',
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
    icon: 'RefreshCw',
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
    icon: 'XCircle',
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
    icon: 'CheckCircle2',
    urgency: 'low',
    contextFields: [
      { key: 'deliverables', label: 'What did you deliver?', placeholder: 'e.g. Final website files, source code, brand assets', type: 'text', required: false }
    ]
  },
  {
    type: 'dispute_response',
    label: 'Dispute Response',
    description: 'Client unhappy, making unfair claims, or threatening a dispute',
    icon: 'ShieldAlert',
    urgency: 'high',
    contextFields: []
  },
  {
    type: 'ghost_client',
    label: 'Ghost Client',
    description: 'Client has gone completely silent mid-project, blocking progress',
    icon: 'EyeOff',
    urgency: 'medium',
    contextFields: [
      { key: 'days_silent', label: 'Days since last response', placeholder: 'e.g. 10', type: 'number', required: false },
      { key: 'project_stage', label: 'Current project stage', placeholder: 'e.g. awaiting feedback on design round 2', type: 'text', required: false }
    ]
  },
  {
    type: 'feedback_stall',
    label: 'Feedback Delay',
    description: 'Client delays are past the agreed deadline — now threatening your timeline',
    icon: 'Hourglass',
    urgency: 'medium',
    contextFields: [
      { key: 'waiting_days', label: 'Days waiting for feedback', placeholder: 'e.g. 8', type: 'number', required: false },
      { key: 'blocked_on', label: 'What are you waiting on?', placeholder: 'e.g. homepage copy approval', type: 'text', required: false },
      { key: 'original_deadline', label: 'Original delivery deadline', placeholder: 'e.g. May 1', type: 'text', required: false }
    ]
  },
  {
    type: 'moving_goalposts',
    label: 'Approved Then Rejected',
    description: 'Client approved the direction, now rejecting the final result as wrong',
    icon: 'Shuffle',
    urgency: 'high',
    contextFields: [
      { key: 'approved_stage', label: 'What did they approve?', placeholder: 'e.g. wireframes and style guide on March 10', type: 'text', required: false },
      { key: 'new_request', label: 'What are they rejecting or changing now?', placeholder: 'e.g. now want a completely different visual style', type: 'text', required: false }
    ]
  },
  {
    type: 'discount_pressure',
    label: 'Rate Negotiation',
    description: 'Client counter-offering dramatically below your quoted rate',
    icon: 'TrendingDown',
    urgency: 'medium',
    contextFields: [
      { key: 'quoted_amount', label: 'Your quoted price', placeholder: 'e.g. 3000', type: 'number', required: false },
      { key: 'their_offer', label: 'What they offered or are requesting', placeholder: 'e.g. 1200 or "can you do 40% off?"', type: 'text', required: false }
    ]
  },
  {
    type: 'retroactive_discount',
    label: 'Post-Delivery Discount Demand',
    description: 'Work is delivered — client now claims the price is too high and wants a reduction',
    icon: 'Receipt',
    urgency: 'high',
    contextFields: [
      { key: 'invoice_amount', label: 'Invoice amount', placeholder: 'e.g. 2500', type: 'number', required: false },
      { key: 'their_claim', label: 'What reason are they giving?', placeholder: 'e.g. the work took less time than expected', type: 'text', required: false }
    ]
  },
  {
    type: 'rate_increase_pushback',
    label: 'Rate Increase Pushback',
    description: 'Existing client refusing or guilt-tripping about your rate increase',
    icon: 'TrendingUp',
    urgency: 'medium',
    contextFields: [
      { key: 'old_rate', label: 'Your previous rate', placeholder: 'e.g. 75/hr', type: 'text', required: false },
      { key: 'new_rate', label: 'Your new rate', placeholder: 'e.g. 95/hr', type: 'text', required: false }
    ]
  },
  {
    type: 'rush_fee_demand',
    label: 'Rush Without Rush Fee',
    description: 'Client suddenly needs faster delivery but is not offering to pay a rush fee',
    icon: 'Zap',
    urgency: 'medium',
    contextFields: [
      { key: 'original_deadline', label: 'Original agreed deadline', placeholder: 'e.g. May 15', type: 'text', required: false },
      { key: 'new_deadline', label: 'Their demanded deadline', placeholder: 'e.g. this Friday', type: 'text', required: false }
    ]
  },
  {
    type: 'ip_dispute',
    label: 'IP / Source File Dispute',
    description: 'Client claiming ownership of source files, tools, or pre-existing assets not included in the agreement',
    icon: 'Copyright',
    urgency: 'high',
    contextFields: [
      { key: 'disputed_asset', label: 'What are they claiming?', placeholder: 'e.g. full Figma source files and component library', type: 'text', required: false }
    ]
  },
  {
    type: 'chargeback_threat',
    label: 'Chargeback Threat',
    description: 'Client threatening to dispute the charge with their bank after receiving the work',
    icon: 'CreditCard',
    urgency: 'high',
    contextFields: [
      { key: 'amount', label: 'Amount at risk', placeholder: 'e.g. 1800', type: 'number', required: false }
    ]
  },
  {
    type: 'spec_work_pressure',
    label: 'Exposure / Spec Work',
    description: 'Client requesting free or heavily discounted work for "exposure" or a portfolio piece',
    icon: 'Eye',
    urgency: 'low',
    contextFields: [
      { key: 'their_offer', label: 'What are they offering in return?', placeholder: 'e.g. exposure to their 50k followers', type: 'text', required: false }
    ]
  },
  {
    type: 'post_handoff_request',
    label: 'Post-Handoff Request',
    description: 'Project is closed and delivered — client now wants free changes',
    icon: 'PackageOpen',
    urgency: 'high',
    contextFields: [
      { key: 'handoff_date', label: 'When was the project handed off?', placeholder: 'e.g. April 20', type: 'text', required: false },
      { key: 'requested_change', label: 'What are they asking for now?', placeholder: 'e.g. update all the homepage copy', type: 'text', required: false }
    ]
  },
  {
    type: 'review_threat',
    label: 'Review Threat',
    description: 'Client threatening a public bad review or social media complaint to extract free work',
    icon: 'Star',
    urgency: 'high',
    contextFields: []
  },
  {
    type: 'disputed_hours',
    label: 'Disputed Hours',
    description: "Client on a T&M contract refuses to pay for all logged hours, claiming the work didn't take that long",
    icon: 'Timer',
    urgency: 'high',
    contextFields: [
      { key: 'hours_logged',     label: 'Hours you logged',          placeholder: 'e.g. 20',                                  type: 'number', required: false },
      { key: 'hours_accepted',   label: 'Hours client will accept',  placeholder: 'e.g. 12',                                  type: 'number', required: false },
      { key: 'hourly_rate',      label: 'Hourly rate',               placeholder: 'e.g. 85',                                  type: 'number', required: false },
      { key: 'has_time_records', label: 'Time-tracking records?',    placeholder: 'e.g. yes — Toggl / spreadsheet / calendar', type: 'text',   required: false },
    ]
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

export const DEFENSE_TOOL_VALUES = DEFENSE_TOOLS.map(t => t.type) as [string, ...string[]]
