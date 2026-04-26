---
phase: 13-how-to
plan: 03
subsystem: ui
tags: [react, nextjs, navigation, onboarding, tooltip]

# Dependency graph
requires:
  - phase: 13-02
    provides: Public /how-it-works page at app/how-it-works/page.tsx that all five navigation surfaces link to
provides:
  - Footer PRODUCT_LINKS href updated from /#how-it-works to /how-it-works
  - Navbar Account section gains HelpCircle Help link to /how-it-works
  - DefenseDashboard empty-state analyze panel shows "Not sure which tool? See the tool guide →" hint gated by !analysisResult
  - ProjectDetailClient renders onboarding hint ("New to Pushback? ...") gated by responses.length === 0
  - DefenseToolCard exposes tool.description on hover via native HTML title attribute (SC-2 satisfied)
affects: [13-how-to, any phase adding new onboarding surfaces or tooltip patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auto-hide-only hints: pure conditional renders gated on client state — no localStorage, no DB flag, no dismiss button"
    - "Native HTML title attribute for hover tooltips — zero UI complexity, no custom Tooltip component"
    - "Link from next/link added to DefenseDashboard for internal navigation inside a 'use client' component"

key-files:
  created: []
  modified:
    - components/shared/Footer.tsx
    - components/shared/Navbar.tsx
    - components/defense/DefenseDashboard.tsx
    - components/project/ProjectDetailClient.tsx
    - components/defense/DefenseToolCard.tsx

key-decisions:
  - "D-07 satisfied: Footer PRODUCT_LINKS replaces /#how-it-works anchor with /how-it-works page link; Navbar Account section adds HelpCircle Help entry after Settings — desktop only, mobile bottom bar unchanged"
  - "D-11/D-12/D-13 satisfied: DefenseDashboard hint gated by showAnalyzePanel (outer) AND !analysisResult (inner) — disappears as soon as analysis result shows; ProjectDetailClient hint gated by responses.length === 0 — auto-hides on first response"
  - "SC-2 satisfied via native HTML title attribute on DefenseToolCard button root — browser renders delayed-hover tooltip with tool.description; no custom Tooltip component, no new state, no new imports"
  - "DefenseDashboard required adding Link import from next/link (was absent — only useRouter from next/navigation was imported)"

patterns-established:
  - "Auto-hide hint pattern: {condition && (<p>...</p>)} with no dismiss state and no localStorage"
  - "Native title attribute tooltip: title={data.field} on button root for zero-complexity SC-2 compliance"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-04-26
---

# Phase 13 Plan 03: Navigation Wiring & Onboarding Hints Summary

**Five surgical edits wire /how-it-works into Footer, Navbar, DefenseDashboard empty-state, ProjectDetailClient new-project hint, and DefenseToolCard native hover tooltip — satisfying D-07, D-11, D-12, D-13, and SC-2 with zero new state, zero new dependencies**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-26T14:02:00Z
- **Completed:** 2026-04-26T14:10:41Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Footer "How it works" link updated from `/#how-it-works` anchor to `/how-it-works` page route
- Navbar Account section gains "Help" entry with HelpCircle icon pointing to `/how-it-works` (desktop sidebar only)
- DefenseDashboard analyze panel shows "Not sure which tool? See the tool guide →" when empty-state and no analysis result yet — auto-hides when user gets an analysis
- ProjectDetailClient renders "New to Pushback? Paste a message from your client above..." hint for projects with zero defense responses — auto-hides once first response created
- DefenseToolCard button root gains `title={tool.description}` — native browser hover tooltip satisfies SC-2 inline tooltip requirement with zero UI complexity

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Footer anchor hash with /how-it-works and add Navbar Help entry** - `6c3ce5c` (feat)
2. **Task 2: Add empty-state guide hint to DefenseDashboard analyze panel** - `b56ca32` (feat)
3. **Task 3: Add onboarding hint to ProjectDetailClient for new projects** - `fef2c98` (feat)
4. **Task 4: Add native hover tooltip to DefenseToolCard via title={tool.description}** - `56c4089` (feat)

## Files Created/Modified
- `components/shared/Footer.tsx` — PRODUCT_LINKS href `/how-it-works` (was `/#how-it-works`)
- `components/shared/Navbar.tsx` — HelpCircle imported, Help entry added to Account section items
- `components/defense/DefenseDashboard.tsx` — Link import added; hint paragraph after divider inside showAnalyzePanel block gated by `!analysisResult`
- `components/project/ProjectDetailClient.tsx` — Onboarding hint between ProjectHeader and contract strip, gated by `responses.length === 0`, fade-up class, `#3f3f46` literal color
- `components/defense/DefenseToolCard.tsx` — `title={tool.description}` on `<button>` root between onClick and style props

## Decisions Made
- DefenseDashboard hint uses double gate: outer `showAnalyzePanel` (which is `!selectedTool && !response`) plus inner `!analysisResult` — required per D-13 / Pitfall 6 because `showAnalyzePanel` alone stays true while analysis result is displayed
- ProjectDetailClient hint uses `responses.length === 0` literal (not `!responses.length`) per spec character-for-character requirement
- ProjectDetailClient hint uses hardcoded `#3f3f46` instead of `var(--text-muted)` — extra-subdued tone distinct from regular muted text as specified
- DefenseToolCard `title` attribute placed between `onClick` and `style` props per plan ordering requirement — enables hovering anywhere on card to surface tooltip
- No emoji introduced anywhere; no external URLs added to any component

## Deviations from Plan

None — plan executed exactly as written. All five surfaces were modified per spec. Task 1 changes (Footer + Navbar) were pre-applied by a prior agent; committed as part of this plan's execution.

## Issues Encountered
None — all files compiled clean (zero tsc errors for modified files). No missing imports, no type errors, no breaking changes.

## User Setup Required
None — no external service configuration required. All changes are pure UI modifications with no env vars, DB migrations, or third-party service configuration.

## Next Phase Readiness
- All five navigation/onboarding surfaces wired to /how-it-works
- Phase 13 (how-to) is now fully complete: plan 01 (DemoAnimation), plan 02 (/how-it-works page), plan 03 (nav wiring + hints) — all executed
- SC-2 inline tooltip requirement satisfied via native title attribute on DefenseToolCard
- No blockers for milestone close or next phase

---
*Phase: 13-how-to*
*Completed: 2026-04-26*
