# Phase 2: Infrastructure & Security - Research

**Researched:** 2026-04-24
**Domain:** Next.js 16 proxy.ts, Supabase service-role client, HTTP security headers, route protection
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (INFRA-01):** Add `createAdminSupabaseClient()` in `lib/supabase/server.ts` using bare `createClient` from `@supabase/supabase-js` — no cookies, no session hooks. Webhook switches to this. `createServiceSupabaseClient` stays untouched.

**D-02 (INFRA-02):** At the top of the POST handler (before body read), check `if (!process.env.CREEM_WEBHOOK_SECRET)` and return `Response.json({ error: 'CREEM_WEBHOOK_SECRET is not configured' }, { status: 500 })`.

**D-03 (INFRA-03):** Rename `middleware.ts` → `proxy.ts`. Rename exported function from `middleware` to `proxy`. Same route protection logic and same matcher config.

**D-04 (INFRA-04):** Add `/settings` to the `isDashboardRoute` condition. No refactoring of the route list. Minimal diff only.

**D-05 (INFRA-05):** Security headers in `next.config.ts` via `async headers()`. Source `'/(.*)'`. Full set: CSP with `unsafe-inline` for scripts/styles, Supabase domains in `connect-src`, HSTS, X-Frame-Options: DENY, Referrer-Policy, `poweredByHeader: false`.

**D-06:** Claude's Discretion for exact CSP directive list (img-src, font-src, frame-ancestors, etc.) based on actual app usage.

### Claude's Discretion
- Exact CSP directive completeness — planner determines full directive list from app's actual usage.
- Whether to add a deprecation comment on `createServiceSupabaseClient` — not blocking.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Webhook service-role Supabase client uses cookie-free transport | D-01: bare `createClient(url, serviceRoleKey)` from `@supabase/supabase-js` verified in source |
| INFRA-02 | Missing `CREEM_WEBHOOK_SECRET` fails loudly | D-02: guard before `await request.text()`, returns 500 — pattern confirmed against existing handler |
| INFRA-03 | `middleware.ts` renamed to `proxy.ts` with `proxy` export | D-03: confirmed in Next.js 16 source constants.js PROXY_FILENAME='proxy' and version-16.md |
| INFRA-04 | `/settings` included in protected-routes matcher | D-04: settings page exists at `app/(dashboard)/settings/page.tsx`, URL path is `/settings` |
| INFRA-05 | Security headers via `next.config.ts` | D-05: async headers() format confirmed from Next.js 16 CSP docs; exact directives determined by research |
</phase_requirements>

---

## Summary

Phase 2 is five targeted infrastructure fixes with no new features or UI changes. Each fix is self-contained and touches exactly one file (plus the proxy.ts rename which touches two — the old file replaced and the export renamed).

The most research-sensitive item is the proxy.ts breaking change. The Next.js 16 upgrade guide confirms: rename `middleware.ts` to `proxy.ts`, rename the exported function from `middleware` to `proxy`. Both changes are required together. The file `PROXY_FILENAME = 'proxy'` is hardcoded in `node_modules/next/dist/lib/constants.js` — this is the filename Next.js looks for. The `config.matcher` export format is unchanged from Next.js 15.

The `createAdminSupabaseClient` fix resolves a real bug: the existing `createServiceSupabaseClient` calls `cookies()` from `next/headers`, which throws in a webhook context (no incoming Next.js request). Bare `createClient(url, serviceRoleKey)` from `@supabase/supabase-js` is the correct pattern — no cookie adapter needed.

For security headers, the decision to use `unsafe-inline` (D-05/D-06) is well-supported: Next.js 16's own CSP guide uses `unsafe-inline` for the non-nonce path, since Next.js hydration injects inline scripts and the `next/font/google` subsystem injects inline styles. The alternative (nonce-based CSP) forces all pages to dynamic rendering — out of scope per D-06.

