import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckoutSession, type BillingInterval } from '@/lib/stripe'
import { checkRateLimit, billingRateLimit } from '@/lib/rate-limit'
import { appUrlFromRequest } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(billingRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  let interval: BillingInterval = 'month'
  try {
    const body = (await request.json().catch(() => null)) as { interval?: string } | null
    if (body?.interval === 'year') interval = 'year'
  } catch {
    // body is optional — falls back to monthly
  }

  try {
    const session = await createCheckoutSession(user.id, user.email ?? '', appUrlFromRequest(request), interval)
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
