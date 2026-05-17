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
import { sendUpgradeEmail } from '@/lib/email'
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
        // Idempotency SELECT returns no stripe_subscription_id, so the route proceeds to UPDATE.
        // Subsequent SELECT for the upgrade email reuses the same mocked row.
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
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
    // Route makes 3 .from('user_profiles') calls in order: SELECT idempotency, UPDATE, SELECT email.
    // The UPDATE is the second call; assert that its chain.update was invoked with plan: 'pro'.
    const calls = vi.mocked(mock.from).mock.results
    const sawProUpdate = calls.some(c => {
      const updateMock = (c?.value as { update?: { mock: { calls: unknown[][] } } })?.update
      return updateMock?.mock.calls.some(args =>
        typeof args[0] === 'object' && args[0] !== null && (args[0] as { plan?: string }).plan === 'pro'
      )
    })
    expect(sawProUpdate).toBe(true)
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
    expect(mock.rpc).toHaveBeenCalledWith(
      'reset_period_usage',
      expect.objectContaining({ uid: 'user-abc' }),
    )
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
    // objectContaining so this still passes after the data-hygiene fix that
    // also nulls stripe_subscription_id (asserted strictly in a later test).
    expect(updateCall?.update).toHaveBeenCalledWith(expect.objectContaining({ plan: 'free' }))
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

  // ─── checkout.session.completed: extended coverage ──────────────────────

  it('checkout.session.completed: sends upgrade email with formatted billing details', async () => {
    setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
      },
    })
    // Fixed timestamp so the formatted date is deterministic. The handler reads
    // sub.items.data[0].current_period_end (Stripe v22 location), not the root.
    const periodEndTs = 1735689600 // 2025-01-01 UTC
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValueOnce({
      items: { data: [{ current_period_end: periodEndTs }] },
    } as never)
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: 'cus_456',
        amount_total: 2000,
        currency: 'eur',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)

    // Wait one microtask tick so the fire-and-forget sendUpgradeEmail resolves.
    await new Promise<void>((resolve) => setImmediate(resolve))

    const expectedDate = new Date(periodEndTs * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    expect(sendUpgradeEmail).toHaveBeenCalledWith('user@example.com', {
      amount: '20.00 EUR',
      nextBillingDate: expectedDate,
    })
  })

  it('checkout.session.completed: idempotency skip when subscription already recorded', async () => {
    const mock = setup({
      fromMap: {
        // Idempotency SELECT returns the SAME subscription id as the event — handler bails.
        user_profiles: { data: { stripe_subscription_id: 'sub_123' }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: 'cus_456',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    // SELECT happened once (the idempotency check). No UPDATE, no email.
    const updateCalls = vi.mocked(mock.from).mock.results.flatMap((c) => {
      const updateMock = (c?.value as { update?: { mock: { calls: unknown[][] } } })?.update
      return updateMock?.mock.calls ?? []
    })
    expect(updateCalls).toHaveLength(0)
    expect(sendUpgradeEmail).not.toHaveBeenCalled()
  })

  it('checkout.session.completed: returns 200 even when upgrade email throws', async () => {
    setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
      },
    })
    vi.mocked(sendUpgradeEmail).mockRejectedValueOnce(new Error('Resend down'))
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: 'cus_456',
        amount_total: 2000,
        currency: 'eur',
      })
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    // Flush the rejection's .catch handler.
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(sendUpgradeEmail).toHaveBeenCalledOnce()
    expect(errorSpy).toHaveBeenCalledWith('Upgrade email failed:', expect.any(Error))
    errorSpy.mockRestore()
  })

  it('checkout.session.completed: nextBillingDate is null when items[0].current_period_end is missing (v22 regression)', async () => {
    setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
      },
    })
    // Deliberately set the root-level field (the v22-WRONG path). If someone
    // regresses the handler to `sub.current_period_end`, this test fails because
    // nextBillingDate would be a formatted string instead of null.
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValueOnce({
      current_period_end: 1735689600,
      items: { data: [{}] },
    } as never)
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: 'cus_456',
        amount_total: 2000,
        currency: 'eur',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(sendUpgradeEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ nextBillingDate: null }),
    )
  })

  it('checkout.session.completed: returns 200 with no DB write when subscription is missing', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: null,
        customer: 'cus_456',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.from).not.toHaveBeenCalled()
    expect(sendUpgradeEmail).not.toHaveBeenCalled()
  })

  // ─── customer.subscription.updated ──────────────────────────────────────

  it('customer.subscription.updated: status=active → plan=pro', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.updated', { id: 'sub_123', status: 'active' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ plan: 'pro' })
  })

  it('customer.subscription.updated: status=trialing → plan=pro', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.updated', { id: 'sub_123', status: 'trialing' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ plan: 'pro' })
  })

  it('customer.subscription.updated: status=past_due → plan=free', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.updated', { id: 'sub_123', status: 'past_due' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ plan: 'free' })
  })

  it('customer.subscription.updated: status=canceled → plan=free', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.updated', { id: 'sub_123', status: 'canceled' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({ plan: 'free' })
  })

  // ─── invoice.paid: edge cases ────────────────────────────────────────────

  it('invoice.paid: accepts subscription as object (not just string)', async () => {
    const mock = setup({
      fromMap: {
        user_profiles: { data: { id: 'user-abc' }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('invoice.paid', { subscription: { id: 'sub_123' }, period_end: 1735689600 })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.rpc).toHaveBeenCalledWith(
      'reset_period_usage',
      expect.objectContaining({ uid: 'user-abc', new_period_end: new Date(1735689600 * 1000).toISOString() }),
    )
  })

  it('invoice.paid: no-op when invoice has no subscription', async () => {
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('invoice.paid', { subscription: null })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.from).not.toHaveBeenCalled()
    expect(mock.rpc).not.toHaveBeenCalled()
  })

  it('invoice.paid: no RPC when no profile matches stripe_subscription_id', async () => {
    const mock = setup({
      fromMap: {
        user_profiles: { data: null, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('invoice.paid', { subscription: 'sub_orphan' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(mock.rpc).not.toHaveBeenCalled()
  })

  // ─── ADVERSARIAL: tests that pin real bugs the current handler lets through.
  // Each one MUST fail against the unfixed code; the handler is corrected to
  // make them pass.

  it('checkout.session.completed: stores customer.id when customer is expanded to a full object', async () => {
    // Stripe can return `customer` as an expanded object (e.g. when the
    // checkout creation requested expansion). The handler's `as string` cast
    // is type-level only — at runtime, the entire object would land in the
    // stripe_customer_id column. Defensive normalization is required.
    const mock = setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: 'sub_123',
        customer: { id: 'cus_456', object: 'customer', email: 'a@b.com' },
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)

    const updateCalls = vi.mocked(mock.from).mock.results.flatMap((c) => {
      const updateMock = (c?.value as { update?: { mock: { calls: unknown[][] } } })?.update
      return updateMock?.mock.calls ?? []
    })
    const planUpdate = updateCalls.find((args) => (args[0] as { plan?: string })?.plan === 'pro')
    expect(planUpdate?.[0]).toEqual(
      expect.objectContaining({ stripe_customer_id: 'cus_456' }),
    )
  })

  it('checkout.session.completed: stores subscription.id when subscription is expanded to a full object', async () => {
    const mock = setup({
      fromMap: {
        user_profiles: { data: { email: 'user@example.com', stripe_subscription_id: null }, error: null },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('checkout.session.completed', {
        metadata: { user_id: 'user-abc' },
        subscription: { id: 'sub_123', object: 'subscription', status: 'active' },
        customer: 'cus_456',
      })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)

    const updateCalls = vi.mocked(mock.from).mock.results.flatMap((c) => {
      const updateMock = (c?.value as { update?: { mock: { calls: unknown[][] } } })?.update
      return updateMock?.mock.calls ?? []
    })
    const planUpdate = updateCalls.find((args) => (args[0] as { plan?: string })?.plan === 'pro')
    expect(planUpdate?.[0]).toEqual(
      expect.objectContaining({ stripe_subscription_id: 'sub_123' }),
    )
  })

  it('invoice.paid: returns 500 when reset_period_usage RPC errors (otherwise the quota silently fails to reset)', async () => {
    // A silently-failed RPC means the user's monthly counters don't reset on
    // renewal — they hit free-tier limits a month later for no visible reason.
    // 500 makes Stripe retry; transient failures recover, persistent ones page.
    const mock = setup({
      fromMap: {
        user_profiles: { data: { id: 'user-abc' }, error: null },
      },
      rpcMap: {
        reset_period_usage: { data: null, error: { message: 'RPC failed' } },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('invoice.paid', { subscription: 'sub_123', period_end: 1735689600 })
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest('{}'))
    expect(mock.rpc).toHaveBeenCalled()
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })

  it('customer.subscription.deleted: clears stripe_subscription_id along with plan (no stale pointer)', async () => {
    // Leaving stripe_subscription_id pointing at a deleted subscription means
    // a late-arriving event for that ID could re-match a now-downgraded user.
    const mock = setup()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.deleted', { id: 'sub_123' })
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    const updateCall = vi.mocked(mock.from).mock.results[0]?.value
    expect(updateCall?.update).toHaveBeenCalledWith({
      plan: 'free',
      stripe_subscription_id: null,
    })
  })

  it('customer.subscription.updated: returns 500 when DB update errors (parity with the deleted handler)', async () => {
    // The deleted branch returns 500 on DB error so Stripe retries; the updated
    // branch silently returns 200, which means a missed plan flip on a
    // transient DB blip would never recover.
    setup({
      fromMap: {
        user_profiles: { data: null, error: { message: 'DB error' } },
      },
    })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      fakeEvent('customer.subscription.updated', { id: 'sub_123', status: 'active' })
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
