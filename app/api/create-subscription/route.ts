import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'pro') {
    return Response.json({ error: 'Already subscribed' }, { status: 400 })
  }

  try {
    // Reuse existing customer or create a new one with user_id in metadata
    let customerId = profile?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? '',
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID! }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: user.id },
    })

    // Store subscription ID immediately so webhook can look up user
    await supabase
      .from('user_profiles')
      .update({ stripe_subscription_id: subscription.id })
      .eq('id', user.id)

    const invoice = subscription.latest_invoice as { payment_intent?: { client_secret?: string | null } } | null
    const clientSecret = invoice?.payment_intent?.client_secret

    if (!clientSecret) {
      return Response.json({ error: 'Failed to initialise payment' }, { status: 500 })
    }

    return Response.json({ clientSecret })
  } catch (err) {
    console.error('Create subscription error:', err)
    return Response.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
