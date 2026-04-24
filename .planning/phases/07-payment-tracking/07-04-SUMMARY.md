---
phase: 07-payment-tracking
plan: "04"
subsystem: ui
tags: [react, typescript, payment-tracking, client-component, state-lift]

# Dependency graph
requires:
  - phase: 07-01
    provides: payment DB columns, PATCH route support for payment fields
  - phase: 07-02
    provides: ProjectCard + ProjectHeader overdue badge display
  - phase: 07-03
    provides: DefenseDashboard initialPaymentPrefill prop, SituationPanel initialContextFields prop
provides:
  - PaymentSection client component with all three states (empty, populated, received)
  - ProjectDetailClient thin client wrapper holding paymentPrefill state
  - page.tsx simplified to server-only fetch delegating all JSX to ProjectDetailClient
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - State-lift pattern: PaymentSection callback -> ProjectDetailClient state -> DefenseDashboard prop
    - Supabase-inferred nullable vs Project type mismatch: use `as unknown as Project` cast (mirrors profile cast)

key-files:
  created:
    - components/project/PaymentSection.tsx
    - components/project/ProjectDetailClient.tsx
  modified:
    - app/(dashboard)/projects/[id]/page.tsx

key-decisions:
  - "Type cast project as unknown as Project in page.tsx to reconcile Supabase nullable currency vs Project string type — mirrors profile as UserProfile pattern already in file"
  - "PaymentSection renders below DefenseDashboard (above history link) per D-04 placement spec"
  - "id='defense-dashboard' on div wrapper around DefenseDashboard in ProjectDetailClient — scroll target for PaymentSection smooth scroll"

patterns-established:
  - "PaymentSection renderForm() helper reused for both empty state and edit mode — avoids JSX duplication"

requirements-completed:
  - PAY-01
  - PAY-02
  - PAY-03
  - PAY-04

# Metrics
duration: 10min
completed: 2026-04-24
---

# Phase 7 Plan 04: PaymentSection + ProjectDetailClient UI Wiring Summary

**PaymentSection (three states + two PATCH handlers + Handle Late Payment CTA) and ProjectDetailClient (paymentPrefill state lift) wired into project detail page, completing full payment tracking UI end-to-end**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-24T18:52:29Z
- **Completed:** 2026-04-24T19:02:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 3

## Accomplishments
- PaymentSection: empty state (form-only), populated state (status line + Edit), overdue state (OVERDUE badge + Handle Late Payment + Mark as Received), received state (green status line)
- buildPaymentPrefill: tier selection (payment_first 0-7d, payment_second 8-14d, payment_final 15+d) + context fields per tier
- ProjectDetailClient: thin 'use client' wrapper holding paymentPrefill state; threads it from PaymentSection callback to DefenseDashboard initialPaymentPrefill prop
- page.tsx simplified: all JSX (contract strip, defense dashboard, payment section, history link) moved to ProjectDetailClient; server component now only does auth + fetch + ProjectDetailClient render

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PaymentSection component** - `8edf835` (feat)
2. **Task 2: Create ProjectDetailClient and update page.tsx** - `07ea845` (feat)
3. **Task 3: Visual + functional verification** - Pending human checkpoint

**Plan metadata:** (docs commit — pending after human verification)

## Files Created/Modified
- `components/project/PaymentSection.tsx` - New: all three payment states, handleSavePayment, handleMarkReceived, handleLatePayment, buildPaymentPrefill, onHandleLatePayment callback interface
- `components/project/ProjectDetailClient.tsx` - New: 'use client' wrapper with paymentPrefill state, contract strip, DefenseDashboard with id="defense-dashboard", PaymentSection, history link
- `app/(dashboard)/projects/[id]/page.tsx` - Updated: imports ProjectDetailClient, removes ProjectHeader/DefenseDashboard/RISK_COLORS imports, simplified JSX

## Decisions Made
- Type cast `project as unknown as Project` in page.tsx — Supabase inferred type returns `currency: string | null` but Project type requires `string`; the DB enforces a default at insert time, so null is impossible at runtime. Mirrors the existing `profile as UserProfile` cast already in the file.
- PaymentSection placed below DefenseDashboard (above history link) — per D-04: "Payment section renders on the project detail page below the DefenseDashboard"
- `id="defense-dashboard"` on the wrapper div in ProjectDetailClient, not inside DefenseDashboard.tsx itself — keeps the scroll anchor at the page-layout level

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch for Supabase-inferred project type**
- **Found during:** Task 2 (ProjectDetailClient and page.tsx update)
- **Issue:** Supabase infers `currency: string | null` from the DB schema, but our `Project` type declares `currency: string`. Passing the raw Supabase result to `ProjectDetailClient` caused TS2322.
- **Fix:** Added `project as unknown as Project & { contracts?: ... }` cast in page.tsx after the `notFound()` guard, mirroring the existing `profile as UserProfile | null` pattern in the same file.
- **Files modified:** `app/(dashboard)/projects/[id]/page.tsx`
- **Verification:** `npx tsc --noEmit` passes with no new errors
- **Committed in:** `07ea845` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch bug)
**Impact on plan:** Necessary for TypeScript to compile. No scope creep.

## Issues Encountered
Pre-existing TypeScript error in `next.config.ts` (`hideSourceMaps` property on SentryBuildOptions) — not introduced by this plan, present since 07-03.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 (all 4 plans) complete pending human verification of Task 3
- All four PAY requirements (PAY-01 through PAY-04) implemented end-to-end
- Human verification needed: browser test of all four payment flows (empty save, overdue detection, Handle Late Payment prefill, Mark as Received)

## Self-Check

### Files exist:
- `components/project/PaymentSection.tsx` — FOUND
- `components/project/ProjectDetailClient.tsx` — FOUND
- `app/(dashboard)/projects/[id]/page.tsx` — FOUND (updated)

### Commits exist:
- `8edf835` (feat: PaymentSection) — FOUND
- `07ea845` (feat: ProjectDetailClient + page.tsx) — FOUND

## Self-Check: PASSED

---
*Phase: 07-payment-tracking*
*Completed: 2026-04-24*
