import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  defendRateLimit: null,
  checkRateLimit: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/dispute/renderPack', () => ({
  renderPack: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock', 'utf-8')),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { renderPack } from '@/lib/dispute/renderPack'
import { POST } from '@/app/api/projects/[id]/dispute-pack/route'

const mockProject = {
  id: 'project-1',
  title: 'Brand Identity Refresh',
  client_name: 'ACME Inc.',
  project_value: 2400,
  currency: 'EUR',
  payment_due_date: '2026-03-15T00:00:00.000Z',
  payment_received_at: '2026-03-18T09:30:00.000Z',
  payment_amount: 2400,
  contracts: {
    id: 'contract-1',
    contract_text: 'Scope of Work: Deliver three mockups.',
    analysis: { clauses_present: ['scope'] },
  },
  defense_responses: [
    {
      id: 'r-1',
      tool_type: 'delivery_signoff',
      response: 'Confirming delivery of mockups.',
      situation: 'End of milestone',
      created_at: '2026-03-20T10:00:00.000Z',
      was_sent: true,
    },
  ],
}

function makeRequest(body: unknown, projectId = 'project-1') {
  return new Request(`http://localhost/api/projects/${projectId}/dispute-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'project-1') {
  return { params: Promise.resolve({ id }) }
}

type SetupOpts = {
  authed?: boolean
  plan?: 'free' | 'pro'
  project?: unknown
  rpcAllowed?: boolean
}

function setup(opts: SetupOpts = {}) {
  const { authed = true, plan = 'pro', project = mockProject, rpcAllowed = true } = opts
  const mock = makeSupabaseMock({
    user: authed ? { id: 'user-1', email: 'user@example.com' } : null,
    fromMap: {
      user_profiles: {
        data: { plan, email: 'user@example.com', full_name: 'Test User' },
        error: null,
      },
      projects: { data: project, error: null },
    },
    rpcMap: {
      check_and_increment_defense_responses: {
        data: { allowed: rpcAllowed, reason: rpcAllowed ? undefined : 'UPGRADE_REQUIRED' },
        error: null,
      },
      decrement_defense_responses: { data: null, error: null },
    },
  })
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mock as never)
  return mock
}

describe('POST /api/projects/[id]/dispute-pack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(renderPack).mockResolvedValue(Buffer.from('%PDF-1.4 mock', 'utf-8'))
  })

  it('returns 401 when unauthenticated', async () => {
    setup({ authed: false })
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 403 PRO_REQUIRED when plan is free', async () => {
    setup({ plan: 'free' })
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'PRO_REQUIRED' })
  })

  it('returns 403 UPGRADE_REQUIRED when quota RPC denies', async () => {
    setup({ rpcAllowed: false })
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'UPGRADE_REQUIRED' })
  })

  it('returns 404 when project does not belong to user', async () => {
    setup({ project: null })
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('returns 400 for invalid dispute_type', async () => {
    setup()
    const res = await POST(makeRequest({ dispute_type: 'bogus_type' }), makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/dispute_type/)
  })

  it('returns 400 when case_reference exceeds 80 chars', async () => {
    setup()
    const res = await POST(
      makeRequest({ dispute_type: 'not_as_described', case_reference: 'x'.repeat(81) }),
      makeParams(),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/case_reference/)
  })

  it('returns 200 application/pdf with attachment Content-Disposition on success', async () => {
    setup()
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename=".*\.pdf"$/)
    expect(vi.mocked(renderPack)).toHaveBeenCalledTimes(1)
  })

  it('decrements credit when renderPack throws', async () => {
    const mock = setup()
    vi.mocked(renderPack).mockRejectedValueOnce(new Error('boom'))
    const res = await POST(makeRequest({ dispute_type: 'not_as_described' }), makeParams())
    expect(res.status).toBe(500)
    expect(mock.rpc).toHaveBeenCalledWith('decrement_defense_responses', { uid: 'user-1' })
  })

  it('accepts all four D-06 dispute types', async () => {
    for (const dt of ['not_as_described', 'not_received', 'cancelled', 'unauthorized'] as const) {
      setup()
      const res = await POST(makeRequest({ dispute_type: dt }), makeParams())
      expect(res.status, `dispute_type=${dt}`).toBe(200)
    }
  })
})