**Primary recommendation:** Implement in wave order — admin client + webhook guard (INFRA-01, INFRA-02), then proxy.ts rename + settings route (INFRA-03, INFRA-04), then security headers (INFRA-05). Each wave is independently testable.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Webhook secret guard | API / Backend | — | Route handler runs server-side before any auth; guard must be first line of POST handler |
| Cookie-free Supabase admin client | API / Backend | — | Webhook is a raw HTTP handler with no Next.js request context; `cookies()` is unavailable |
| proxy.ts rename | Frontend Server (SSR) | — | Proxy/middleware runs at the network boundary before any route handler or page render |
| /settings route protection | Frontend Server (SSR) | API / Backend (layout) | proxy.ts enforces redirect for unauthenticated users; layout also checks auth as secondary guard |
| Security headers | Frontend Server (SSR) | — | `async headers()` in next.config.ts applies at the response layer for all routes |

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.104.1 | Bare `createClient` for admin/webhook use | Cookie-free; bypasses SSR session hooks |
| `next` | 16.2.4 | proxy.ts, async headers() | Already in project; no upgrade needed |

### No new installations required
All capabilities in Phase 2 use libraries already in `package.json`. No `npm install` step.

---

## Architecture Patterns

### System Architecture Diagram

```
Incoming HTTP Request
        |
        v
 [proxy.ts — runs first]
   - Auth check via @supabase/ssr + cookies
   - isDashboardRoute check (/dashboard, /projects, /contracts, /settings)
   - isAuthRoute check (/login, /signup)
   - Redirect unauthenticated → /login
   - Redirect authenticated-on-auth-route → /dashboard
        |
        v
 [next.config.ts headers()]
   - CSP, HSTS, X-Frame-Options, Referrer-Policy applied to all responses
        |
        v
 [Route Handler: /api/webhooks/creem]
   - Guard: if (!CREEM_WEBHOOK_SECRET) → 500 immediately
   - await request.text()
   - HMAC verify
   - createAdminSupabaseClient() [no cookies]
   - DB update
```

### Recommended Project Structure
```
/
├── proxy.ts             # Renamed from middleware.ts; export proxy()
├── middleware.ts        # DELETED (replaced by proxy.ts)
├── next.config.ts       # Add async headers(), poweredByHeader: false
├── lib/
│   └── supabase/
│       └── server.ts    # Add createAdminSupabaseClient() export
└── app/
    └── api/
        └── webhooks/
            └── creem/
                └── route.ts   # Add secret guard; switch to createAdminSupabaseClient()
```

### Pattern 1: proxy.ts — Named Export + Matcher Config

**What:** File rename + function rename. Next.js 16 hardcodes `PROXY_FILENAME = 'proxy'` in its constants.

**When to use:** Always — this is the only supported pattern in Next.js 16 for Node.js-runtime proxy.

```typescript
// Source: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
// Source: node_modules/next/dist/lib/constants.js (PROXY_FILENAME = 'proxy')
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/contracts') ||
    request.nextUrl.pathname.startsWith('/settings')  // INFRA-04: added

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

**Critical:** Both changes required — file name AND function export name. Either alone is insufficient.

**Note on edge runtime:** Next.js 16 docs state explicitly: "The `edge` runtime is NOT supported in `proxy`. The `proxy` runtime is `nodejs`." The existing `middleware.ts` had no `export const runtime` set, so it was already running on Node.js edge — no runtime concern here.

### Pattern 2: createAdminSupabaseClient — Bare createClient

**What:** Cookie-free Supabase client using service role key. Synchronous factory, no `await`.

**When to use:** Any server-side operation with no incoming Next.js HTTP request context (webhooks, cron jobs, server actions that don't need session passthrough).

```typescript
// Source: @supabase/supabase-js/src/index.ts (verified createClient signature)
// Source: Supabase docs — performing-administration-tasks-on-the-server-side
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

No third argument needed — default options are correct for webhook use. No cookie adapter, no `persistSession`, no `autoRefreshToken`. The defaults for a bare `createClient` do not attempt cookie access.

**Why not keep createServiceSupabaseClient?** The existing implementation uses `await cookies()` from `next/headers`, which throws `Error: cookies() was called outside a request scope` in webhook handlers — these run as raw HTTP POST handlers with no Next.js request context.

### Pattern 3: Webhook Secret Guard

**What:** Fail-fast check before any processing. Returns 500 (not 401) because a missing env var is a server misconfiguration, not a client error.

