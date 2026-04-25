import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found' }, { status: 400 })
  }

  try {
    const session = await createBillingPortalSession(profile.stripe_customer_id)
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Billing portal error:', err)
    return Response.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
