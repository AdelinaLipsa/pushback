import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '../helpers/supabase'

// --- module mocks ---
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
        content: [{ type: 'text', text: 'Here is your professional response.' }],
      }),
    },
  },
  DEFENSE_SYSTEM_PROMPT: 'system prompt',
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, acquireAnthropicSlot } from '@/lib/rate-limit'
import { POST } from '@/app/api/projects/[id]/defend/route'

const mockProject = {
  id: 'project-1',
  title: 'Test Project',
  client_name: 'ACME Corp',
  project_value: 5000,
  currency: 'EUR',
  notes: null,
  contracts: null,
}

const mockSavedResponse = {
  id: 'resp-1',
  project_id: 'project-1',
  user_id: 'user-1',
  tool_type: 'scope_change',
  situation: 'Client is asking for extra features beyond the original brief.',
  extra_context: {},
  response: 'Here is your professional response.',
}

function makeRequest(body: unknown, projectId = 'project-1') {
  return new Request(`http://localhost/api/projects/${projectId}/defend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'project-1') {
  return { params: Promise.resolve({ id }) }
}

function setup(supabaseOpts: Parameters<typeof makeSupabaseMock>[0] = {}) {
  const mock = makeSupabaseMock({
    fromMap: {
      projects: { data: mockProject, error: null },
      user_profiles: { data: { profession: null }, error: null },
      defense_responses: { data: mockSavedResponse, error: null },
    },
    ...supabaseOpts,
  })
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mock as any)
  return mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

const validBody = {
  tool_type: 'scope_change',
  situation: 'Client is asking for extra features beyond the original brief.',
}

describe('POST /api/projects/[id]/defend', () => {
  it('returns 401 when unauthenticated', async () => {
    setup({ user: null })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns rate-limit response when rate limited', async () => {
    setup()
    vi.mocked(checkRateLimit).mockResolvedValueOnce(
      Response.json({ error: 'Too many requests' }, { status: 429 })
    )
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(429)
  })

  it('returns 403 when plan gate blocks (gate.allowed false)', async () => {
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

  it('returns 403 when plan gate RPC errors', async () => {
    setup({
      rpcMap: {
        check_and_increment_defense_responses: {
          data: null,
          error: { message: 'DB error' },
        },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid tool_type', async () => {
    const mock = setup()
    const res = await POST(
      makeRequest({ tool_type: 'not_a_real_tool', situation: 'some long enough situation text here' }),
      makeParams()
    )
    expect(res.status).toBe(400)
    // should decrement the pre-incremented credit
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 400 for situation too short', async () => {
    const mock = setup()
    const res = await POST(
      makeRequest({ tool_type: 'scope_change', situation: 'short' }),
      makeParams()
    )
    expect(res.status).toBe(400)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 400 for unknown extra_context key and decrements credit', async () => {
    const mock = setup()
    const res = await POST(
      makeRequest({
        ...validBody,
        extra_context: { unknown_key_not_valid: 'value' },
      }),
      makeParams()
    )
    expect(res.status).toBe(400)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 404 when project not found (IDOR protection) and decrements credit', async () => {
    const mock = setup({
      fromMap: {
        projects: { data: null, error: null },
        user_profiles: { data: { profession: null }, error: null },
        defense_responses: { data: null, error: null },
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

  it('returns 500 when defense_responses insert fails and decrements credit', async () => {
    const mock = setup({
      fromMap: {
        projects: { data: mockProject, error: null },
        user_profiles: { data: { profession: null }, error: null },
        defense_responses: { data: null, error: { message: 'constraint violation' } },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(500)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('returns 200 with response on success', async () => {
    setup()
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.response).toBeTruthy()
    expect(body.id).toBe('resp-1')
  })

  it('includes usage_warning when period_count >= 120', async () => {
    setup({
      rpcMap: {
        check_and_increment_defense_responses: {
          data: { allowed: true, period_count: 120 },
          error: null,
        },
      },
    })
    const res = await POST(makeRequest(validBody), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.usage_warning).toMatch(/121 of 150/)
  })
})