```typescript
// Source: CONTEXT.md D-02, consistent with existing Response.json() pattern in codebase
export async function POST(request: Request) {
  if (!process.env.CREEM_WEBHOOK_SECRET) {
    return Response.json(
      { error: 'CREEM_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  // ... rest of handler unchanged
}
```

**Placement:** Must be before `await request.text()` — body streams cannot be re-read, so guards must precede them.

### Pattern 4: Security Headers in next.config.ts

**What:** `async headers()` returns array of header objects. Applied to all routes via `source: '/(.*)'`.

**CSP directive analysis for this app:**
- `script-src 'self' 'unsafe-inline'` — required for Next.js 16 hydration (inline scripts in RSC payload)
- `style-src 'self' 'unsafe-inline'` — required for Tailwind v4 CSS-first config, `next-themes` inline style injection, GSAP inline transforms, and `next/font/google` (which self-hosts fonts but injects inline CSS variables)
- `img-src 'self' blob: data:` — `blob:` for potential canvas/avatar use; `data:` for base64 inline images in shadcn/ui components
- `font-src 'self'` — `next/font/google` self-hosts fonts, serves from `/_next/static/media/`; no external font CDN needed
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co` — covers all Supabase project subdomains (auth, database, storage, realtime WebSocket)
- `frame-ancestors 'none'` — equivalent to X-Frame-Options: DENY but in CSP; include both for older browser compat
- `object-src 'none'` — blocks Flash/plugin exploitation
- `base-uri 'self'` — prevents base tag injection attacks
- `form-action 'self'` — Next.js Server Actions POST to same origin

```typescript
// Source: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
// "Without Nonces" section — exact format confirmed
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

**`poweredByHeader: false`** is a top-level config property — not inside `headers()`. It removes the `X-Powered-By: Next.js` response header globally.

### Anti-Patterns to Avoid

- **Keeping `middleware` as the export name in proxy.ts:** The file can be named proxy.ts but if the export is still `middleware`, Next.js 16 will fail with: "The file './proxy.ts' must export a function, either as a default export or as a named 'proxy' export."
- **Using `createServiceSupabaseClient` in the webhook:** It calls `await cookies()` which throws outside a request context. This is the bug INFRA-01 fixes.
- **Nonce-based CSP for this phase:** Nonces force all pages to dynamic rendering, disable ISR, and are out of scope per D-06.
- **Placing `poweredByHeader: false` inside the headers array:** It is a top-level NextConfig property, not a header entry.
- **Deleting `createServiceSupabaseClient`:** D-01 says keep it — there may be other callers in authenticated route handlers where cookie passthrough is correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-free DB access | Custom fetch wrapper to Supabase REST | `createClient(url, serviceKey)` from `@supabase/supabase-js` | Handles auth header, RLS bypass, connection pooling |
| Route protection | Custom auth check in every page | proxy.ts with `isDashboardRoute` check | Single enforcement point; pages/layouts as secondary guard only |
| Security headers | Custom middleware per route | `next.config.ts async headers()` | Framework-level, applied before any user code runs |

---

## Common Pitfalls

### Pitfall 1: Renaming only the file, not the export

**What goes wrong:** proxy.ts exists but still exports `middleware`. Next.js 16 startup throws an error: the file must export `proxy` (named) or a default export.

**Why it happens:** The breaking change requires both the filename AND the export to change. Many developers rename only the file.

**How to avoid:** Change both in one edit — `export async function proxy(...)` in the file named `proxy.ts`.

**Warning signs:** `Error: The file "./proxy.ts" must export a function, either as a default export or as a named "proxy" export` at dev server start.

### Pitfall 2: cookies() called in webhook context

**What goes wrong:** `createServiceSupabaseClient` calls `await cookies()` — this throws `Error: cookies() was called outside a request scope` in the Creem webhook handler because webhooks are raw HTTP handlers with no Next.js request context.

**Why it happens:** `@supabase/ssr`'s `createServerClient` requires cookie hooks; when used with `cookies()` from `next/headers`, that's scoped to the Next.js middleware/layout/page request lifecycle.

