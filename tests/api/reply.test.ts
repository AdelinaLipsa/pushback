import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock, makeChain } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  defendRateLimit: null,
  checkRateLimit: vi.fn().mockResolvedValue(null),
  acquireAnthropicSlot: vi.fn().mockResolvedValue(null),
  releaseAnthropicSlot: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"risk_signal":"backing_down","signal_explanation":"Client is accepting your terms.","follow_up":"Thanks for understanding — happy to proceed on the original scope."}' }],
      }),
    },
  },
  REPLY_ANALYSIS_SYSTEM_PROMPT: 'system prompt',
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, acquireAnthropicSlot } from '@/lib/rate-limit'
import { anthropic } from '@/lib/anthropic'
import { POST } from '@/app/api/responses/[id]/reply/route'

const mockDefenseResponse = {
  id: 'resp-1',
  tool_type: 'scope_change',
  situation: 'Client is asking for extra features beyond the original brief.',
  response: 'Here is the professional response.',
}

const mockSavedThread = {
  id: 'thread-1',
  risk_signal: 'backing_down',
  signal_explanation: 'Client is accepting your terms.',
  follow_up: 'Thanks for understanding — happy to proceed on the original scope.',
}

function makeRequest(body: unknown, responseId = 'resp-1') {
  return new Request(`http://localhost/api/responses/${responseId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'resp-1') {
  return { params: Promise.resolve({ id }) }
}

function setup(supabaseOpts: Parameters<typeof makeSupabaseMock>[0] = {}) {
  const mock = makeSupabaseMock({
    fromMap: {
      defense_responses: { data: mockDefenseResponse, error: null },
      reply_threads: { data: mockSavedThread, error: null },
    },
    ...supabaseOpts,
  })
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mock as any)
  return mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

const validBody = { client_reply: 'They said the scope change is fine with them.' }

describe('POST /api/responses/[id]/reply', () => {
  it('returns 401 when unauthenticated', async () => {
    setup({ user: null })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    setup()
    vi.mocked(checkRateLimit).mockResolvedValueOnce(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    )
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(429)
  })

  it('returns 403 UPGRADE_REQUIRED when gate blocks', async () => {
    setup({
      rpcMap: {
        check_and_increment_defense_responses: {
          data: { allowed: false, reason: 'UPGRADE_REQUIRED' },
          error: null,
        },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('UPGRADE_REQUIRED')
  })

  it('returns 403 when gate RPC errors', async () => {
    setup({
      rpcMap: {
        check_and_increment_defense_responses: { data: null, error: { message: 'DB error' } },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 for client_reply too short and decrements credit', async () => {
    const mock = setup()
    const res = await POST(makeRequest({ client_reply: 'short' }), makeParams())
    expect(res.status).toBe(400)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 400 for client_reply too long and decrements credit', async () => {
    const mock = setup()
    const res = await POST(makeRequest({ client_reply: 'x'.repeat(5001) }), makeParams())
    expect(res.status).toBe(400)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 404 when defense_response not found (IDOR) and decrements credit', async () => {
    const mock = setup({
      fromMap: {
        defense_responses: { data: null, error: null },
        reply_threads: { data: mockSavedThread, error: null },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(404)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 503 when Anthropic slot unavailable and decrements credit', async () => {
    const mock = setup()
    vi.mocked(acquireAnthropicSlot).mockResolvedValueOnce(
      Response.json({ error: 'Service at capacity' }, { status: 503 })
    )
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(503)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 500 when AI returns non-JSON and decrements credit', async () => {
    const mock = setup()
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json at all' }],
    } as any)
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/AI analysis failed/)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 500 when AI output fails schema and decrements credit', async () => {
    const mock = setup()
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ risk_signal: 'not_a_valid_signal', signal_explanation: 'x', follow_up: 'y' }) }],
    } as any)
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/unexpected result/)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 500 when reply_threads insert fails and decrements credit', async () => {
    const mock = setup({
      fromMap: {
        defense_responses: { data: mockDefenseResponse, error: null },
        reply_threads: { data: null, error: { message: 'constraint violation' } },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/Failed to save reply/)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 200 with thread fields on success', async () => {
    setup()
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('thread-1')
    expect(body.risk_signal).toBe('backing_down')
    expect(body.signal_explanation).toBeTruthy()
    expect(body.follow_up).toBeTruthy()
  })

  it('returns existing thread on 23505 duplicate (race) and refunds credit', async () => {
    const existingThread = {
      id: 'thread-1',
      risk_signal: 'backing_down',
      signal_explanation: 'Already analyzed.',
      follow_up: 'Pre-existing follow-up.',
    }

    // reply_threads first call (insert) → 23505; second call (select existing) → existingThread
    let replyCallCount = 0
    const mock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'reply_threads') {
          replyCallCount++
          return replyCallCount === 1
            ? makeChain({ data: null, error: { message: 'duplicate key', code: '23505' } as any })
            : makeChain({ data: existingThread, error: null })
        }
        return makeChain(
          table === 'defense_responses'
            ? { data: mockDefenseResponse, error: null }
            : { data: null, error: null }
        )
      }),
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'check_and_increment_defense_responses') {
          return Promise.resolve({ data: { allowed: true, period_count: 0 }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
    }
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mock as any)

    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('thread-1')
    // Credit refunded: decrement called once for the discarded duplicate analysis
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })
})
