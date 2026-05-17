import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { checkRateLimit, billingRateLimit } from '@/lib/rate-limit'
import Stripe from 'stripe'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(billingRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  if (!process.env.STRIPE_PRICE_ID) {
    console.error('[create-subscription] STRIPE_PRICE_ID env var missing')
    return Response.json({ error: 'Billing is not configured' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'pro') {
    return Response.json({ error: 'Already subscribed' }, { status: 400 })
  }

  try {
    // 1. Resolve a usable customer. If we stored an ID before but it no longer
    //    exists in this Stripe environment (test/live env switch, customer
    //    deleted manually), the stored ID is stale — clear it and create a
    //    fresh customer.
    let customerId = profile?.stripe_customer_id ?? null
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if (existing.deleted) customerId = null
      } catch (err) {
        if (err instanceof Stripe.errors.StripeError && err.code === 'resource_missing') {
          console.warn('[create-subscription] stale stripe_customer_id, recreating customer')
          customerId = null
        } else {
          throw err
        }
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? '',
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // 2. If we already have an incomplete subscription for this user, reuse it
    //    instead of creating a new one. Every retry without this check stacks
    //    another `incomplete` subscription on the customer record, spams the
    //    user's Stripe email, and eventually trips a rate limit.
    if (profile?.stripe_subscription_id) {
      try {
        const existing = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
          expand: ['latest_invoice.payment_intent'],
        })
        if (existing.status === 'incomplete' || existing.status === 'incomplete_expired') {
          const invoice = existing.latest_invoice as { payment_intent?: { client_secret?: string | null; status?: string } } | null
          const reuseSecret = invoice?.payment_intent?.client_secret
          if (reuseSecret) {
            return Response.json({ clientSecret: reuseSecret })
          }
          // Fall through to create a new subscription below.
        } else if (existing.status === 'active' || existing.status === 'trialing') {
          // DB says not Pro yet but Stripe says active — webhook race. Surface a clear error.
          return Response.json({ error: 'Subscription already active — refresh the page' }, { status: 409 })
        }
      } catch (err) {
        if (!(err instanceof Stripe.errors.StripeError && err.code === 'resource_missing')) {
          throw err
        }
        // Stored subscription ID doesn't exist in Stripe; fall through to create a new one.
      }
    }

    // 3. Create a fresh subscription (first attempt OR previous incomplete sub was unrecoverable).
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: user.id },
    })

    await supabase
      .from('user_profiles')
      .update({ stripe_subscription_id: subscription.id })
      .eq('id', user.id)

    const invoice = subscription.latest_invoice as { payment_intent?: { client_secret?: string | null } } | null
    const clientSecret = invoice?.payment_intent?.client_secret

    if (!clientSecret) {
      console.error('[create-subscription] no client_secret on freshly created subscription', subscription.id)
      return Response.json({ error: 'Failed to initialise payment' }, { status: 500 })
    }

    return Response.json({ clientSecret })
  } catch (err) {
    // Log the real Stripe error so future 500s aren't mysterious in Vercel logs.
    if (err instanceof Stripe.errors.StripeError) {
      console.error('[create-subscription] Stripe error:', {
        type: err.type,
        code: err.code,
        message: err.message,
        param: err.param,
      })
      return Response.json({ error: err.message }, { status: 500 })
    }
    console.error('[create-subscription] unexpected error:', err)
    return Response.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
