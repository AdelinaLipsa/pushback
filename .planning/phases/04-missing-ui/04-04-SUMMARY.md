---
phase: 04-missing-ui
plan: "04"
subsystem: ui
tags: [react, stripe, upgrade-nudge, free-tier, lime]

# Dependency graph
requires:
  - phase: 04-missing-ui
    provides: lib/ui.ts btnStyles with lime accent; UpgradePrompt.tsx with handleUpgrade pattern
  - phase: 01-route-handler-hardening
    provides: POST /api/checkout route (Stripe checkout session creation)
provides:
  - isNearLimit nudge strip in DefenseDashboard — lime-accented pre-wall upgrade prompt at 2/3 usage
affects: [verifier, 05-types-observability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - handleUpgrade pattern (POST /api/checkout → redirect) now also lives in DefenseDashboard (mirrors UpgradePrompt)
    - isNearLimit computed from plan + responsesUsed props — purely presentational, server-side enforcement remains authoritative

key-files:
  created: []
  modified:
    - components/defense/DefenseDashboard.tsx

key-decisions:
  - "04-04: isNearLimit = plan === 'free' && responsesUsed >= 2 && responsesUsed < FREE_LIMIT — exclusive of 3/3 (isAtLimit takes over at limit)"
  - "04-04: handleUpgrade placed directly in DefenseDashboard component (not extracted) — keeps it co-located with the nudge strip; mirrors UpgradePrompt pattern verbatim"
  - "04-04: Nudge strip is not dismissible — persists as long as isNearLimit is true; by design (not an oversight)"

patterns-established:
  - "isNearLimit + isAtLimit pair: near-limit shows nudge strip, at-limit shows UpgradePrompt wall — two-tier soft/hard paywall pattern"

requirements-completed: [UI-04]

# Metrics
duration: 7min
completed: 2026-04-24
---

# Phase 04 Plan 04: Missing UI — Nudge Strip Summary

**Lime-accented pre-wall upgrade nudge strip added to DefenseDashboard, triggering at exactly 2/3 free responses used via isNearLimit condition, with handleUpgrade mirroring UpgradePrompt.tsx POST /api/checkout pattern**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-24T11:58:44Z
- **Completed:** 2026-04-24T12:05:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `isNearLimit` constant (free user, exactly 2 of 3 responses used) and `upgradeLoading` state to DefenseDashboard
- Inserted non-dismissible lime-accented nudge strip between the intro paragraph block and the tool grid
- Strip copy: "2 of 3 responses used" (left) / "Upgrade to Pro →" (right), lime `var(--brand-lime)` left-border accent and CTA color
- `handleUpgrade` function in DefenseDashboard mirrors `UpgradePrompt.tsx` exactly: POST /api/checkout → redirect to data.url
- Existing `isAtLimit` + `UpgradePrompt` hard-wall path completely unchanged
- TypeScript compilation passes cleanly (2.9s, no errors)

## Task Commits

1. **Task 1: Add isNearLimit nudge strip to DefenseDashboard** - `c6ba9ae` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `components/defense/DefenseDashboard.tsx` — added upgradeLoading state, isNearLimit constant, handleUpgrade function, nudge strip JSX between intro block and tool grid

## Decisions Made

- `isNearLimit` is exclusive at the upper bound (`responsesUsed < FREE_LIMIT`) so it doesn't fire at 3/3 — the existing `UpgradePrompt` hard wall takes over at that point
- `handleUpgrade` placed inline in the component (not extracted to lib/ui.ts) — keeps it co-located with the strip; duplication is intentional as the strip and UpgradePrompt are independent upgrade surfaces
- Nudge strip intentionally non-dismissible — design decision for conversion pressure at the 2/3 mark

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The `npm run build` produced a pre-existing runtime error in `/api/webhooks/stripe` (missing `ANTHROPIC_API_KEY` env var in build environment). This error pre-dates this plan and is unrelated to `DefenseDashboard.tsx`. TypeScript compilation itself passed cleanly with no errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 04 (Missing UI) is now complete — all 4 plans done:
- 04-01: lib/ui.ts shared button styles + color tokens
- 04-02: ContractDeleteButton client component
- 04-03: ProjectHeader with inline edit form + delete dialog
- 04-04: DefenseDashboard isNearLimit nudge strip (this plan)

Ready for Phase 05 (Types & Observability).

## Self-Check: PASSED

- components/defense/DefenseDashboard.tsx: FOUND
- .planning/phases/04-missing-ui/04-04-SUMMARY.md: FOUND
- commit c6ba9ae: FOUND

---
*Phase: 04-missing-ui*
*Completed: 2026-04-24*
