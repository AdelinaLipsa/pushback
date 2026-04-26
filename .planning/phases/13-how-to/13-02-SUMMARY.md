---
phase: 13-how-to
plan: 02
subsystem: ui
tags: [next.js, server-component, marketing-page, defense-tools]

# Dependency graph
requires:
  - phase: 12-client-risk
    provides: CSS vars and inline-style patterns used throughout
  - phase: 03-legal-email
    provides: public page pattern (app/privacy, app/terms) — no auth, root layout only
provides:
  - Public /how-it-works page (Server Component) with marketing layout
  - Full defense tool directory listing all 21 tools grouped by scenario
  - Contract analysis explainer and FAQ for new-user onboarding
affects:
  - 13-03 (onboarding hints — references /how-it-works URL)
  - Footer and Navbar links to /how-it-works

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Public marketing page outside (dashboard) route group — no auth, root layout only
    - TOOL_GROUPS static constant mapping tool types to named scenario groups
    - DEFENSE_TOOLS.find(t => t.type === type) for dynamic label/description lookup

key-files:
  created:
    - app/how-it-works/page.tsx
  modified: []

key-decisions:
  - "D-05: File at app/how-it-works/page.tsx — outside (dashboard) route group, no auth required"
  - "D-06: Marketing layout (minimal logo header + Footer) matching privacy/terms pages, not dashboard Navbar/sidebar"
  - "D-08: 4 static TOOL_GROUPS covering all 21 defense tools: Payment Issues, Scope & Delivery, Client Behavior, Pricing & Rates"
  - "D-09: Each tool entry shows bold tool.label + tool.description — pulled from DEFENSE_TOOLS at runtime, never hardcoded"
  - "D-10: DEFENSE_TOOLS import is the single source of truth for all tool labels and descriptions"

patterns-established:
  - "Public Server Component page: no 'use client', file outside (dashboard), root layout provides fonts + Toaster"
  - "Tool directory pattern: TOOL_GROUPS constant + DEFENSE_TOOLS.find(t => t.type === type) per item"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-04-26
---

# Phase 13 Plan 02: How It Works Page Summary

**Public /how-it-works Server Component page with marketing layout, all 21 DEFENSE_TOOLS grouped by scenario, contract analysis explainer, and 6-question FAQ**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-26T14:02:37Z
- **Completed:** 2026-04-26T14:14:00Z
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments
- Created `app/how-it-works/page.tsx` outside the `(dashboard)` route group — public, no auth required
- Page is a Server Component (no `'use client'`) using marketing layout (minimal logo header, centered content, Footer)
- Renders 3 use-mode cards (paste/pick/attach), full tool directory with 21 tools in 4 named groups, contract analysis explainer, and 6 FAQ items
- All tool labels and descriptions sourced dynamically from `DEFENSE_TOOLS` via `find(t => t.type === type)` — no hardcoded copy
- TypeScript clean; no `dangerouslySetInnerHTML`; no `useSearchParams`; no `var(--brand-amber)`; no emoji

## Task Commits

Each task was committed atomically:

1. **Task 1: Create public /how-it-works page with marketing shell and 3 use modes** - `54368cc` (feat)
2. **Task 2: Add tool directory, contract analysis, and FAQ sections** - `38a66b6` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `app/how-it-works/page.tsx` - Public Server Component page at /how-it-works; imports DEFENSE_TOOLS + Footer + Link; TOOL_GROUPS constant; renders 3 use modes, full tool directory by scenario group, contract analysis explainer, FAQ

## Decisions Made
- File located at `app/how-it-works/page.tsx` (not inside `app/(dashboard)/`) per D-05 — unauthenticated visitors can access it
- Marketing layout used: minimal centered logo header + Footer; no dashboard Navbar/sidebar (D-06)
- TOOL_GROUPS static constant defined at module scope in UPPER_SNAKE_CASE with all 4 groups and all 21 tool types (D-08/D-10)
- Group headings match plan exactly: "Payment Issues", "Scope & Delivery", "Client Behavior", "Pricing & Rates"
- FAQ covers: free plan limits (3 responses), data privacy (Anthropic as processor), data deletion, wrong situation recovery, legal disclaimer, Pro cancellation

## Notable: Tool Labels from DEFENSE_TOOLS
Labels from `lib/defenseTools.ts` used at runtime (not hardcoded):
- payment_first → "Payment Reminder"
- payment_second → "Payment Follow-Up"
- payment_final → "Final Payment Notice"
- retroactive_discount → "Post-Delivery Discount Demand"
- disputed_hours → "Disputed Hours"
- scope_change → "Scope Change"
- revision_limit → "Revision Limit"
- moving_goalposts → "Approved Then Rejected"
- post_handoff_request → "Post-Handoff Request"
- delivery_signoff → "Delivery Sign-Off"
- ghost_client → "Ghost Client"
- feedback_stall → "Feedback Delay"
- chargeback_threat → "Chargeback Threat"
- review_threat → "Review Threat"
- dispute_response → "Dispute Response"
- spec_work_pressure → "Exposure / Spec Work"
- discount_pressure → "Rate Negotiation"
- rate_increase_pushback → "Rate Increase Pushback"
- rush_fee_demand → "Rush Without Rush Fee"
- kill_fee → "Kill Fee"
- ip_dispute → "IP / Source File Dispute"

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all content is fully rendered from `DEFENSE_TOOLS` and static copy. No placeholder text.

## Threat Flags

None — page is read-only Server Component with no user input, no URL params, no `dangerouslySetInnerHTML`. Threat model verified clean per T-13.02-02 and T-13.02-06 checks.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `/how-it-works` page is live and publicly accessible (no auth gate)
- Phase 13 Plan 03 (onboarding hints) can safely link to `/how-it-works` from the dashboard empty-state hint
- Footer and Navbar links to `/how-it-works` (per D-07) can be added in Plan 03 or a separate plan

---
*Phase: 13-how-to*
*Completed: 2026-04-26*
