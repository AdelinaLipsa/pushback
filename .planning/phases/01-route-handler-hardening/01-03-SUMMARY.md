---
phase: 01-route-handler-hardening
plan: 03
subsystem: api
tags: [zod, supabase-rpc, atomic-gating, error-handling, credit-safety, postgres]

# Dependency graph
requires:
  - phase: 01-route-handler-hardening/01-01
    provides: supabase RPC functions check_and_increment_defense_responses deployed via 002_atomic_gating.sql
provides:
  - Hardened defend route with Zod input validation rejecting invalid tool_type and out-of-range situation
  - Atomic plan gate via check_and_increment_defense_responses RPC preventing concurrent free-tier bypass
  - try/catch error handling returning D-01 message on Anthropic failure with compensating decrement
  - Credit-safe insert returning D-02 message on DB failure with compensating decrement to preIncrementCount
affects: [payments, api, gate-enforcement]

# Tech tracking
tech-stack:
  added: [zod]
  patterns:
    - Atomic RPC gate pattern (check_and_increment_* + preIncrementCount compensating decrement)
    - Credit-safe insert pattern (saveError check before returning success)
    - Zod safeParse with first-issue error response

key-files:
  created: []
  modified:
    - app/api/projects/[id]/defend/route.ts

key-decisions:
  - "Compensating decrement also applied on Zod parse failure and project-not-found within the try block — belt-and-suspenders: RPC already incremented before these checks run, so all failure paths must restore preIncrementCount"
  - "Zod schema uses Object.keys(TOOL_LABELS) cast to [string, ...string[]] — safe because TOOL_LABELS always has exactly 8 known keys; avoids duplicating the enum values"

patterns-established:
  - "Atomic RPC gate: supabase.rpc('check_and_increment_*', { uid }) + gateError || !gateResult?.allowed check"
  - "preIncrementCount: always restore via .update({ counter: preIncrementCount }) on every failure path after RPC gate"
  - "Credit-safe insert: destructure saveError from .insert().select().single(), compensate and return 500 if saveError || !saved"
  - "try/catch wraps all post-gate work: catch block compensates and returns D-01 error string"

requirements-completed: [RELY-01, RELY-04, GATE-01, VALID-01]

# Metrics
duration: 8min
completed: 2026-04-24
---

# Phase 01 Plan 03: Defend Route Hardening Summary

**Defend route hardened with Zod validation, atomic Postgres RPC plan gate, try/catch with D-01 error, and credit-safe insert with compensating decrement on all failure paths**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-24T00:00:00Z
- **Completed:** 2026-04-24T00:08:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added Zod schema validating tool_type against TOOL_LABELS enum keys, situation within 10-2000 chars, extra_context string/number record values up to 500 chars
- Replaced non-atomic profile read + conditional increment with single check_and_increment_defense_responses RPC call — eliminates concurrent free-tier bypass revenue leak
- Wrapped all post-gate work in try/catch; catch block applies compensating decrement and returns exact D-01 error string
- Credit-safe insert checks saveError before returning success; on failure, compensating decrement restores preIncrementCount and returns D-02 error
- Compensating decrement applied on all failure paths (Zod parse failure, project not found, Anthropic error, insert failure)

## Task Commits

1. **Tasks 1+2: Zod schema + atomic RPC gate + try/catch + credit-safe insert** - `3a680d9` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `app/api/projects/[id]/defend/route.ts` - Fully hardened defend route: Zod validation, atomic RPC gate, try/catch, credit-safe insert with compensating decrements

## Decisions Made

- Compensating decrement applied on Zod parse failure and project-not-found inside the try block — RPC has already incremented by this point, so all failure paths after the gate must restore preIncrementCount
- Both Task 1 (Zod schema) and Task 2 (structural rewrite) implemented in a single Write since Task 2 is a complete file replacement that incorporates Task 1 output

## Deviations from Plan

None - plan executed exactly as written. The complete final file from the plan spec was implemented in one atomic Write operation (Tasks 1 and 2 together, since Task 2 was specified as a full file replacement incorporating Task 1).

## Issues Encountered

None. Pre-existing lint errors in other files (PushbackHero.tsx, ProjectCard.tsx, etc.) remain deferred per the plan constraint — no new lint errors introduced in the modified file.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. The defend route already existed; this change only adds input validation and replaces the plan gate mechanism. No new threat flags.

## Known Stubs

None — the defend route is fully wired to Anthropic and the database.

## Self-Check

- `app/api/projects/[id]/defend/route.ts` — present and contains all required patterns
- Commit `3a680d9` — verified in git log
- `check_and_increment_defense_responses` — present in file (line 34)
- `preIncrementCount` — present 4 times (gate store + 3 failure paths)
- `saveError` — present (lines 105, 111)
- `AI generation failed — please try again` — present (line 128)
- `Failed to save response — your credit was not used. Please try again.` — present (line 117)
- Old non-atomic pattern `.select('plan, defense_responses_used')` — absent

## Self-Check: PASSED

## Next Phase Readiness

- Defend route is fully hardened; plan 01-03 requirements RELY-01, RELY-04, GATE-01, VALID-01 satisfied
- Contracts analyze route (01-04) can now proceed with same atomic RPC pattern as reference
- No blockers

---
*Phase: 01-route-handler-hardening*
*Completed: 2026-04-24*
