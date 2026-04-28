import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { checkRateLimit, billingRateLimit } from '@/lib/rate-limit'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(billingRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await createCheckoutSession(user.id, user.email ?? '')
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
