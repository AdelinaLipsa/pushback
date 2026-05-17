import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type BillingInterval = 'month' | 'year'

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  appUrl: string,
  interval: BillingInterval = 'month',
) {
  const priceId = interval === 'year'
    ? process.env.STRIPE_PRICE_ID_ANNUAL
    : process.env.STRIPE_PRICE_ID
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for interval=${interval}`)
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: userEmail,
    metadata: { user_id: userId, billing_interval: interval },
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
  })
  return session
}

export async function createBillingPortalSession(customerId: string, appUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  })
}

export async function getSubscriptionNextBillingDate(subscriptionId: string): Promise<string | null> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const periodEnd = sub.items.data[0]?.current_period_end
    if (!periodEnd) return null
    return new Date(periodEnd * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return null
  }
}
