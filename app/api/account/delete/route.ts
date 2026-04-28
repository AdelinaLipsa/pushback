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

  // Delete application data before removing the auth user.
  // Order matters: defense_responses first (reply_threads cascade from it),
  // then contracts (contract_analysis_pro cascades from it), then projects.
  // user_profiles is intentionally NOT deleted here — auth.admin.deleteUser
  // triggers the ON DELETE CASCADE from auth.users, so user_profiles disappears
  // atomically with the auth record (eliminates the window where a session is
  // valid but the profile row is gone).
  const { error: drErr } = await admin.from('defense_responses').delete().eq('user_id', user.id)
  if (drErr) return Response.json({ error: 'Failed to delete account data' }, { status: 500 })

  const { error: cErr } = await admin.from('contracts').delete().eq('user_id', user.id)
  if (cErr) return Response.json({ error: 'Failed to delete account data' }, { status: 500 })

  const { error: pErr } = await admin.from('projects').delete().eq('user_id', user.id)
  if (pErr) return Response.json({ error: 'Failed to delete account data' }, { status: 500 })

  const { error: fErr } = await admin.from('feedback').delete().eq('user_id', user.id)
  if (fErr) return Response.json({ error: 'Failed to delete account data' }, { status: 500 })

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