**How to avoid:** Use `createClient` from `@supabase/supabase-js` directly in `createAdminSupabaseClient`. No cookie adapter.

**Warning signs:** Webhook requests return 500 with an internal Next.js error about cookies scope.

### Pitfall 3: Secret guard placed after `request.text()`

**What goes wrong:** Body stream is consumed before the guard runs. The guard never sees the body if it's placed after `request.text()`.

**Why it happens:** HTTP request bodies are streams — once read, they cannot be re-read.

**How to avoid:** Always place the guard as the absolute first line of the handler, before any `await`.

### Pitfall 4: CSP blocks Next.js hydration

**What goes wrong:** If `script-src` omits `'unsafe-inline'`, Next.js 16's RSC payload (inline `__next_f.push(...)` script tags) is blocked, causing blank pages and hydration failures.

**Why it happens:** Next.js App Router uses inline script tags to pass server component data to the client.

**How to avoid:** Include `'unsafe-inline'` in `script-src`. This is the documented approach for the "without nonces" CSP path. [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md]

### Pitfall 5: /settings route not covered by proxy matcher

**What goes wrong:** The current matcher `'/((?!_next/static|_next/image|favicon.ico|api).*)'` already matches `/settings` — no matcher change needed. The only required change is adding `/settings` to the `isDashboardRoute` condition.

