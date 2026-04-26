import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 2592000 }] },
      }),
    },
  },
}))
vi.mock('@/lib/email', () => ({
  sendUpgradeEmail: vi.fn().mockResolvedValue(undefined),
}))

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { POST } from '@/app/api/webhooks/stripe/route'

function makeRequest(body: string, sig = 'test-sig') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  })
}

function fakeEvent(type: string, object: Record<string, unknown>) {
  return { type, data: { object } } as unknown as import('stripe').default.Event
}

function setup(supabaseOpts: Parameters<typeof makeSupabaseMock>[0] = {}) {
  const mock = makeSupabaseMock(supabaseOpts)
  vi.mocked(createAdminSupabaseClient).mockReturnValue(mock as any)
  return mock
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
})

describe('POST /api/webhooks/stripe', () => {
  it('returns 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(500)
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('returns 401 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature')
    })
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Invalid signature')
  })

  it('checkout.session.completed: updates plan to pro', async () => {
    const mock = setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com' }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: 'cus_456',
        amount_total: 1900,
        currency: 'usd',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.from).toHaveBeenCalledWith('user_profiles')
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'pro' })
    )
  })

  it('checkout.session.completed: returns 200 with no DB write when no user_id', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: {},
        subscription: 'sub_123',
        customer: 'cus_456',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('invoice.paid: calls reset_period_usage RPC', async () => {
    const mock = setup({
      fromMap: {
        user_profiles: { data: { id: 'user-abc' }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('invoice.paid', { subscription: 'sub_123' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.rpc).toHaveBeenCalledWith('reset_period_usage', { uid: 'user-abc' })
  })

  it('checkout.session.expired: clears stripe_subscription_id', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.expired', { metadata: { user_id: 'user-abc' } })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ stripe_subscription_id: null })
  })

  it('customer.subscription.deleted: downgrades plan to free', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.deleted', { id: 'sub_123' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ plan: 'free' })
  })

  it('returns 200 for unhandled event types', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('payment_method.attached', { id: 'pm_123' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect((await res.json()).received).toBe(true)
    expect(mock.from).not.toHaveBeenCalled()
  })
})
