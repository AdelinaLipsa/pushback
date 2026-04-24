export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    defense_responses: 1,
    contracts: 1,
    features: [
      '1 defense tool response',
      '1 contract analysis',
      'All 8 situation types',
      'Copy-ready messages'
    ]
  },
  pro: {
    name: 'Pro',
    price: 12,
    currency: 'EUR' as const,
    priceDisplay: '€12/month',
    defense_responses: -1,
    contracts: -1,
    features: [
      'Unlimited defense responses',
      'Unlimited contract analyses',
      'Full response history',
      'All 8 defense tools',
      'Client notes per project'
    ]
  }
}
