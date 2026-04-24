---
phase: 06-proactive-detection
plan: "02"
subsystem: api
tags: [typescript, anthropic, zod, supabase, route-handler]

# Dependency graph
requires:
  - phase: 06-01
    provides: CLASSIFY_SYSTEM_PROMPT in lib/anthropic.ts, MessageAnalysis type in types/index.ts
  - phase: 01-route-handler-hardening
    provides: defend route pattern (auth, RPC gate, compensating decrement, Zod validation)
provides:
  - POST /api/projects/[id]/analyze-message route with auth, RPC gate, Anthropic call, Zod validation, compensating decrement
affects:
  - 06-03 (DefenseDashboard calls this endpoint from handleAnalyze)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "extractJson inline helper: try JSON.parse → fallback regex /\\{[\\s\\S]*\\}/ → throw; handles Claude preamble-wrapped responses"
    - "Compensating decrement on 4 distinct paths: input validation failure, extractJson failure, Zod response failure, catch-all"
    - "classifyResponseSchema uses z.enum(DEFENSE_TOOL_VALUES) — unknown tool_type from Claude returns 500 with decrement, never reaches client"
    - "_id underscore prefix for destructured route param that is auth-scoped but not used in response (no DB row saved)"

key-files:
  created:
    - app/api/projects/[id]/analyze-message/route.ts
  modified: []

key-decisions:
  - "Route uses same defendRateLimit as the defend route — message analysis and defense generation share one rate limit bucket"
  - "No DB row saved for analysis calls — classification result is ephemeral; RPC credit is still counted (D-06)"
  - "max_tokens: 256 for classify call — physically constrains response size, complements Zod max() on explanation/situation_context fields"
  - "Inline extractJson (not a shared lib module) — keeps extraction logic co-located with the route that owns it (D-13)"

patterns-established:
  - "analyze-message route mirrors defend route exactly: auth → rate limit → RPC gate → preIncrementCount → try/catch with compensating decrement → Anthropic call → extractJson → Zod → return"

requirements-completed:
  - DETECT-01
  - DETECT-03

# Metrics
duration: 6min
completed: 2026-04-24
---

# Phase 6 Plan 02: Analyze-Message Route Summary

**POST /api/projects/[id]/analyze-message with auth, atomic RPC gating, CLASSIFY_SYSTEM_PROMPT, extractJson fallback, Zod enum validation on all 8 DefenseTool values, and compensating decrement on every failure path after the gate**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-24T17:00:00Z
- **Completed:** 2026-04-24T17:06:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `app/api/projects/[id]/analyze-message/route.ts` — the classification endpoint that accepts a raw client message, calls Claude with CLASSIFY_SYSTEM_PROMPT (max_tokens: 256), and returns `{ tool_type, explanation, situation_context }`
- Implemented full defense-in-depth: auth check (401), rate limit (429), RPC plan gate (403 UPGRADE_REQUIRED), input Zod validation (400), extractJson preamble handling, Zod enum validation on Claude response (500 with decrement)
- Compensating decrement fires on all 4 failure paths after the RPC gate: input validation failure, extractJson failure, Zod response failure, and the catch-all block — credit is never consumed on error

## Task Commits

Each task was committed atomically:

1. **Task 1: Create app/api/projects/[id]/analyze-message/route.ts** - `fbed5be` (feat)

**Plan metadata:** `53cc0c4` (docs: complete plan)

## Files Created/Modified

- `app/api/projects/[id]/analyze-message/route.ts` - New POST endpoint: auth + rate limit + RPC gate + Anthropic classify call + extractJson + Zod response validation + compensating decrement on all failure paths; no DB row saved

## Decisions Made

- Used `defendRateLimit` (same as defend route) rather than a separate analyze rate limit — consistent with D-04's "shared pool" approach; analysis and generation share one rate limit bucket per user
- `_id` underscore prefix for the route param — TypeScript strict mode ignores underscore-prefixed variables; the param is destructured to satisfy the route handler signature but the value is not used (no project row fetch, no DB save)
- `max_tokens: 256` physically constrains Claude's response size alongside Zod's `max(500)` on explanation and `max(1000)` on situation_context — belt-and-suspenders against T-06-02-06

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 3 (06-03): `DefenseDashboard.tsx` can now call `POST /api/projects/[id]/analyze-message` from `handleAnalyze` — route is live and returns `{ tool_type, explanation, situation_context }` which maps directly to the `analysisResult` state shape specified in D-09
- No blockers for 06-03

---
*Phase: 06-proactive-detection*
*Completed: 2026-04-24*
