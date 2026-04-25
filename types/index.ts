export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type DefenseTool =
  | 'scope_change'
  | 'payment_first'
  | 'payment_second'
  | 'payment_final'
  | 'revision_limit'
  | 'kill_fee'
  | 'delivery_signoff'
  | 'dispute_response'
  | 'ghost_client'
  | 'feedback_stall'
  | 'moving_goalposts'
  | 'discount_pressure'
  | 'retroactive_discount'
  | 'rate_increase_pushback'
  | 'rush_fee_demand'
  | 'ip_dispute'
  | 'chargeback_threat'
  | 'spec_work_pressure'
  | 'post_handoff_request'
  | 'review_threat'

export type ContextField = {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'number' | 'date'
  required: boolean
}

export type DefenseToolMeta = {
  type: DefenseTool
  label: string
  description: string
  icon: string
  urgency: 'low' | 'medium' | 'high'
  contextFields: ContextField[]
}

export type FlaggedClause = {
  title: string
  quote: string
  risk_level: RiskLevel
  plain_english: string
  why_it_matters: string
  pushback_language: string
}

export type MissingProtection = {
  title: string
  why_you_need_it: string
  suggested_clause: string
}

export type ContractAnalysis = {
  summary: string
  risk_score: number
  risk_level: RiskLevel
  verdict: string
  flagged_clauses: FlaggedClause[]
  missing_protections: MissingProtection[]
  positive_notes: string[]
  negotiation_priority: string[]
}

export type Plan = 'free' | 'pro'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  plan: Plan
  defense_responses_used: number
  contracts_used: number
  period_responses_used: number
  period_contracts_used: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export type Project = {
  id: string
  user_id: string
  contract_id: string | null
  title: string
  client_name: string
  client_email: string | null
  project_value: number | null
  currency: string
  status: string
  notes: string | null
  payment_due_date: string | null
  payment_amount: number | null
  payment_received_at: string | null
  created_at: string
  contracts?: { risk_score: number | null; risk_level: RiskLevel | null; analysis: ContractAnalysis | null } | null
  defense_responses?: DefenseResponse[]
}

export type Contract = {
  id: string
  user_id: string
  title: string
  original_filename: string | null
  contract_text: string | null
  anthropic_file_id: string | null
  risk_score: number | null
  risk_level: RiskLevel | null
  analysis: ContractAnalysis | null
  status: string
  created_at: string
}

export type DefenseResponse = {
  id: string
  project_id: string
  user_id: string
  tool_type: DefenseTool
  situation: string
  extra_context: Record<string, string | number>
  response: string
  was_copied: boolean
  was_sent: boolean
  created_at: string
}

export type MessageAnalysis = {
  tool_type: DefenseTool
  explanation: string
  situation_context: string
}
