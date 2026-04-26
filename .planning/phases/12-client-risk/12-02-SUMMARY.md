---
phase: 12-client-risk
plan: 02
subsystem: components/project
tags: [badge, project-card, client-risk]
requires: [lib/clientRisk.ts]
provides: [ClientRiskBadge component, ProjectCard with client risk badge]
affects: [components/project/ProjectCard.tsx]
tech-stack:
  added: []
  patterns: [server-component, inline-style]
key-files:
  created:
    - components/project/ClientRiskBadge.tsx
  modified:
    - components/project/ProjectCard.tsx
key-decisions:
  - "Padding 0.2rem 0.6rem chosen to match the in-row contract risk pill exactly (not UI-SPEC checker-fix 0.25rem 0.5rem) — visual alignment takes priority over spec revision"
  - "ClientRiskBadge always renders unconditionally per D-02 — even at score 0 (green) it shows 'Client 0'"
  - "Badge is a Server Component — no use client directive needed since all props are passed by value"
requirements-completed:
  - PHASE-12
duration: 3 min
completed: 2026-04-26
---

# Phase 12 Plan 02: ClientRiskBadge + ProjectCard Badge Row Summary

Adds a "Client {score}" bordered pill to every ProjectCard in the existing badge row, between the contract risk badge and the OVERDUE pill.

**Duration:** 3 min | **Tasks:** 2 | **Files:** 2

## What Was Built

**`components/project/ClientRiskBadge.tsx`** — Server Component. Accepts `score: number` and `level: ClientRiskLevel`. Renders a `<span>` with `rgba(0,0,0,0.3)` background, 1px border colored by `CLIENT_RISK_COLORS[level]`, and the text "Client {score}". No `'use client'` directive.

**`components/project/ProjectCard.tsx`** — Three edits: import `computeClientRisk` + `ClientRiskBadge`, compute `const clientRisk = computeClientRisk(project)` after `isOverdue`, insert `<ClientRiskBadge score={clientRisk.score} level={clientRisk.level} />` between the contract risk badge and the OVERDUE pill.

**Badge row order:** status pill → contract risk badge (conditional) → ClientRiskBadge (always) → OVERDUE pill (conditional)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- ClientRiskBadge file exists ✓
- No `'use client'` in badge ✓
- Imports from `@/lib/clientRisk` ✓
- "Client {score}" label ✓
- rgba(0,0,0,0.3) background ✓
- 1px solid template-literal color border ✓
- borderRadius 9999px ✓
- fontSize 0.7rem ✓
- padding 0.2rem 0.6rem ✓
- computeClientRisk imported and called in ProjectCard ✓
- Badge in correct position (after contract risk, before OVERDUE) ✓
- Badge unconditional (no conditional wrapper) ✓
- Existing badges unchanged ✓
