import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Delete auth user via admin client — cascades to all user data
  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
