---
phase: 04-missing-ui
plan: 02
subsystem: ui
tags: [react, next.js, dialog, fetch, supabase, anthropic, delete-flow]

# Dependency graph
requires:
  - phase: 04-01
    provides: components/ui/dialog.tsx and lib/ui.ts shared style constants
provides:
  - app/api/contracts/[id]/route.ts — DELETE handler with best-effort Anthropic Files API cleanup before Supabase row delete
  - components/contract/ContractDeleteButton.tsx — client component with Dialog confirmation, error swap, and post-delete redirect
  - app/(dashboard)/contracts/[id]/page.tsx — wires ContractDeleteButton into contract detail page
affects:
  - 04-03-PLAN.md
  - 04-04-PLAN.md

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SELECT before DELETE pattern: fetch anthropic_file_id before deleting the row (row gone after delete)"
    - "Best-effort Anthropic cleanup: try/catch around Files API delete; Supabase delete proceeds regardless"
    - "Dialog swap pattern: single Dialog open flag + isError flag toggles between confirm and error content"
    - "Spread-merge for disabled button style: { ...btnStyles.destructive, ...(disabled ? overrides : {}) }"

key-files:
  created:
    - components/contract/ContractDeleteButton.tsx
  modified:
    - app/api/contracts/[id]/route.ts
    - app/(dashboard)/contracts/[id]/page.tsx

key-decisions:
  - "showCloseButton={false} on DialogContent — custom action buttons replace the default X close button for delete confirmation UX"
  - "SELECT before DELETE with ownership check (eq('user_id', user.id)) on both queries — prevents IDOR and ensures file ID is read before row deletion"
  - "Best-effort Anthropic delete (D-12): try/catch logs error but never fails the whole DELETE operation"

patterns-established:
  - "Dialog swap: single dialogOpen boolean + isError flag; no separate error dialog mount"

requirements-completed: [UI-03]

# Metrics
duration: 2min
completed: 2026-04-24
---

# Phase 4 Plan 02: Missing UI — Contract Delete Summary

**Contract delete flow: best-effort Anthropic Files API cleanup in DELETE route + ContractDeleteButton with Dialog confirmation, error swap, and redirect to /contracts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-24T11:47:51Z
- **Completed:** 2026-04-24T11:49:29Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Updated `DELETE /api/contracts/[id]` to SELECT `anthropic_file_id` before deleting the row, attempt best-effort Anthropic Files API cleanup, then proceed with Supabase delete regardless of Anthropic outcome
- Created `components/contract/ContractDeleteButton.tsx` — 'use client' component with "Delete contract" outline button, Dialog confirmation with destructive confirm + cancel buttons, error dialog swap on API failure, and `router.push('/contracts')` on success
- Wired `ContractDeleteButton` into `app/(dashboard)/contracts/[id]/page.tsx` after filename paragraph and before status/analysis blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Update contracts DELETE route with Anthropic file cleanup** - `2dc20e9` (feat)
2. **Task 2: Create ContractDeleteButton and wire into contract detail page** - `e875df0` (feat)

## Files Created/Modified

- `app/api/contracts/[id]/route.ts` — DELETE handler updated: SELECT anthropic_file_id, best-effort Anthropic Files API delete (try/catch), then Supabase row delete; ownership enforced on both queries via eq('user_id', user.id)
- `components/contract/ContractDeleteButton.tsx` — new 'use client' component; state: dialogOpen, deleting, isError, errorMessage; imports btnStyles and dialogContentStyle from @/lib/ui
- `app/(dashboard)/contracts/[id]/page.tsx` — imports and renders ContractDeleteButton with contractId={contract.id} after filename paragraph

## Decisions Made

- Used `showCloseButton={false}` on `DialogContent` — the default X close button from 04-01's dialog.tsx was suppressed since the delete confirmation UX provides explicit "Yes, delete" / "Cancel" / "Dismiss" action buttons
- SELECT before DELETE with `eq('user_id', user.id)` on both queries — ownership verified before any side effect; prevents IDOR per threat register T-04-02-01
- Best-effort Anthropic delete: `try/catch` wraps the Files API call; `console.error` logs failures but Supabase delete always proceeds — per D-12 accepted risk T-04-02-03

## Deviations from Plan

None - plan executed exactly as written. Task 1 had been pre-committed before this execution; verified all done-criteria matched the spec before proceeding to Task 2.

## Issues Encountered

- `npm run build` fails at page data collection phase due to missing `ANTHROPIC_API_KEY` at build time (pre-existing issue — Stripe webhook route also affected). TypeScript compilation finished cleanly (`Finished TypeScript` — no TS errors). Not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UI-03 (contract delete) is complete — users can delete contracts from the contract detail page with confirmation dialog
- Wave 1 plans 04-03 and 04-04 can proceed independently
- No blockers introduced

---
*Phase: 04-missing-ui*
*Completed: 2026-04-24*
