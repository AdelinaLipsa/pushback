---
phase: 06-proactive-detection
plan: "03"
subsystem: ui
tags: [react, typescript, inline-styles, defense-dashboard]

# Dependency graph
requires:
  - phase: 06-01
    provides: initialSituation prop on SituationPanel, MessageAnalysis type
  - phase: 06-02
    provides: POST /api/projects/[id]/analyze-message route
  - phase: 04-missing-ui
    provides: lib/ui.ts btnStyles, inputStyle, DefenseDashboard state structure
provides:
  - Full analyze UX in DefenseDashboard: textarea, button, result banner, start over, divider, SituationPanel pre-fill
affects:
  - Project page UX — analyze section now appears above tool grid for all users

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled textarea with inline onFocus/onBlur border color toggle (lime focus ring, bg-border blur)"
    - "Spread + override pattern for disabled button: {...btnStyles.primary, opacity: 0.6, cursor: 'not-allowed'}"
    - "response-enter CSS animation class reused on result banner for slide-in consistency"

key-files:
  created: []
  modified:
    - components/defense/DefenseDashboard.tsx

key-decisions:
  - "analyzeError rendered inside analyze card (below button), not at top level — co-located with the action that caused it"
  - "Result banner uses both borderLeft: '3px solid var(--brand-lime)' and border: '1px solid var(--bg-border)' — left border overrides left side of general border, providing lime strip accent"
  - "Start over clears four state vars (analysisResult, messageInput, selectedTool, response) — full reset to fresh state"
  - "Divider + 'Or pick manually:' label always visible — not conditional on analysisResult — power users always see the manual path"
  - "DefenseResponse import retained but unused (pre-existing — not introduced by this plan)"

patterns-established:
  - "Optional seed prop pattern (initialSituation) wired through: state set in Wave 1, passed in Wave 3"

requirements-completed:
  - DETECT-01
  - DETECT-02
  - DETECT-03

# Metrics
duration: 12min
completed: 2026-04-24
---

# Phase 6 Plan 03: DefenseDashboard Analyze UX Summary

**Complete proactive detection UX in DefenseDashboard: textarea input, handleAnalyze fetch, result banner with lime left-strip, start-over reset, divider, and SituationPanel pre-fill via initialSituation prop**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-24T16:53:52Z
- **Completed:** 2026-04-24
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added four new state variables to `DefenseDashboard`: `messageInput`, `analyzeLoading`, `analysisResult` (typed with `DefenseTool`), `analyzeError`
- Added `handleAnalyze` async function: fetch POST `/api/projects/[id]/analyze-message`, handles UPGRADE_REQUIRED (403 → `setShowUpgrade(true)`), generic errors (`analyzeError`), and success path (`setAnalysisResult` + `selectTool`)
- Imported `btnStyles` and `inputStyle` from `@/lib/ui`
- Added analyze section card at top of DefenseDashboard: label, textarea (4 rows, maxLength 3000, lime focus ring), character count (`{n} / 3000`), analyzeError display, and full-width Analyze Message button
- Added result banner with `response-enter` animation, `3px solid var(--brand-lime)` left-strip, tool name in lime bold, explanation in `var(--text-secondary)`
- Added Start over button (ghost style, right-aligned) that clears `analysisResult`, `messageInput`, `selectedTool`, `response`
- Added always-visible divider and "Or pick manually:" label between analyze section and tool grid
- Updated `SituationPanel` call site to pass `initialSituation={analysisResult?.situation_context}`
- Render order matches UI-SPEC: analyze card → result banner → start over → divider → instruction → tool grid → generateError → SituationPanel → ResponseOutput

## Task Commits

Each task was committed atomically:

1. **Task 1: Add new state variables and handleAnalyze function** - `2b2f02d` (feat)
2. **Task 2: Add analyze section JSX and update render order** - `7a88b7a` (feat)

## Files Created/Modified

- `components/defense/DefenseDashboard.tsx` — 145 lines added across two tasks; render order restructured per UI-SPEC

## Decisions Made

- analyzeError is rendered inside the analyze card (below the Analyze button), not at the top level — co-located with the action
- Result banner uses both `borderLeft: '3px solid var(--brand-lime)'` and `border: '1px solid var(--bg-border)'` as specified in UI-SPEC
- Divider + "Or pick manually:" label always renders regardless of `analysisResult` state

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. `DefenseDashboard` is a client component — all new surface is user-controlled textarea input serialized to the existing `/api/projects/[id]/analyze-message` route (already threat-modeled in 06-02). Mitigations T-06-03-01 through T-06-03-04 implemented as specified: JSX text nodes (no dangerouslySetInnerHTML), maxLength={3000} UX guard, isAtLimit check in handleAnalyze, button disabled during analyzeLoading.

## Known Stubs

None — all new state variables are wired to live API calls and rendered in JSX. No hardcoded placeholder data.

## Self-Check: PASSED

- `components/defense/DefenseDashboard.tsx` — exists and contains all required elements (verified via grep)
- Task 1 commit `2b2f02d` — present in git log
- Task 2 commit `7a88b7a` — present in git log
- TypeScript: only pre-existing `hideSourceMaps` error in `next.config.ts` (Phase 5 Sentry, not introduced here)

---
*Phase: 06-proactive-detection*
*Completed: 2026-04-24*
