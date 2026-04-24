import crypto from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!process.env.CREEM_WEBHOOK_SECRET) {
    return Response.json(
      { error: 'CREEM_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('creem-signature') ?? ''
  const secret = process.env.CREEM_WEBHOOK_SECRET

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const signatureBuf = Buffer.from(signature, 'hex')

  if (
    expectedBuf.length !== signatureBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, signatureBuf)
  ) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const p = payload as Record<string, unknown>
  const eventType = p.eventType
  const object = p.object as Record<string, unknown> | undefined
  const userId = (object?.metadata as Record<string, unknown> | undefined)?.user_id

  if (!userId) return Response.json({ received: true })

  const supabase = createAdminSupabaseClient()

  if (eventType === 'subscription.active' || eventType === 'subscription.updated') {
    await supabase
      .from('user_profiles')
      .update({
        plan: 'pro',
        creem_customer_id: object.customer?.id,
        creem_subscription_id: object.id,
      })
      .eq('id', userId)
  }

  if (eventType === 'subscription.canceled' || eventType === 'subscription.expired') {
    await supabase
      .from('user_profiles')
      .update({ plan: 'free' })
      .eq('creem_subscription_id', object.id)
  }

  return Response.json({ received: true })
}
