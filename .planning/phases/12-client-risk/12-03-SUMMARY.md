---
phase: 12-client-risk
plan: 03
subsystem: components/project
tags: [client-behavior-card, project-detail, lucide-icons]
requires: [lib/clientRisk.ts]
provides: [ClientBehaviorCard component, ProjectDetailClient with risk breakdown]
affects: [components/project/ProjectDetailClient.tsx]
tech-stack:
  added: []
  patterns: [server-component, dynamic-icon-resolution, inline-style]
key-files:
  created:
    - components/project/ClientBehaviorCard.tsx
  modified:
    - components/project/ProjectDetailClient.tsx
key-decisions:
  - "Kept PaymentSection above the divider (existing layout) — only inserted ClientBehaviorCard immediately above DefenseDashboard per D-11; did NOT reorder existing components as UI-SPEC draft suggested"
  - "Lucide icons resolved dynamically via `import * as LucideIcons` + runtime Record lookup — null-safe fallback if icon name invalid"
  - "score > 0 gate per D-10 — zero-activity projects show no card"
  - "fontWeight 600 (not 800) per UI-SPEC checker fix — size 1.5rem carries hierarchy"
requirements-completed:
  - PHASE-12
duration: 4 min
completed: 2026-04-26
---

# Phase 12 Plan 03: ClientBehaviorCard + ProjectDetailClient Summary

Adds the project-detail risk breakdown panel above DefenseDashboard, showing score, level label, and signal list with Lucide icons when score > 0.

**Duration:** 4 min | **Tasks:** 2 | **Files:** 2

## What Was Built

**`components/project/ClientBehaviorCard.tsx`** — Server Component. Props: `{ score, level, signals }`. Renders a card with `var(--bg-surface)` background, `1px solid var(--bg-border)` border, `4px solid ${accent}` left accent, `0.875rem` border-radius. Header row: "Client Risk" label (left) + score in `1.5rem/600` + level label (right). Signal list with Lucide icons via dynamic resolution from `lucide-react` namespace.

**`components/project/ProjectDetailClient.tsx`** — Added `computeClientRisk` import + `ClientBehaviorCard` import. Computes `const clientRisk = computeClientRisk(project)` in component body. Renders `{clientRisk.score > 0 && <ClientBehaviorCard ... />}` between escalation nudge and DefenseDashboard div.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- ClientBehaviorCard file exists ✓
- No `'use client'` ✓
- Dynamic Lucide icon import ✓
- 4px accent left border ✓
- var(--bg-surface) background ✓
- score > 0 gate on render ✓
- Positioned after escalation nudge and before defense-dashboard ✓
- PaymentSection unchanged ✓
- aria-hidden on icons ✓
- fade-up animation class ✓
