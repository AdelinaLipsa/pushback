---
phase: 12-client-risk
plan: 04
subsystem: app/dashboard
tags: [dashboard, attention-alert, client-risk-spotlight]
requires: [lib/clientRisk.ts]
provides: [Dashboard risk row in Needs Attention, generalized AttentionAlert]
affects: [app/(dashboard)/dashboard/page.tsx]
tech-stack:
  added: []
  patterns: [server-component, attention-row-injection]
key-files:
  created: []
  modified:
    - app/(dashboard)/dashboard/page.tsx
key-decisions:
  - "De-dupe: if the top-risk project is already in attentionItems (e.g., overdue), drop the risk row to avoid showing the same project twice"
  - "Single spotlight only — one row naming the highest-score project, never one row per yellow/red project (D-13)"
  - "borderColorOverride prop on AttentionAlert so client-risk row uses dynamic level color instead of static SEVERITY_BORDER fallback"
  - "ctaLabel override: 'View project →' instead of 'Handle now →' — risk row links to project page, no specific tool hint"
  - "handleTool made nullable to accommodate the risk row (no tool to pre-select for risk overview)"
requirements-completed:
  - PHASE-12
duration: 4 min
completed: 2026-04-26
---

# Phase 12 Plan 04: Dashboard Risk Insight Summary

Surfaces the single highest-risk yellow/red project as one row inside the existing Needs Attention section, computed entirely server-side with no additional DB call.

**Duration:** 4 min | **Tasks:** 2 | **Files:** 1

## What Was Built

**`app/(dashboard)/dashboard/page.tsx`** changes:

1. `AlertSeverity` extended with `'client-risk'`
2. `AttentionItem.handleTool` made nullable (`DefenseTool | null`) — risk row has no tool hint
3. `AttentionItem.ctaLabel` optional field added — risk row uses "View project →"
4. `SEVERITY_BORDER` extended with `'client-risk': CLIENT_RISK_COLORS.red` (static fallback)
5. `AttentionAlert` generalized: `borderColorOverride` prop + dynamic `ctaLabel` + conditional `href`
6. Server-side logic: map all projects through `computeClientRisk`, filter `score > 25`, sort descending, take `scored[0]`, de-dupe against existing `attentionItems`
7. JSX: `{(attentionItems.length > 0 || topRiskItem) && ...}` — section shows if either list has content

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `computeClientRisk(p)` called per project ✓
- Filter `score > 25` present ✓
- Sort `b.risk.score - a.risk.score` ✓
- Single top item (`scored[0]`) ✓
- Description format: `Client Risk: {N} — {label}` ✓
- CTA: `'View project →'` ✓
- severity: `'client-risk'` ✓
- handleTool: `null` ✓
- De-dupe step: `attentionItems.some(a => a.projectId === topRiskItem.projectId)` ✓
- Render condition extended: `attentionItems.length > 0 || topRiskItem` ✓
- `borderColorOverride={topRiskBorder ?? undefined}` ✓
- Only 1 "Needs attention" heading ✓
- No TypeScript errors in dashboard/page.tsx ✓
