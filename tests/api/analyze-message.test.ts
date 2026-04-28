import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '../helpers/supabase'

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
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              tool_type: 'scope_change',
              explanation: 'Client is requesting out-of-scope work.',
              situation_context: 'Client asked for additional features after project started.',
            }),
          },
        ],
      }),
    },
  },
  CLASSIFY_SYSTEM_PROMPT: 'classify prompt',
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, acquireAnthropicSlot } from '@/lib/rate-limit'
import { anthropic } from '@/lib/anthropic'
import { POST } from '@/app/api/projects/[id]/analyze-message/route'

function makeRequest(body: unknown, projectId = 'project-1') {
  return new Request(`http://localhost/api/projects/${projectId}/analyze-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'project-1') {
  return { params: Promise.resolve({ id }) }
}

function setup(supabaseOpts: Parameters<typeof makeSupabaseMock>[0] = {}) {
  const mock = makeSupabaseMock(supabaseOpts)
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mock as any)
  return mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

const validBody = { message: 'Client is now asking for a full redesign after we agreed on the scope.' }

describe('POST /api/projects/[id]/analyze-message', () => {
  it('returns 401 when unauthenticated', async () => {
    setup({ user: null })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('returns 403 when plan gate blocks', async () => {
    setup({
      rpcMap: {
        check_and_increment_defense_responses: {
          data: { allowed: false },
          error: null,
        },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('UPGRADE_REQUIRED')
  })

  it('returns 400 for message too short without decrementing credit', async () => {
    const mock = setup()
    const res = await POST(makeRequest({ message: 'short' }), makeParams())
    expect(res.status).toBe(400)
    // Validation runs before the plan gate, so no credit is ever incremented — nothing to decrement
    expect(mock.rpc).not.toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
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

  it('returns 500 when AI returns unparseable JSON and decrements credit', async () => {
    const mock = setup()
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json at all !!!' }],
    } as any)
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/classification failed/)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 500 when AI returns JSON with invalid schema and decrements credit', async () => {
    const mock = setup()
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ tool_type: 'not_valid_tool', explanation: 'x' }) }],
    } as any)
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/unexpected classification/)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 200 with classification on success', async () => {
    setup()
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tool_type).toBe('scope_change')
    expect(body.explanation).toBeTruthy()
    expect(body.situation_context).toBeTruthy()
  })

  it('decrements credit on unhandled error', async () => {
    const mock = setup()
    vi.mocked(anthropic.messages.create).mockRejectedValueOnce(new Error('network failure'))
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })
})
