---
phase: 01-route-handler-hardening
plan: 04
subsystem: api
tags: [supabase-rpc, anthropic, file-validation, json-extraction, credit-safety]

# Dependency graph
requires:
  - phase: 01-route-handler-hardening/01-01
    provides: supabase migration 002_atomic_gating.sql with check_and_increment_contracts RPC deployed
  - phase: 01-route-handler-hardening/01-03
    provides: preIncrementCount compensating decrement pattern established in defend route
provides:
  - Hardened contract analysis route with atomic RPC gate, file type/size validation, extractJson helper, and credit-safe update
affects: [contracts-feature, plan-gating, ai-output-parsing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - extractJson inline helper for robust AI output parsing (handles preamble and markdown-fenced JSON)
    - Compensating decrement on all failure paths after RPC gate increment
    - File type and size validation before Anthropic Files API upload

key-files:
  created: []
  modified:
    - app/api/contracts/analyze/route.ts

key-decisions:
  - "D-13 extractJson is inline in route file (not a separate lib module) — keeps extraction logic co-located with the route that owns it"
  - "Compensating decrement uses preIncrementCount (absolute value) not contracts_used - 1 — prevents race condition if another request updates the count between the check and decrement"
  - "File validation runs inside the try block after contract row is inserted — cleanup requires both status:error update and preIncrementCount restore"

patterns-established:
  - "extractJson pattern: try JSON.parse, fall back to regex /\\{[\\s\\S]*\\}/, throw 'No valid JSON found in response' — catch block distinguishes parse errors"
  - "Credit-safe update pattern: capture updateError, compensate preIncrementCount before returning error response"

requirements-completed: [RELY-02, GATE-02, VALID-03]

# Metrics
duration: 8min
completed: 2026-04-23
---

# Phase 01 Plan 04: Contracts Analyze Route Hardening Summary

**Atomic RPC gate replacing non-atomic read-then-write, PDF/size validation before Anthropic upload, extractJson helper for markdown-wrapped AI output, and credit-safe compensating decrements on all failure paths**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-23T21:10:45Z
- **Completed:** 2026-04-23T21:18:45Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced non-atomic profile select+check with `supabase.rpc('check_and_increment_contracts')` — closes concurrent free-tier bypass (GATE-02)
- Added file type (`application/pdf`) and size (`> 10 MB`) validation before any Anthropic Files API upload — rejects invalid input with 400 before spending API credits (VALID-03)
- Added `extractJson` inline helper replacing bare `JSON.parse` — handles Claude preamble text and markdown-fenced JSON responses (RELY-02)
- Added credit-safe DB update: captures `updateError`, compensates `preIncrementCount` on failure — user never charged for failed analysis (D-03)
- Removed manual `contracts_used` increment — RPC handles it atomically at the gate
- Differentiated parse errors vs generic errors in catch block — returns specific `Contract analysis returned malformed output — please try again` message (D-13)
- Added compensating decrement on all failure paths: contract insert failure, file type validation, file size validation, no-file/text case, DB update failure, and catch-all

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace non-atomic gate, add file validation, add extractJson, credit-safe update** - `e2b3e51` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/api/contracts/analyze/route.ts` - Complete rewrite: atomic RPC gate, file validation, extractJson helper, credit-safe update, compensating decrements on all failure paths

## Decisions Made
- `extractJson` is defined inline in the route file (per D-13), not extracted to a shared lib module — keeps the extraction logic co-located with the route that owns it
- Compensating decrement uses `preIncrementCount` (the absolute count stored before increment) rather than `contracts_used - 1` — avoids race conditions if another concurrent request modifies the count between RPC and compensate
- File validation runs INSIDE the try block after contract row insertion — required cleanup includes both `status: 'error'` update AND `preIncrementCount` restore
- The `extractJson` regex `/\{[\s\S]*\}/` is greedy — matches the outermost `{...}` which is always the top-level contract analysis object

## Deviations from Plan

None - plan executed exactly as written.

**Note on lint:** `npm run lint` exits non-zero due to pre-existing `@typescript-eslint/no-explicit-any` errors in `analyze/route.ts` lines 73 and 79 (the `(anthropic.beta.files as any).upload(...)` and `as any` cast on the document message content). These `any` usages were in the original scaffold file and are tracked in the 01-01 deferred items as out-of-scope for Phase 1. No new lint errors were introduced by this plan.

## Issues Encountered
- Pre-existing lint errors in `analyze/route.ts` (two `no-explicit-any` on Anthropic SDK lines) prevent `npm run lint` from exiting 0. These are tracked as deferred in STATE.md from 01-01 and are not addressed per plan constraints.

## User Setup Required
None - no external service configuration required. The `check_and_increment_contracts` RPC was deployed in 01-01 as a prerequisite.

## Next Phase Readiness
- Contract analysis route is fully hardened alongside the defend route (hardened in 01-03)
- All four route hardening changes applied: atomic gate, file validation, extractJson, credit-safe update
- Ready for 01-05 (projects route Zod validation) which completes the route hardening phase

---
*Phase: 01-route-handler-hardening*
*Completed: 2026-04-23*
