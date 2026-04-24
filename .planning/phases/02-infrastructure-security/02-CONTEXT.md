# Phase 2: Infrastructure & Security - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Five discrete infrastructure fixes before the next phase adds user-visible features: fix the service-role Supabase client used in the webhook, add a loud guard on the missing webhook secret env var, rename middleware.ts → proxy.ts per the Next.js 16 breaking change, protect the /settings route, and add security headers. No new features. No UI changes.

</domain>

<decisions>
## Implementation Decisions

### Service-Role Client (INFRA-01)
- **D-01:** Add a new `createAdminSupabaseClient()` export in `lib/supabase/server.ts` using bare `createClient` from `@supabase/supabase-js` — no cookie hooks, no session management. The webhook handler switches to this new function. The existing `createServiceSupabaseClient` remains untouched (preserves any callers that intentionally run in a request context).

### Webhook Secret Guard (INFRA-02)
- **D-02:** At the top of the webhook handler (before body read), check `if (!process.env.CREEM_WEBHOOK_SECRET)` and return `Response.json({ error: 'CREEM_WEBHOOK_SECRET is not configured' }, { status: 500 })`. Fails loudly on every request when the env var is absent — paid upgrades are never silently dropped due to misconfiguration.

### Middleware Rename (INFRA-03 + INFRA-04)
- **D-03:** Rename `middleware.ts` → `proxy.ts`. Rename the exported function from `middleware` to `proxy`. No structural changes — same route protection logic, same matcher config.
- **D-04:** Add `/settings` to the `isDashboardRoute` condition alongside `/dashboard`, `/projects`, `/contracts`. No refactoring of the route list into a config array — minimal diff only.

### Security Headers (INFRA-05)
- **D-05:** Add headers to `next.config.ts` using `async headers()`. Apply to all routes (`source: '/(.*)'`). Full set:
  - `Content-Security-Policy`: pragmatic — `unsafe-inline` allowed for scripts and styles (Next.js hydration + Tailwind inline styles require it; nonce-based CSP is out of scope for Phase 2). `connect-src` allows `'self' https://*.supabase.co wss://*.supabase.co`. All third-party script sources blocked.
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options`: `DENY`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `poweredByHeader: false` in the top-level config (removes `X-Powered-By: Next.js`)
- **D-06:** Claude's Discretion — exact CSP directive list (img-src, font-src, frame-ancestors etc.) can be filled in by the planner based on the app's actual asset needs. The constraints are: no `unsafe-eval`, `unsafe-inline` is allowed, Supabase domains must be in `connect-src`.

### Claude's Discretion
- Exact CSP directive completeness — planner determines full directive list (img-src, frame-ancestors, etc.) from the app's actual usage.
- Whether to deprecate/rename `createServiceSupabaseClient` in a follow-up comment or TODO — not blocking this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to Modify
- `lib/supabase/server.ts` — Add `createAdminSupabaseClient()` export (INFRA-01)
- `app/api/webhooks/creem/route.ts` — Switch to new admin client, add secret guard (INFRA-01, INFRA-02)
- `middleware.ts` → rename to `proxy.ts` — Rename file and export, add /settings (INFRA-03, INFRA-04)
- `next.config.ts` — Add `async headers()` with security headers (INFRA-05)

### Reference Files
- `.planning/codebase/STACK.md` — Next.js 16.2.4 specifics, async headers() API
- `.planning/codebase/CONVENTIONS.md` — Error response format, import patterns
- `node_modules/next/dist/docs/` — Next.js 16 breaking changes (INFRA-03 proxy.ts requirement)

### Prior Phase Context
- `.planning/phases/01-route-handler-hardening/01-CONTEXT.md` — Established error response pattern (`{ error: 'message' }` + HTTP status), createServerSupabaseClient usage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@supabase/supabase-js` is already in package.json — `createClient` import available for `createAdminSupabaseClient()` without new dependencies
- `createServerSupabaseClient` in `lib/supabase/server.ts` — keep as-is for authenticated route handlers (this phase doesn't touch it)

### Established Patterns
- Webhook handler already uses `Response.json()` (Web API) — maintain this pattern for the secret guard error response
- `next.config.ts` exports `NextConfig` type — async headers() is a method on the same config object

### Integration Points
- `app/api/webhooks/creem/route.ts` is the only caller of `createServiceSupabaseClient` outside of authenticated route handlers — safe to switch it to `createAdminSupabaseClient()` without auditing other callers
- The `proxy.ts` rename changes the filename Next.js looks for — both the function export name AND the file name must change together

</code_context>

<specifics>
## Specific Ideas

- `createAdminSupabaseClient` signature: `export function createAdminSupabaseClient() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) }` — synchronous, no cookies, no async needed
- Webhook secret guard: check at top of POST handler before `await request.text()` so the fail is instant
- CSP connect-src wildcard `https://*.supabase.co` covers all Supabase project subdomains without needing to read the env var at build time

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-infrastructure-security*
*Context gathered: 2026-04-24*
