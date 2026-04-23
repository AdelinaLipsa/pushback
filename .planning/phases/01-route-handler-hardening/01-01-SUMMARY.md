---
phase: 01-route-handler-hardening
plan: 01
subsystem: database
tags: [zod, postgres, supabase, rpc, plpgsql, migrations, plan-gating]

# Dependency graph
requires: []
provides:
  - "Zod 4.x validation library installed and available to all route handlers"
  - "check_and_increment_defense_responses(uid uuid) RPC — atomic check-and-increment with FOR UPDATE row lock, returns jsonb {allowed, current_count}"
  - "check_and_increment_contracts(uid uuid) RPC — same pattern for contracts_used column"
  - "Both functions deployed to live Supabase database"
affects:
  - 01-03-route-handler-hardening
  - 01-04-route-handler-hardening
  - 01-05-route-handler-hardening
  - 01-06-route-handler-hardening

# Tech tracking
tech-stack:
  added:
    - "zod ^4.3.6"
  patterns:
    - "Atomic plan-gating via Postgres RPC with SELECT FOR UPDATE row lock"
    - "RPC returns pre-increment current_count for compensating decrement pattern (RELY-04)"
    - "security definer functions bypass RLS to allow atomic UPDATE from any session context"

key-files:
  created:
    - "supabase/migrations/002_atomic_gating.sql"
  modified:
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Used SELECT FOR UPDATE inside the RPC to prevent concurrent check-pass race condition — two simultaneous free-tier requests cannot both pass the limit check before either increments"
  - "current_count returned as pre-increment value so the calling route can use it for compensating decrement if the AI response fails to save (RELY-04)"
  - "Pro plan check is first in the if-chain — unlimited plan users are never gated regardless of current_count value"
  - "Zod 4.x (^4.3.6) installed — not 3.x as assumed in RESEARCH.md; Wave 2 plans must use Zod 4.x API (no z.string().min(), replaced by z.string().check())"

patterns-established:
  - "Atomic gate pattern: RPC does SELECT FOR UPDATE + conditional UPDATE + return {allowed, current_count}; route calls rpc(), checks allowed, proceeds or returns 429"
  - "Migration style: lowercase SQL keywords, public. schema prefix, security definer, language plpgsql — matches 001_initial.sql"

requirements-completed:
  - GATE-01
  - GATE-02
  - RELY-04

# Metrics
duration: ~15min (Task 1 automated) + human action (Task 2)
completed: 2026-04-23
---

# Phase 01 Plan 01: Install Zod and Atomic RPC Migration Summary

**Zod 4.x installed and two Postgres security-definer RPC functions deployed to Supabase that atomically check and increment free-tier usage with a SELECT FOR UPDATE row lock**

## Performance

- **Duration:** ~15 min (Task 1 auto) + human action for Task 2 (migration apply)
- **Started:** 2026-04-23
- **Completed:** 2026-04-23
- **Tasks:** 2 (1 auto + 1 human-action checkpoint)
- **Files modified:** 3 (package.json, package-lock.json, supabase/migrations/002_atomic_gating.sql)

## Accomplishments
- Zod 4.x (^4.3.6) added to package.json dependencies — all Wave 2 route hardening plans can import directly
- `check_and_increment_defense_responses(uid uuid)` RPC written and deployed: atomically increments `defense_responses_used`, returns `{allowed, current_count}`
- `check_and_increment_contracts(uid uuid)` RPC written and deployed: same pattern for `contracts_used` column
- Both functions use `SELECT FOR UPDATE` row lock — concurrent free-tier requests cannot both pass the gate before either increments (fixes GATE-01, GATE-02)
- Both functions return the pre-increment `current_count` enabling the compensating decrement pattern required by RELY-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zod and write migration file** - `64eb1aa` (feat)
2. **Task 2: Apply migration to Supabase database** - human action (no commit — database operation)

**Plan metadata:** pending (this SUMMARY commit)

## Files Created/Modified
- `supabase/migrations/002_atomic_gating.sql` - Two Postgres RPC functions: `check_and_increment_defense_responses` and `check_and_increment_contracts`. Both use `FOR UPDATE` row lock, `security definer`, return `jsonb_build_object('allowed', allowed, 'current_count', current_count)`.
- `package.json` - Added `"zod": "^4.3.6"` to dependencies
- `package-lock.json` - Updated with zod dependency tree

## Decisions Made
- SELECT FOR UPDATE inside the RPC prevents the concurrent check-pass race condition that would cause free users to exceed their limit under load
- `current_count` is the pre-increment value so the calling route can store it and use it as the exact value to decrement back to if the subsequent AI call or DB insert fails — avoids charging a credit for a failed request (RELY-04)
- Pro plan check fires first in the conditional so unlimited-plan users never trigger any counting logic
- `security definer` is required because RLS policies restrict which rows a session can UPDATE; the RPC needs to UPDATE the authenticated user's row without the RLS restriction interfering

## Deviations from Plan

**1. [Noted - Version] Zod 4.x installed instead of 3.x**
- **Found during:** Task 1 (npm install)
- **Issue:** RESEARCH.md assumed Zod 3.x API. npm resolved `^4.3.6` (latest stable). Zod 4.x has breaking API changes — `z.string().min()` is replaced by `z.string().check()`, object methods differ.
- **Fix:** No code fix needed at this stage (no Zod schemas written yet). Noted as a forward constraint.
- **Files modified:** None beyond normal package.json/lock
- **Impact:** Wave 2 plans (01-03, 01-04, 01-05) must use Zod 4.x API — tracked in STATE.md Deferred Items

---

**Total deviations:** 1 (noted, no code impact — Zod version difference; Wave 2 plans must be authored for 4.x API)
**Impact on plan:** No scope change. All plan objectives met as specified.

## Issues Encountered
- None during Task 1. Task 2 was a planned human-action checkpoint — user applied the migration via Supabase dashboard SQL editor and confirmed both functions exist.

## User Setup Required
Task 2 required manual user action: the migration was applied by pasting `supabase/migrations/002_atomic_gating.sql` into the Supabase SQL editor. Confirmed complete — both `check_and_increment_defense_responses` and `check_and_increment_contracts` functions are live in the database.

No future manual setup steps remain from this plan.

## Next Phase Readiness
- Wave 1 plan (01-02) can proceed: auth callback, login error banner, off-topic system prompt guard
- Wave 2 plans (01-03, 01-04, 01-05) can proceed: both RPC functions exist in the database and are callable via `supabase.rpc()`
- All Wave 2 Zod schema authoring must use Zod 4.x API — verify against `node_modules/zod` before writing schemas

---
*Phase: 01-route-handler-hardening*
*Completed: 2026-04-23*
