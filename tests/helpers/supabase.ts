import { vi } from 'vitest'

type AnyResult = { data: unknown; error: { message: string } | null }

export function makeChain(result: AnyResult = { data: null, error: null }) {
  const resolved = Promise.resolve(result)
  const self: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  }
  // Ensure chained methods return self so callers get the same thenable
  ;(self.select as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.eq as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.update as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.insert as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.delete as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.order as ReturnType<typeof vi.fn>).mockReturnValue(self)
  ;(self.upsert as ReturnType<typeof vi.fn>).mockReturnValue(self)
  return self
}

export function makeSupabaseMock(config: {
  user?: { id: string; email?: string } | null
  fromMap?: Record<string, AnyResult>
  rpcMap?: Record<string, AnyResult>
} = {}) {
  const {
    user = { id: 'user-1', email: 'user@example.com' },
    fromMap = {},
    rpcMap = {},
  } = config

  const defaultRpc: AnyResult = {
    data: { allowed: true, current_count: 0, period_count: 0 },
    error: null,
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const result: AnyResult = fromMap[table] ?? { data: null, error: null }
      return makeChain(result)
    }),
    rpc: vi.fn().mockImplementation((fn: string) => {
      const result = rpcMap[fn] ?? defaultRpc
      return Promise.resolve(result)
    }),
  }
}
