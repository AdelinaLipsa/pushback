---
phase: 02-infrastructure-security
plan: 01
subsystem: infra
tags: [supabase, webhooks, creem, payments, security]

# Dependency graph
requires:
  - phase: 01-route-handler-hardening
    provides: Hardened route handlers and atomic plan gating
provides:
  - "createAdminSupabaseClient() — synchronous, cookie-free Supabase admin client for webhook/background contexts"
  - "Creem webhook handler hardened with CREEM_WEBHOOK_SECRET guard and admin client"
affects: [03-legal-email, payments, webhook]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use createAdminSupabaseClient() (bare createClient from @supabase/supabase-js) in any context where cookies() is unavailable (webhooks, cron jobs, background tasks)"
    - "Fail-fast env var guards: check required env vars at handler entry and return 500 with explicit error before processing body"

key-files:
  created: []
  modified:
    - lib/supabase/server.ts
    - app/api/webhooks/creem/route.ts

key-decisions:
  - "createAdminSupabaseClient is synchronous (no async, no await cookies()) — safe for any execution context"
  - "CREEM_WEBHOOK_SECRET guard returns 500 (not 401) — misconfiguration is a server error, not an auth failure; loud failure ensures monitoring visibility"
  - "secret var no longer needs ! non-null assertion after guard narrows the type — guard doubles as TypeScript type narrowing"

patterns-established:
  - "Admin client pattern: use createAdminSupabaseClient() for all non-request contexts (webhooks, background tasks); reserve createServiceSupabaseClient() for request-scoped server code"
  - "Env var guard pattern: check required env vars at function entry, return 500 with '{VAR} is not configured' before reading request body"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: ~15min
completed: 2026-04-24
---

# Phase 02 Plan 01: Admin Supabase Client + Webhook Secret Guard Summary

**Cookie-free createAdminSupabaseClient() added to server.ts; Creem webhook hardened with CREEM_WEBHOOK_SECRET fail-fast guard and switched to synchronous admin client**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-24
- **Completed:** 2026-04-24
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `createAdminSupabaseClient()` — synchronous, bare `createClient` from `@supabase/supabase-js`, no cookie hooks, safe to call in webhook/background contexts where `cookies()` would throw
- Added `CREEM_WEBHOOK_SECRET` guard as first statement in webhook POST handler — returns HTTP 500 with `{ error: 'CREEM_WEBHOOK_SECRET is not configured' }` before reading request body
- Switched webhook handler from `await createServiceSupabaseClient()` to synchronous `createAdminSupabaseClient()` — eliminates the "cookies() was called outside a request scope" runtime crash
- Removed `!` non-null assertion on `secret` variable after guard narrows the type — cleaner TypeScript
- TypeScript compilation passes with no new errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add createAdminSupabaseClient() to lib/supabase/server.ts** - `37250b1` (feat)
2. **Task 2: Add secret guard and switch to admin client in webhook handler** - `6ef053a` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `lib/supabase/server.ts` — Added `createAdminSupabaseClient()` export (synchronous, no cookies); existing exports unchanged
- `app/api/webhooks/creem/route.ts` — Secret guard before body read, switched to `createAdminSupabaseClient()`, removed non-null assertion on secret

## Decisions Made
- `createAdminSupabaseClient` is synchronous (no async) — ensures it cannot accidentally introduce cookie dependency through async execution path
- Guard returns 500 not 401 — missing env var is server misconfiguration, not a client auth failure; 500 surfaces in monitoring/alerting differently than 401
- No third argument to `createClient` — defaults (no auth persistence, no cookie adapter) are correct and desirable for webhook use

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. `CREEM_WEBHOOK_SECRET` env var must be set in the deployment environment (Vercel) — this is an existing requirement, not new to this plan.

## Next Phase Readiness
- 02-02 (proxy.ts rename + settings protection) and 02-03 (security headers) are ready to execute — no dependencies on 02-01 outputs
- Webhook reliability is resolved; paid upgrades will no longer be silently dropped due to missing env var or cookie context errors

---
*Phase: 02-infrastructure-security*
*Completed: 2026-04-24*
