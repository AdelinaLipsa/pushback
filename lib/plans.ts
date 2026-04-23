export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    defense_responses: 3,
    contracts: 1,
    features: [
      '3 defense tool responses',
      '1 contract analysis',
      'All 8 situation types',
      'Copy-ready messages'
    ]
  },
  pro: {
    name: 'Pro',
    price: 12,
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
