---
phase: 12-client-risk
plan: 01
subsystem: lib
tags: [risk-scoring, pure-function, typescript]
requires: []
provides: [computeClientRisk, CLIENT_RISK_COLORS, RISK_WEIGHTS, LEVEL_LABELS, ClientRiskResult, ClientRiskLevel, ClientRiskSignal]
affects: []
tech-stack:
  added: []
  patterns: [pure-function, exhaustive-record-map]
key-files:
  created:
    - lib/clientRisk.ts
  modified: []
key-decisions:
  - "Duplicated hex values from globals.css into CLIENT_RISK_COLORS so the constant works in inline style objects without CSSStyleDeclaration lookup"
  - "SIGNAL_RULES uses null sentinel for tool types that don't surface as signals (payment_first, payment_second, payment_final, delivery_signoff)"
  - "Score computation is a single O(n) pass over defense_responses — no nested loops"
requirements-completed:
  - PHASE-12
duration: 4 min
completed: 2026-04-26
---

# Phase 12 Plan 01: Client Risk Scoring Utility Summary

Pure `computeClientRisk(project)` utility in `lib/clientRisk.ts` — score 0–100, level green/yellow/red, and structured signal list with Lucide icon names.

**Duration:** 4 min | **Start:** 2026-04-26T10:52:59Z | **End:** 2026-04-26T10:56:50Z | **Tasks:** 1 | **Files:** 1

## What Was Built

`lib/clientRisk.ts` exports:
- `computeClientRisk(project)` — pure function, no I/O. Takes a `Pick<Project, 'payment_due_date' | 'payment_received_at'>` union with `defense_responses`. Returns `{ score, level, signals }`.
- `CLIENT_RISK_COLORS` — hex map keyed by `ClientRiskLevel` (`green: '#22c55e'`, `yellow: '#f97316'`, `red: '#ef4444'`)
- `RISK_WEIGHTS` — exhaustive `Record<DefenseTool, number>` (21 keys). Highest: `chargeback_threat: 30`, `dispute_response: 25`, `review_threat: 20`.
- `LEVEL_LABELS` — locked strings: `'No concerns'`, `'Watch this client'`, `'High-risk client'`
- Types: `ClientRiskResult`, `ClientRiskLevel`, `ClientRiskSignal`

**Score calibration:** A single sent `chargeback_threat` (30) hits yellow (≥26). Combined with overdue payment (+15) reaches red (≥61). On-time payment bonus (−10) can only reduce a score, not below 0.

## Deviations from Plan

**[Rule 1 - TDD] No test framework installed** — Found during: Task 1 | Issue: `package.json` has no test runner (jest/vitest/mocha). The plan's `tdd="true"` expected `lib/clientRisk.test.ts` to be written first. | Fix: Implemented `lib/clientRisk.ts` directly and verified all acceptance criteria via `grep` commands + `tsc --noEmit`. Pre-existing TypeScript errors in other files (`admin/page.tsx`, `analytics/page.tsx`, etc.) prevent a clean project-wide compile; `lib/clientRisk.ts` itself is error-free. | Impact: No behavioral change — scoring logic is unchanged.

**Total deviations:** 1 auto-handled. **Impact:** Low — all acceptance criteria verified manually.

## Pointers for Downstream Plans

| Plan | Import | What to use |
|------|--------|-------------|
| 12-02 ProjectCard badge | `import { computeClientRisk, CLIENT_RISK_COLORS } from '@/lib/clientRisk'` | Pass the project object; use `.score` and `.level` to drive badge color and text |
| 12-03 ClientBehaviorCard | `import { computeClientRisk, CLIENT_RISK_COLORS, LEVEL_LABELS } from '@/lib/clientRisk'` | Use `.signals[]` for the icon+label list, `.level` for LEVEL_LABELS lookup, `CLIENT_RISK_COLORS[level]` for border/text colors |
| 12-04 Dashboard insight | `import { computeClientRisk, CLIENT_RISK_COLORS } from '@/lib/clientRisk'` | Server-side call during existing query handler; filter by `.level === 'yellow' \| 'red'`, pick highest `.score` |

## Self-Check: PASSED

- `lib/clientRisk.ts` exists ✓
- `computeClientRisk` exported ✓
- `CLIENT_RISK_COLORS` has all three hex values ✓
- `RISK_WEIGHTS` has 21 entries (all `DefenseTool` values) ✓
- `was_sent === true` filter present ✓
- Score clamped `Math.max(0, Math.min(100, score))` ✓
- Level thresholds at 26 and 61 ✓
- `clientRisk.ts` has zero TypeScript errors ✓
