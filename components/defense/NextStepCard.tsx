import { DefenseTool } from '@/types'

const NEXT_STEP_TEXT: Record<DefenseTool, string> = {
  payment_first: "If no payment in 7 days: send the firm follow-up. Come back and use 'Payment Follow-Up'.",
  payment_second: "If still no payment in 7 more days: send the final notice. Come back and use 'Final Payment Notice'.",
  payment_final: 'If still unpaid: consider small claims or a collections agency. Keep all records.',
  ghost_client: 'If no response in 5 business days: project is formally paused. Document the silence.',
  scope_change: "If they push back: stand firm or offer to quote the addition. Don't start the work.",
  moving_goalposts: 'If they insist: this is new scope. Do not continue without a revised agreement.',
  chargeback_threat: 'Immediately: gather and save all evidence of delivery — files sent, approvals received, communications.',
  review_threat: "Do not negotiate under threat. Document everything. Your response is on record.",
  revision_limit: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  kill_fee: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  delivery_signoff: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  dispute_response: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  feedback_stall: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  discount_pressure: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  retroactive_discount: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  rate_increase_pushback: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  rush_fee_demand: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  ip_dispute: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  spec_work_pressure: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  post_handoff_request: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  disputed_hours: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  red_flag: 'Review the flags identified and ask the suggested questions before committing to this client.',
  intake: 'Use the generated questions in your discovery call or kickoff email before starting work.',
}

interface NextStepCardProps {
  toolType: DefenseTool
}

export default function NextStepCard({ toolType }: NextStepCardProps) {
  const text = NEXT_STEP_TEXT[toolType]

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '0.625rem',
        padding: '0.875rem 1rem',
        marginTop: '1rem',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.8rem',
          color: '#52525b',
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 600, color: '#71717a', marginRight: '0.375rem' }}>
          What to do next:
        </span>
        {text}
      </p>
    </div>
  )
}
