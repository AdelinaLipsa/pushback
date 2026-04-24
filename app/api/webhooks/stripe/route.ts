import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendUpgradeEmail } from '@/lib/email'

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.user_id
    if (!userId) return Response.json({ received: true })
    if (!session.subscription) return Response.json({ received: true })

    const { error } = await supabase
      .from('user_profiles')
      .update({
        plan: 'pro',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update user plan:', error.message)
      return Response.json({ error: 'Database update failed' }, { status: 500 })
    }

    // Fetch user email for upgrade confirmation. Reuse the admin client
    // instantiated at the top of this handler — do not create a second instance.
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileData?.email) {
      // Build BillingDetails with graceful fallbacks (per D-08).
      const billingDetails: { amount: string | null; nextBillingDate: string | null } = {
        amount:
          session.amount_total != null && session.currency
            ? `${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`
            : null,
        nextBillingDate: null,
      }

      try {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        // CRITICAL: current_period_end lives on SubscriptionItem in Stripe v22,
        // NOT on the Subscription root. Using `sub.current_period_end` silently
        // returns undefined and falls through to the fallback copy.
        const periodEnd = sub.items.data[0]?.current_period_end
        if (periodEnd) {
          billingDetails.nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' },
          )
        }
      } catch (err) {
        console.error('Failed to retrieve subscription for billing date:', err)
        // nextBillingDate stays null — email template renders the Stripe-dashboard fallback.
      }

      // Fire-and-forget: MUST NOT cause a non-2xx response (Stripe retries on 5xx
      // would trigger duplicate DB updates — idempotent but noisy).
      sendUpgradeEmail(profileData.email, billingDetails).catch((err) => {
        console.error('Upgrade email failed:', err)
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const { error } = await supabase
      .from('user_profiles')
      .update({ plan: 'free' })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Failed to downgrade user plan:', error.message)
      return Response.json({ error: 'Database update failed' }, { status: 500 })
    }
  }

  return Response.json({ received: true })
}
