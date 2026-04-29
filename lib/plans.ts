export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    defense_responses: 3,
    contracts: 0,
    features: [
      '3 AI responses to try the tools',
      'Access to all 23 situations',
      'No card required'
    ]
  },
  pro: {
    name: 'Pro',
    price: 20,
    currency: 'EUR' as const,
    priceDisplay: '€20/month',
    defense_responses: 10,
    contracts: 50,
    features: [
      '10 AI actions/month',
      '50 contract risk analyses/month',
      'Full contract analysis — clauses, gaps, negotiation priorities',
      'Reply threading — analyze client replies',
      'Counter-offer email from contract analysis',
      'Document generation (SOW amendments, dispute packages, kill fee invoices)',
      'Analytics and usage patterns'
    ]
  }
}
