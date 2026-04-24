---
phase: 06-proactive-detection
plan: "01"
subsystem: types, api, ui
tags: [typescript, anthropic, react, classification]

# Dependency graph
requires:
  - phase: 01-route-handler-hardening
    provides: defend route pattern (auth, RPC gate, compensating decrement)
  - phase: 04-missing-ui
    provides: lib/ui.ts btnStyles.primary, DefenseDashboard state structure
provides:
  - MessageAnalysis type in types/index.ts (used by analyze-message route + dashboard)
  - CLASSIFY_SYSTEM_PROMPT constant in lib/anthropic.ts (used by analyze-message route)
  - initialSituation prop on SituationPanel (used by DefenseDashboard post-classification)
affects:
  - 06-02 (analyze-message route imports MessageAnalysis and CLASSIFY_SYSTEM_PROMPT)
  - 06-03 (DefenseDashboard passes initialSituation to SituationPanel)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CLASSIFY_SYSTEM_PROMPT follows same template literal pattern as CONTRACT_ANALYSIS_SYSTEM_PROMPT and DEFENSE_SYSTEM_PROMPT"
    - "Optional prop with ?? default — initialSituation?: string with useState(initialSituation ?? '') avoids breaking existing call sites"

key-files:
  created: []
  modified:
    - types/index.ts
    - lib/anthropic.ts
    - components/defense/SituationPanel.tsx

key-decisions:
  - "MessageAnalysis type defined inline in types/index.ts (no new imports — DefenseTool co-located)"
  - "CLASSIFY_SYSTEM_PROMPT appended at end of lib/anthropic.ts, same template literal export pattern as existing prompts"
  - "initialSituation prop defaults to empty string via ?? — existing call sites passing no prop continue to work without change"

patterns-established:
  - "Optional seed prop pattern: add prop with ?:, destructure in signature, use in useState initializer with ?? fallback"

requirements-completed:
  - DETECT-01
  - DETECT-02

# Metrics
duration: 8min
completed: 2026-04-24
---

# Phase 6 Plan 01: Foundation Types and Constants Summary

**MessageAnalysis type, CLASSIFY_SYSTEM_PROMPT with all 8 tool descriptions, and initialSituation prop that pre-seeds the SituationPanel textarea from AI classification output**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-24T16:43:41Z
- **Completed:** 2026-04-24T16:51:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Exported `MessageAnalysis` type (`tool_type: DefenseTool`, `explanation: string`, `situation_context: string`) from `types/index.ts` — the shared contract Wave 2 (route) and Wave 3 (dashboard) both import
- Exported `CLASSIFY_SYSTEM_PROMPT` from `lib/anthropic.ts` with all 8 tool categories, first-person situation_context instruction, and JSON-only output rule — ready for the analyze-message route to use
- Added `initialSituation?: string` prop to `SituationPanel` with `useState(initialSituation ?? '')` — pre-fill flows through automatically; all existing call sites unaffected (prop is optional)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add MessageAnalysis type to types/index.ts** - `485308c` (feat)
2. **Task 2: Add CLASSIFY_SYSTEM_PROMPT to lib/anthropic.ts** - `979af4c` (feat)
3. **Task 3: Add initialSituation prop to SituationPanel.tsx** - `29ca743` (feat)

## Files Created/Modified

- `types/index.ts` - Added `MessageAnalysis` export after `DefenseResponse` type (lines 113-117)
- `lib/anthropic.ts` - Appended `CLASSIFY_SYSTEM_PROMPT` constant (lines 139-166)
- `components/defense/SituationPanel.tsx` - Added `initialSituation?: string` prop and updated useState initializer

## Decisions Made

None beyond what was already specified in the plan — followed plan exactly as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `next.config.ts` (line 56: `hideSourceMaps` not in `SentryBuildOptions` — from Phase 5 Sentry config). Not introduced by these changes; no modified file produced any new TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 (06-02): `analyze-message` route can now import `MessageAnalysis` and `CLASSIFY_SYSTEM_PROMPT` — both exports are in place
- Wave 3 (06-03): `DefenseDashboard` can pass `initialSituation={analysisResult.situation_context}` to `SituationPanel` — prop is accepted and wired to useState
- No blockers for either downstream plan

---
*Phase: 06-proactive-detection*
*Completed: 2026-04-24*
