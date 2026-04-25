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
    price: 20,
    currency: 'EUR' as const,
    priceDisplay: '€20/month',
    defense_responses: 150,
    contracts: 50,
    features: [
      '150 defense responses/month',
      '50 contract analyses/month',
      'Full response history',
      'All 8 defense tools',
      'Client notes per project'
    ]
  }
}