**Why it matters:** Forgetting to add `/settings` to `isDashboardRoute` means unauthenticated users can access the settings page despite the matcher running (the proxy runs but doesn't redirect them, since `isDashboardRoute` returns false for `/settings`).

**How to avoid:** Add `.startsWith('/settings')` to the `isDashboardRoute` OR condition. The layout also has a secondary auth redirect, but proxy-level protection is the correct first defense.

### Pitfall 6: /settings double-protection creates redirect loop

**What goes wrong:** Could theoretically happen if proxy.ts redirects `/settings` → `/login`, but the `/login` route is included in `isDashboardRoute`. It is not — only the paths listed in the condition are protected.

**Why it doesn't apply here:** `isAuthRoute` and `isDashboardRoute` are disjoint sets. `/settings` only appears in `isDashboardRoute`. No loop risk.

---

## Key File Inventory

### Files to Modify

| File | Change | Requirement |
|------|--------|-------------|
| `middleware.ts` | Delete (replaced by proxy.ts) | INFRA-03 |
| `proxy.ts` (new) | Create with `proxy` export, add `/settings` to isDashboardRoute | INFRA-03, INFRA-04 |
| `lib/supabase/server.ts` | Add `createAdminSupabaseClient()` export | INFRA-01 |
| `app/api/webhooks/creem/route.ts` | Add secret guard; switch to `createAdminSupabaseClient()` | INFRA-01, INFRA-02 |
| `next.config.ts` | Add `poweredByHeader: false`, `async headers()` | INFRA-05 |

### Files NOT to Touch (confirmed)
- `lib/supabase/server.ts` — `createServerSupabaseClient` and `createServiceSupabaseClient` stay unchanged (callers in authenticated route handlers intentionally use cookie-based clients)
- `app/(dashboard)/settings/page.tsx` — has its own `if (!user) redirect('/login')` check; this is a secondary guard, not the primary one
- `app/(dashboard)/layout.tsx` — has its own auth check; also stays unchanged

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js 16.2.4 proxy.ts PROXY_FILENAME constant is 'proxy' | Standard Stack / proxy.ts pattern | LOW — verified directly in `node_modules/next/dist/lib/constants.js` line 289 |
| A2 | `next/font/google` self-hosts fonts so `font-src 'self'` is sufficient | CSP directive analysis | MEDIUM — if a browser requests fonts from `fonts.gstatic.com` directly, CSP would block it; mitigated by fact that Next.js docs show `font-src 'self'` in their own CSP example |
| A3 | GSAP inline styles don't require a separate CSP domain | CSP directive analysis | LOW — GSAP manipulates element.style directly via JS; covered by `'unsafe-inline'` in style-src |
| A4 | Webhook handler has no other callers referencing `createServiceSupabaseClient` that need this fix | INFRA-01 scope | LOW — CONTEXT.md confirms the webhook is the only caller outside auth handlers |

---

## Open Questions

1. **Supabase Realtime WebSocket origin**
   - What we know: `wss://*.supabase.co` covers Realtime WebSocket connections
   - What's unclear: Whether the Pushback app actually uses Supabase Realtime (no evidence in scaffold code)
   - Recommendation: Include `wss://*.supabase.co` in CSP anyway — it's a wildcard subdomain match that costs nothing and prevents CSP violations if Realtime is added later

2. **Settings page URL path under (dashboard) route group**
   - What we know: App Router route groups `(name)` do not affect the URL path — `app/(dashboard)/settings/page.tsx` maps to `/settings`
   - What's unclear: Nothing — this is confirmed Next.js App Router behavior
   - Recommendation: Add `request.nextUrl.pathname.startsWith('/settings')` to isDashboardRoute; no matcher change needed

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is code and config changes only. No external services, CLIs, or runtimes beyond the existing Node.js/npm/Next.js stack are required.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | proxy.ts route protection; layout auth check |
| V3 Session Management | no | Session logic unchanged from Phase 1 |
| V4 Access Control | yes | /settings added to protected route set |
| V5 Input Validation | partial | Secret guard validates env var presence |
| V6 Cryptography | no | HMAC verification logic unchanged |
| V14 HTTP Security | yes | Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing webhook secret → silent HMAC bypass | Spoofing | Guard check before body read (INFRA-02) |
| Session cookie theft via iframe embedding | Elevation of Privilege | X-Frame-Options: DENY + frame-ancestors 'none' in CSP |
| XSS via inline script injection | Tampering | CSP script-src (though unsafe-inline weakens this) |
| Clickjacking | Tampering | X-Frame-Options: DENY |
| Protocol downgrade attacks | Tampering | HSTS with max-age=63072000 (2 years) + preload |
| Fingerprinting via X-Powered-By | Information Disclosure | poweredByHeader: false |
| Cross-site referrer leaking sensitive URLs | Information Disclosure | Referrer-Policy: strict-origin-when-cross-origin |
| Unauthorized /settings access | Elevation of Privilege | proxy.ts isDashboardRoute + layout auth guard |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/lib/constants.js` line 289 — `PROXY_FILENAME = 'proxy'` confirmed
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — Full proxy.ts migration docs, confirmed named export `proxy`, runtime is nodejs only
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` — Confirmed `async headers()` format for non-nonce CSP; confirmed `unsafe-inline` for scripts/styles in this mode
- `node_modules/@supabase/supabase-js/src/index.ts` — `createClient(url, key, options?)` signature confirmed; version 2.104.1
- `middleware.ts` (project file) — current implementation read; full logic documented
- `lib/supabase/server.ts` (project file) — confirmed `createServiceSupabaseClient` uses `cookies()` from next/headers
- `app/api/webhooks/creem/route.ts` (project file) — confirmed current structure and `createServiceSupabaseClient` usage
- `next.config.ts` (project file) — confirmed empty config; no existing headers()
- `app/(dashboard)/settings/page.tsx` (project file) — confirmed settings page exists; URL is /settings
- `.planning/config.json` — `nyquist_validation: false` confirmed; Validation Architecture section omitted

### Secondary (MEDIUM confidence)
- [Renaming Middleware to Proxy | Next.js](https://nextjs.org/docs/messages/middleware-to-proxy) — confirms named `proxy` export and default export both supported; codemod available
- [Supabase troubleshooting — service role with SSR](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z) — confirms that SSR cookie-based clients let user sessions override service role key

---

## Metadata

**Confidence breakdown:**
- proxy.ts rename: HIGH — read from installed Next.js 16.2.4 source + official upgrade guide
- createAdminSupabaseClient: HIGH — read from installed supabase-js source; bug root cause verified in server.ts
- Webhook secret guard: HIGH — simple env var check before body read; pattern matches existing codebase conventions
- Security headers format: HIGH — format read from installed Next.js docs
- CSP directives: MEDIUM — directives derived from app usage analysis; font-src 'self' relies on Next.js font self-hosting behavior

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable APIs — 30 day window)
