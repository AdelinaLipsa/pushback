import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(userId: string, userEmail: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: userEmail,
    metadata: { user_id: userId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    automatic_tax: { enabled: true },
  })
  return session
}

export async function createBillingPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
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
