---
phase: 07-payment-tracking
plan: "02"
subsystem: api, ui
tags: [nextjs, react, typescript, supabase, payment-tracking]

# Dependency graph
requires:
  - phase: 07-01
    provides: payment_due_date, payment_amount, payment_received_at columns on projects table and TypeScript types
provides:
  - PATCH /api/projects/[id] accepts payment_due_date, payment_amount, payment_received_at
  - OVERDUE pill badge on ProjectCard dashboard cards
  - OVERDUE pill badge on ProjectHeader detail page with extended interface
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [isOverdue boolean from payment_due_date/payment_received_at comparison, conditional pill badge with --urgency-high color]

key-files:
  created: []
  modified:
    - app/api/projects/[id]/route.ts
    - components/project/ProjectCard.tsx
    - components/project/ProjectHeader.tsx

key-decisions:
  - "Task 1 (route.ts allowed list) was already committed at 8fb3800 before this plan ran — counted as complete with no re-commit needed"
  - "isOverdue uses server-side new Date() in ProjectCard (Server Component) — acceptable per RESEARCH.md Pitfall 6; date comparison runs at render time on server"
  - "isOverdue in ProjectHeader uses nullish coalescing guards and non-null assertion (payment_due_date!) — safe because the outer null check ensures non-null before the Date constructor"
  - "OVERDUE badge placed after riskLevel badge in ProjectCard chip cluster and after status badge in ProjectHeader badge row — does not replace existing badges"

patterns-established:
  - "OVERDUE pill: rgba(239,68,68,0.1) background with var(--urgency-high) text, 0.7rem font, fontWeight 600, 9999px border-radius"
  - "Payment overdue detection: payment_due_date !== null && payment_received_at === null && new Date(payment_due_date) < new Date()"

requirements-completed: [PAY-01, PAY-02, PAY-04]

# Metrics
duration: 15min
completed: 2026-04-24
---

# Phase 7 Plan 02: Payment Tracking — PATCH Route and OVERDUE Badges Summary

**PATCH route extended to accept payment fields and OVERDUE pill badges added to ProjectCard dashboard chips and ProjectHeader badge row using --urgency-high red accent**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-24T18:50:00Z
- **Completed:** 2026-04-24T19:05:00Z
- **Tasks:** 3 (Task 1 already committed; Tasks 2-3 committed in this run)
- **Files modified:** 3

## Accomplishments
- Confirmed `app/api/projects/[id]/route.ts` allowed list includes `payment_due_date`, `payment_amount`, `payment_received_at` (committed at `8fb3800` before plan execution)
- Added conditional OVERDUE pill badge to `ProjectCard` chip cluster (after riskLevel badge) using `isOverdue` boolean already computed in the file
- Extended `ProjectHeaderProps` interface with three optional payment fields and added `isOverdue` const + OVERDUE pill badge in read-view badge row (after status span, before Edit button)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend PATCH route allowed list** - `8fb3800` (feat) — committed prior to plan execution
2. **Task 2: Add OVERDUE badge to ProjectCard** - `8d24218` (feat)
3. **Task 3: Add OVERDUE badge and extend interface in ProjectHeader** - `2c2bee7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/api/projects/[id]/route.ts` — payment_due_date, payment_amount, payment_received_at added to PATCH allowed list; IDOR protection (.eq('user_id', user.id)) unchanged
- `components/project/ProjectCard.tsx` — OVERDUE conditional pill span added after riskLevel badge inside chip cluster div
- `components/project/ProjectHeader.tsx` — ProjectHeaderProps interface extended with optional payment fields; isOverdue const added; OVERDUE pill inserted after status span in badge row

## Decisions Made
- Task 1 was already committed (`8fb3800`) before this plan ran. The commit is recorded as Task 1's commit hash; no re-commit was needed.
- `isOverdue` in ProjectCard was already computed (from a partial prior commit) but the badge span was missing — Task 2 added only the badge span.
- ProjectHeader uses `payment_due_date!` non-null assertion after the outer null guard — safe because the `(project.payment_due_date ?? null) !== null` check ensures a truthy string before `new Date()` receives it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Observation] Task 1 and partial Task 2 already committed before plan ran**
- **Found during:** Task 1 verification
- **Issue:** route.ts allowed list and `isOverdue` const in ProjectCard were already committed at `8fb3800` and in the working tree respectively before this plan execution started.
- **Fix:** Verified existing state matched plan requirements exactly; only the missing OVERDUE badge span in ProjectCard needed to be added.
- **Files modified:** No additional files beyond plan scope.
- **Verification:** grep confirmed all required strings present.
- **Committed in:** `8d24218` (Task 2 commit)

---

**Total deviations:** 1 observation (prior partial work already committed)
**Impact on plan:** No scope creep. All three tasks completed to spec.

## Issues Encountered

Pre-existing TypeScript error in `next.config.ts` (Sentry `hideSourceMaps` property) was present before this plan and is unrelated to payment tracking changes. No new TypeScript errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PATCH route accepts all three payment fields — PaymentSection (07-03) can issue PATCH calls immediately
- OVERDUE badges render on both dashboard and detail page — visual overdue state is complete
- Ready for 07-03 (PaymentSection component) and 07-04 (DefenseDashboard pre-fill)

---
*Phase: 07-payment-tracking*
*Completed: 2026-04-24*
