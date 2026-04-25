---
phase: 09-contract-intelligence
plan: 02
subsystem: ui
tags: [react, lucide-react, clipboard, typescript]

requires: []
provides:
  - Inline copy button on ClauseCard "What to say back" label row
affects: []

tech-stack:
  added: []
  patterns: [inline ghost button with copied state feedback, 44px touch target]

key-files:
  created: []
  modified:
    - components/contract/ClauseCard.tsx

key-decisions:
  - "Inline ghost button (not full CopyButton component) per D-15"
  - "Lime success color hardcoded as #84cc16 (not CSS var) for copied state per D-13"

requirements-completed: [SC-03]

duration: 5min
completed: 2026-04-25
---

# Phase 09 Plan 02: ClauseCard Copy Button Summary

**Inline `Copy`/`Check` ghost button on the "What to say back" label row — copies `pushback_language` to clipboard with 2-second lime feedback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-25T00:12:00Z
- **Completed:** 2026-04-25T00:17:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `Copy` and `Check` Lucide icons import
- Added `copied` useState and `handleCopyPushback` async function with silent catch
- Converted "What to say back" label from plain `<p>` to flex row (`space-between`) with 44px touch-target copy button
- Copied state shows `Check` in lime (#84cc16) for 2000ms then reverts to `Copy` in `var(--text-muted)`

## Task Commits

1. **Task 1: Add inline copy button to ClauseCard** — `2eb5bd3` (feat)

## Files Created/Modified
- `components/contract/ClauseCard.tsx` — lucide import, copied state, handleCopyPushback, flex label row

## Decisions Made
- Used inline ghost button (no import of full CopyButton component) per D-15
- Success color hardcoded `#84cc16` rather than `var(--brand-lime)` per D-13 to avoid the amber-maps-to-lime var confusion noted in RESEARCH.md Pitfall 2

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## Self-Check: PASSED

- `handleCopyPushback` at lines 17 + 78 ✓
- `navigator.clipboard.writeText` at line 19 ✓
- `setCopied(true)` and `setCopied(false)` present ✓
- `Copy, Check` on lucide-react import line ✓
- `aria-label="Copy to clipboard"` at line 79 ✓
- `justifyContent: 'space-between'` on label wrapper div ✓
- `npx tsc --noEmit` exits 0 ✓

## Next Phase Readiness
- Wave 1 complete. Plan 09-03 (prop chain wiring) can now execute in Wave 2.

---
*Phase: 09-contract-intelligence*
*Completed: 2026-04-25*
