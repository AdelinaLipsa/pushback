import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { checkRateLimit, writesRateLimit } from '@/lib/rate-limit'

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Fetch profile to get Stripe subscription id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Cancel Stripe subscription immediately so they aren't billed again
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch {
      // Non-fatal — subscription may already be cancelled
    }
  }

  const admin = createAdminSupabaseClient()

  // Explicitly delete application data before removing the auth user.
  // Do not rely solely on DB cascades — not all tables may have them.
  await admin.from('defense_responses').delete().eq('user_id', user.id)
  await admin.from('contracts').delete().eq('user_id', user.id)
  await admin.from('projects').delete().eq('user_id', user.id)
  await admin.from('feedback').delete().eq('user_id', user.id)
  await admin.from('user_profiles').delete().eq('id', user.id)

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
