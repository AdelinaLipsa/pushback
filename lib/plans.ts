export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    defense_responses: 1,
    contracts: 1,
    features: [
      '1 defense response',
      '1 contract risk analysis',
      'Access to all 21 tools',
      'No card required'
    ]
  },
  pro: {
    name: 'Pro',
    price: 20,
    currency: 'EUR' as const,
    priceDisplay: '€20/month',
    defense_responses: 150,
    contracts: 50,
    features: [
      '150 defense responses/month',
      '50 contract risk analyses/month',
      'Full response and contract history',
      'All 21 tools — full arsenal access',
      'Project-level client notes',
      'Analytics and usage patterns',
      'Document generation (NDAs, proposals, scope agreements)'
    ]
  }
}
