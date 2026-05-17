export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    defense_responses: 3,
    contracts: 0,
    features: [
      '3 prepared responses to try the toolkit',
      'Browse all 23 situations',
      'No card required'
    ]
  },
  pro: {
    name: 'Pro',
    price: 20,
    priceAnnual: 200,
    annualSavingMonths: 2,
    currency: 'EUR' as const,
    priceDisplay: '€20/month',
    defense_responses: 10,
    contracts: 50,
    features: [
      '10 situations handled per month',
      '50 contract analyses per month',
      'Full clause-level risk report on every contract',
      'Reply threading — paste their reply, get the follow-up',
      'Counter-offer email drafted from your contract',
      'SOW amendments, dispute packages, kill fee invoices',
      'Analytics on what situations hit you most'
    ]
  }
}
