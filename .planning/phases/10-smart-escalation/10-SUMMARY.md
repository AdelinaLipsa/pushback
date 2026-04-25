---
phase: 10-smart-escalation
plan: 10
subsystem: ui
tags: [next.js, react, supabase, typescript, dashboard, alerts, escalation]

# Dependency graph
requires:
  - phase: 07-payment-tracking
    provides: initialPaymentPrefill pattern; PaymentSection; payment_due_date/payment_received_at fields
  - phase: 09-contract-analysis
    provides: contractClausesUsed prop extension pattern on ResponseOutput; hasContract/contractRiskLevel props
provides:
  - NextStepCard component with 20-tool next-step guidance strings
  - toolType prop on ResponseOutput rendering NextStepCard below action buttons
  - autoSelectTool prop on DefenseDashboard for URL-driven and nudge-driven tool auto-selection
  - Dashboard "Needs Attention" section with overdue/due-soon/ghost/stalled alert rows
  - defense_responses(was_sent) join on dashboard query for ghost/stalled detection
  - defense_responses join on project page query for escalation nudge
  - Escalation nudge in ProjectDetailClient for stalled payment chains
  - /projects/[id]?tool=<DefenseTool> deep-link routing validated server-side
affects: [11-document-generation, any phase reading defense_responses or project detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - autoSelectTool useEffect in DefenseDashboard mirrors initialPaymentPrefill pattern (Phase 07)
    - toolType prop extension on ResponseOutput mirrors contractClausesUsed pattern (Phase 09)
    - Server-side URL search param validation against known DefenseTool values
    - Attention item computation as pure derived state from extended Supabase join (no new API routes)

key-files:
  created:
    - components/defense/NextStepCard.tsx
  modified:
    - components/defense/ResponseOutput.tsx
    - components/defense/DefenseDashboard.tsx
    - app/(dashboard)/dashboard/page.tsx
    - app/(dashboard)/projects/[id]/page.tsx
    - components/project/ProjectDetailClient.tsx

key-decisions:
  - "NextStepCard is text-only, no dismiss button — stays visible until Regenerate clears response (D-12/D-13)"
  - "Attention items computed server-side in dashboard/page.tsx as pure derived state — no new API routes (D-04)"
  - "Ghost client staleness uses 5 business days (Mon-Fri); stalled payment uses 7 calendar days (D-02)"
  - "Handle now links are <Link> not buttons, consistent with plan spec (D-05)"
  - "AttentionAlert co-located in dashboard/page.tsx since only used there (Claude discretion from CONTEXT.md)"
  - "autoSelectTool prop initializes nudgeAutoSelect state — decouples URL-param-driven from nudge-button-driven selection"

patterns-established:
  - "autoSelectTool useEffect: find matching DefenseToolMeta, call setSelectedTool + setResponse(null)"
  - "Attention item detection: filter/sort defense_responses array in a pure function, no DB calls beyond existing join"
  - "URL tool validation: DEFENSE_TOOLS.map(t => t.type).includes(tool as DefenseTool) before casting"

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-04-25
---

# Phase 10: Smart Escalation Summary

**Proactive alert dashboard with overdue/ghost/stalled detection, tool-type-aware "what to do next" cards after every generated response, and URL-driven + nudge-driven tool auto-selection for payment escalation chains**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-25T15:10:00Z
- **Completed:** 2026-04-25T15:35:00Z
- **Tasks:** 6
- **Files modified:** 6

## Accomplishments

- `NextStepCard` renders tool-type-specific next-step guidance below every generated defense message (all 20 tools)
- Dashboard "Needs Attention" section surfaces overdue payments, due-soon payments, ghost clients, and stalled projects — server-computed, no new API routes, shown only when items exist
- Escalation nudge in project detail auto-selects the next payment tool (payment_first → second → final) when a reminder was sent >7 days ago with no payment received
- `?tool=<DefenseTool>` URL param auto-selects a defense tool on project page load, enabling "Handle now →" deep-links from the dashboard

## Task Commits

1. **Task 1+2: NextStepCard + ResponseOutput toolType prop** - `5522797` (feat)
2. **Task 3: DefenseDashboard autoSelectTool + pass toolType to ResponseOutput** - `cd4b1ef` (feat)
3. **Task 4: Dashboard Needs Attention section** - `9d2dd61` (feat)
4. **Task 5: Project page query extension + autoSelectTool from URL** - `f6a9ac8` (feat)
5. **Task 6: ProjectDetailClient escalation nudge** - `2b2975d` (feat)

## Files Created/Modified

- `components/defense/NextStepCard.tsx` - New component; 20-tool next-step string map, dark surface card, text-only
- `components/defense/ResponseOutput.tsx` - Added `toolType: DefenseTool` prop; renders `<NextStepCard toolType={toolType} />` below action buttons
- `components/defense/DefenseDashboard.tsx` - Added `autoSelectTool?: DefenseTool` prop with useEffect; passes `selectedTool.type` as `toolType` to ResponseOutput
- `app/(dashboard)/dashboard/page.tsx` - Extended defense_responses join to include `was_sent`; added `computeAttentionItems` pure function; added `AttentionAlert` component; added "Needs attention" section above projects list
- `app/(dashboard)/projects/[id]/page.tsx` - Extended select to include `defense_responses(id, tool_type, created_at, was_sent)`; reads and validates `searchParams.tool`; passes `autoSelectTool` to `ProjectDetailClient`
- `components/project/ProjectDetailClient.tsx` - Added `autoSelectTool` prop and `nudgeAutoSelect` state; computes escalation nudge from `defense_responses`; renders amber-bordered nudge banner; passes `nudgeAutoSelect` to `DefenseDashboard`

## Decisions Made

- `AttentionAlert` co-located in `dashboard/page.tsx` (not a shared component) since it is only used there — matches CONTEXT.md Claude's discretion note
- `nudgeAutoSelect` state initialized from `autoSelectTool` prop so both URL-driven (page load) and button-driven (nudge click) selection flow through the same state variable
- Ghost detection uses `businessDaysBetween` (Mon-Fri only) per D-02; stalled payment detection uses calendar days per D-02
- Stalled alert skipped if project already appears as overdue to avoid duplicate rows per project

## Deviations from Plan

None — plan executed exactly as written. All decisions followed CONTEXT.md locked decisions (D-01 through D-14).

## Issues Encountered

- `NextStepCard.tsx` already existed in the worktree from a prior partial execution (commit `3e60bc2`). The file matched the plan spec, so it was used as-is. `ResponseOutput.tsx` still needed the `toolType` prop wired in.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 11 (Document Generation) can proceed — all project data including `defense_responses` is now available in project detail props
- The `autoSelectTool` pattern is established and available for any future phase that needs URL-driven tool pre-selection
- No blockers

---
*Phase: 10-smart-escalation*
*Completed: 2026-04-25*
