# Phase 2: Infrastructure & Security - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 4 new/modified files (1 rename = delete + create)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/supabase/server.ts` (add export) | utility | request-response | `lib/supabase/server.ts` (existing exports) | exact — same file, same factory pattern |
| `app/api/webhooks/creem/route.ts` (modify) | middleware/handler | event-driven | `app/api/webhooks/creem/route.ts` (current file) | exact — modifying in place |
| `proxy.ts` (new, replaces `middleware.ts`) | middleware | request-response | `middleware.ts` (current file) | exact — rename + minimal diff |
| `next.config.ts` (modify) | config | — | `next.config.ts` (current file) | exact — adding to existing config object |

---

## Pattern Assignments

### `lib/supabase/server.ts` — Add `createAdminSupabaseClient()` export (INFRA-01)

**Analog:** `lib/supabase/server.ts` lines 24–42 (`createServiceSupabaseClient` — same factory shape, but cookie-free variant needed)

**Existing factory pattern to copy structure from** (lines 24–42):
```typescript
export async function createServiceSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**New export to add — diverges from above by removing cookie adapter entirely** (append after line 42):
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Key divergence from analog:** `createAdminSupabaseClient` is synchronous (no `async`, no `await cookies()`). Uses bare `createClient` from `@supabase/supabase-js`, not `createServerClient` from `@supabase/ssr`. No cookie adapter. No third argument needed.

**Import to add at top of file** (line 1 currently imports from `@supabase/ssr` — new import must be added separately):
```typescript
import { createClient } from '@supabase/supabase-js'
```

---

### `app/api/webhooks/creem/route.ts` — Add secret guard + switch client (INFRA-01, INFRA-02)

**Analog:** `app/api/webhooks/creem/route.ts` (full current file — 43 lines, already read)

**Current imports** (lines 1–2):
```typescript
import crypto from 'crypto'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
```

**Replacement import** (line 2 only changes):
```typescript
import { createAdminSupabaseClient } from '@/lib/supabase/server'
```

**Current POST handler opening** (lines 4–11 — body read before any guard):
```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('creem-signature') ?? ''
  const secret = process.env.CREEM_WEBHOOK_SECRET!
  ...
```

**New POST handler opening — guard inserted before body read** (INFRA-02 pattern):
```typescript
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
  ...
```

**Note:** After adding the guard, `secret` can be assigned without `!` non-null assertion (TypeScript narrowing proves it exists). Remove the `!`.

**Current client call** (line 21):
```typescript
const supabase = await createServiceSupabaseClient()
```

**Replacement client call** (INFRA-01 — synchronous, no await):
```typescript
const supabase = createAdminSupabaseClient()
```

**Error response pattern in use** (lines 11, 19, 41–42 — maintain this pattern for the guard):
```typescript
return Response.json({ error: 'Invalid signature' }, { status: 401 })
return Response.json({ received: true })
return Response.json({ received: true })
```

---

### `proxy.ts` — Rename of `middleware.ts` with `/settings` added (INFRA-03, INFRA-04)

**Analog:** `middleware.ts` (full current file — 49 lines, already read). This is a near-verbatim copy with two targeted changes.

**Current imports** (lines 1–2 — unchanged in proxy.ts):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
```

**Current function signature** (line 4 — export name changes):
```typescript
export async function middleware(request: NextRequest) {
```
**New function signature:**
```typescript
export async function proxy(request: NextRequest) {
```

**Supabase client setup** (lines 5–22 — unchanged verbatim):
```typescript
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
```

**Current `isDashboardRoute` condition** (lines 28–30 — add `/settings` to this OR chain):
```typescript
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/contracts')
```
**New `isDashboardRoute` condition** (INFRA-04 — append one OR clause):
```typescript
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/contracts') ||
    request.nextUrl.pathname.startsWith('/settings')
```

**Redirect logic and config export** (lines 32–49 — unchanged verbatim):
```typescript
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

**Note:** `middleware.ts` must be deleted. `proxy.ts` is the replacement. Both the filename and the export name must change together — Next.js 16 hardcodes `PROXY_FILENAME = 'proxy'` at `node_modules/next/dist/lib/constants.js` line 289.

---

### `next.config.ts` — Add `async headers()` and `poweredByHeader: false` (INFRA-05)

**Analog:** `next.config.ts` (current file — 7 lines). The config object is currently empty; this adds two properties to it.

**Current file** (lines 1–7 — full file):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**New file — complete replacement** (adds `poweredByHeader` top-level property and `async headers()` method):
```typescript
import type { NextConfig } from 'next'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Key placement rules:**
- `poweredByHeader: false` is a top-level `NextConfig` property — not inside the `headers` array.
- `cspHeader` template literal is declared at module scope (before `nextConfig`), then `.replace(/\n/g, '')` is applied at runtime to collapse newlines into a single-line header value.
- Quote style: current file uses `"next"` double quotes for the type import. Planner may normalize to single quotes per codebase convention (other files use single quotes consistently).

---

## Shared Patterns

### Response Format
**Source:** `app/api/webhooks/creem/route.ts` lines 11, 19, 41
**Apply to:** All error returns in the webhook handler (including the new secret guard)
```typescript
return Response.json({ error: 'message' }, { status: NNN })
return Response.json({ received: true })
```
The guard must use this pattern — `Response.json({ error: '...' }, { status: 500 })`.

### Environment Variable Access
**Source:** `app/api/webhooks/creem/route.ts` lines 7, 9 (before fix) and `lib/supabase/server.ts` lines 7–8
**Apply to:** `createAdminSupabaseClient()` in `lib/supabase/server.ts`
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.SUPABASE_SERVICE_ROLE_KEY!
```
Non-null assertion `!` is the project pattern for env vars that are known to be set. For the webhook secret specifically: after the guard check narrows the type, the `!` assertion on `process.env.CREEM_WEBHOOK_SECRET` can be dropped.

### TypeScript Import Style
**Source:** `middleware.ts` line 2 and `lib/supabase/server.ts` line 1
**Apply to:** All modified files
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
```
Named imports with `type` keyword inline for type-only imports. Single quotes. No semicolon on template literals.

---

## No Analog Found

None — all four files have exact or near-exact analogs in the codebase itself (three are modifications to existing files; one is a rename of an existing file).

---

## Anti-Patterns (planner must avoid)

| Anti-Pattern | Why | Correct Pattern |
|--------------|-----|-----------------|
| Export `middleware` from `proxy.ts` | Next.js 16 throws startup error — export name must be `proxy` | `export async function proxy(...)` |
| `await createAdminSupabaseClient()` | Function is synchronous — no `await` needed or valid | `const supabase = createAdminSupabaseClient()` |
| Secret guard placed after `await request.text()` | Body stream already consumed; guard never fires correctly | Guard is first line of POST handler, before any `await` |
| `poweredByHeader: false` inside `headers` array | It is a `NextConfig` top-level property, not a header entry | Place at top level of `nextConfig` object |
| Deleting `createServiceSupabaseClient` | D-01 explicitly preserves it — may have other callers | Add new export; leave existing exports untouched |

---

## Metadata

**Analog search scope:** `/Users/adelinalipsa/Documents/GitHub/pushback` — all four target files read directly (they are the analogs for themselves)
**Files read:** 4 source files + 2 planning docs + Next.js constants.js verification
**Pattern extraction date:** 2026-04-24
