---
phase: 01-route-handler-hardening
plan: 02
subsystem: auth
tags: [supabase, oauth, next.js, search-params, anthropic]

requires:
  - phase: none
    provides: n/a

provides:
  - Auth callback that detects OAuth errors and redirects to /login?error=auth_failed
  - Login page red error banner driven by useSearchParams ?error=auth_failed
  - DEFENSE_SYSTEM_PROMPT off-topic guard instruction before final salutation line

affects: [auth, login, ai-defense]

tech-stack:
  added: []
  patterns:
    - "OAuth error propagation via query param redirect (?error=auth_failed)"
    - "URL-driven error banners using useSearchParams with strict equality check"
    - "System prompt guardrails via OFF-TOPIC GUARD instruction block"

key-files:
  created: []
  modified:
    - app/auth/callback/route.ts
    - app/(auth)/login/page.tsx
    - lib/anthropic.ts

key-decisions:
  - "Use strict === 'auth_failed' check on query param to prevent reflected XSS — any other value shows no banner"
  - "Error message 'Sign-in link expired — please try again.' reveals code expired but not attacker-actionable info (T-02-03 accepted)"
  - "Off-topic guard is a UX guardrail, not a security control — prompt injection can still override it (T-02-04 accepted)"

patterns-established:
  - "Auth error propagation pattern: server detects error → redirect with ?error=<code> → client reads param with useSearchParams → shows banner"

requirements-completed: [RELY-03]

duration: 10min
completed: 2026-04-24
---

# Phase 01, Plan 02: Auth Callback Hardening + Login Error Banner + System Prompt Guard

**OAuth failure now redirects to /login?error=auth_failed with a visible red banner; DEFENSE_SYSTEM_PROMPT has an off-topic guard rejecting non-freelancer situations**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-24T00:00:00Z
- **Completed:** 2026-04-24T00:10:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Auth callback captures `exchangeCodeForSession` result — expired/replayed codes now redirect to `/login?error=auth_failed` instead of silently forwarding to /dashboard unauthenticated
- Login page reads `?error=auth_failed` via `useSearchParams` and renders a styled red error banner: "Sign-in link expired — please try again."
- `DEFENSE_SYSTEM_PROMPT` includes an OFF-TOPIC GUARD instruction that returns a fixed message for non-freelancer situations

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix auth callback error detection (RELY-03, D-06/D-07)** - `962ce11` (fix)
2. **Task 2: Add auth error banner to login page + off-topic guard to system prompt** - `563282a` (feat)

## Files Created/Modified

- `app/auth/callback/route.ts` - Captures `exchangeCodeForSession` error; redirects to `/login?error=auth_failed` on failure, `/dashboard` on success
- `app/(auth)/login/page.tsx` - Adds `useSearchParams` import + hook; renders red error banner when `?error=auth_failed` is present
- `lib/anthropic.ts` - Inserts OFF-TOPIC GUARD block into `DEFENSE_SYSTEM_PROMPT` before the final "Return only the message text" instruction

## Decisions Made

- Used strict `=== 'auth_failed'` check on the URL query param — prevents any attacker-controlled string from being reflected into the UI
- Accepted information disclosure risk (T-02-03): "Sign-in link expired" message reveals the code was valid but expired — no secret data disclosed, acceptable for v1
- Off-topic guard treated as UX improvement, not security control — sophisticated prompt injection can still override it (T-02-04 accepted)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Pre-existing 10 ESLint errors in scaffold files remain (deferred to Phase 5 per STATE.md). No new lint errors introduced.

## Threat Surface

No new network endpoints or auth paths introduced. All threat mitigations align with the plan's threat register:

- T-02-01 (query param tampering): mitigated by strict equality check
- T-02-02 (OAuth code replay): mitigated by error detection in callback
- T-02-03 (info disclosure): accepted
- T-02-04 (prompt injection): accepted

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 1 complete: auth callback hardened, login error communication wired end-to-end
- Ready to proceed to Wave 2 plans (01-03 through 01-05: Zod schema validation on route handlers)
- Zod 4.x is installed — Wave 2 plans must use Zod 4.x API (noted in STATE.md deferred items)

---
*Phase: 01-route-handler-hardening*
*Completed: 2026-04-24*
