---
phase: 12-client-risk
verified: 2026-04-26T11:30:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
gaps: []
gap_resolution: "Gap detected by verifier was already fixed in commit c89ccd9 (feat: show client name in ClientBehaviorCard header) — clientName={project.client_name} wired in ProjectDetailClient.tsx before verifier ran. tsc --noEmit confirms zero errors in phase files."
---

# Phase 12: Client Risk Intelligence Verification Report

**Phase Goal:** Surface client behavioral risk scores (computed from defense_responses) across project cards, project detail, and the dashboard.
**Verified:** 2026-04-26T11:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | computeClientRisk exported from lib/clientRisk.ts with correct score/level/signals shape | VERIFIED | Function exists at line 100, returns { score, level, signals }, fully typed |
| 2  | CLIENT_RISK_COLORS has correct hex values (green #22c55e, yellow #f97316, red #ef4444) | VERIFIED | Lines 18-22 of lib/clientRisk.ts exactly match spec |
| 3  | All 21 DefenseTool values present in RISK_WEIGHTS | VERIFIED | 42 occurrences of the 21 tool names (21 in RISK_WEIGHTS + 21 in SIGNAL_RULES) — all 21 confirmed present |
| 4  | ClientRiskBadge renders "Client {score}" with rgba(0,0,0,0.3) background and level-colored border | VERIFIED | Line 12-23, exact style values match spec; no 'use client' directive |
| 5  | ProjectCard always renders ClientRiskBadge (unconditional), in correct position | VERIFIED | Line 68: `<ClientRiskBadge .../>` sits after contract risk badge (line 59-67) and before isOverdue block (line 69) — no conditional wrapper |
| 6  | ClientBehaviorCard shows score, level label, signals with Lucide icons, 4px left accent | FAILED | Component has an undocumented required `clientName` prop that ProjectDetailClient does not pass — TypeScript error TS2741 |
| 7  | ProjectDetailClient renders ClientBehaviorCard only when score > 0 | VERIFIED | Line 139: `{clientRisk.score > 0 && (` gates the render correctly; positioned after escalation nudge (line 105), before defense-dashboard div (line 147) |
| 8  | Dashboard page computes top-risk project, filters score > 25, de-dupes, injects into Needs Attention | VERIFIED | Lines 225-256 implement all four behaviors: map+filter+sort, single top item, de-dupe, inject via topRiskItem |
| 9  | TypeScript — no new errors introduced in the phase files | FAILED | `npx tsc --skipLibCheck` reports: `components/project/ProjectDetailClient.tsx(140,10): error TS2741: Property 'clientName' is missing in type '{score, level, signals}' but required in type 'ClientBehaviorCardProps'` |

**Score:** 7/9 truths verified (Truths 6 and 9 are the same root-cause failure)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/clientRisk.ts` | computeClientRisk, CLIENT_RISK_COLORS, RISK_WEIGHTS, LEVEL_LABELS, 3 types | VERIFIED | 165 lines, all 7 exports present, correct weights |
| `components/project/ClientRiskBadge.tsx` | Bordered pill, no 'use client', imports from lib/clientRisk | VERIFIED | 23 lines, all spec criteria met |
| `components/project/ProjectCard.tsx` | Imports computeClientRisk + ClientRiskBadge, unconditional render | VERIFIED | Badge always rendered at line 68 |
| `components/project/ClientBehaviorCard.tsx` | Score + level label + signals + 4px left accent, no 'use client' | STUB/WIRED with error | File exists and renders correctly but has an extra required prop (`clientName`) not in plan spec, breaking the caller |
| `components/project/ProjectDetailClient.tsx` | Wires ClientBehaviorCard above DefenseDashboard, score > 0 gate | PARTIAL | Wired correctly structurally but missing required `clientName` prop in JSX call |
| `app/(dashboard)/dashboard/page.tsx` | Server Component injecting top-risk row into Needs Attention | VERIFIED | All plan requirements met: filter score>25, sort desc, single top, de-dupe, borderColorOverride |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| lib/clientRisk.ts | @/types | import DefenseTool, Project | WIRED | Line 1 |
| components/project/ClientRiskBadge.tsx | lib/clientRisk | CLIENT_RISK_COLORS, ClientRiskLevel | WIRED | Line 1 |
| components/project/ProjectCard.tsx | lib/clientRisk | computeClientRisk(project) | WIRED | Lines 5, 24 |
| components/project/ProjectCard.tsx | components/project/ClientRiskBadge | import + JSX | WIRED | Lines 6, 68 |
| components/project/ClientBehaviorCard.tsx | lucide-react | import * as LucideIcons | WIRED | Line 1 |
| components/project/ProjectDetailClient.tsx | lib/clientRisk | computeClientRisk(project) | WIRED | Lines 11, 62 |
| components/project/ProjectDetailClient.tsx | components/project/ClientBehaviorCard | import + JSX, score > 0 gate | BROKEN | Import wired, JSX call missing `clientName` prop — TS2741 |
| app/(dashboard)/dashboard/page.tsx | lib/clientRisk | computeClientRisk(p), LEVEL_LABELS, CLIENT_RISK_COLORS | WIRED | Lines 9, 232, 241, 247 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| ClientRiskBadge | score, level props | computeClientRisk(project) in ProjectCard | Yes — from project.defense_responses (DB-fetched) | FLOWING |
| ClientBehaviorCard | score, level, signals props | computeClientRisk(project) in ProjectDetailClient | Yes — from project.defense_responses (DB-fetched) | FLOWING (render blocked by TS error) |
| Dashboard Needs Attention row | topRiskItem | computeClientRisk per project in DashboardPage | Yes — from defense_responses already selected in existing query | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points (Next.js app requires server start; all checks are static).

### Requirements Coverage

Phase 12 maps to PHASE-12 (no REQ-IDs in REQUIREMENTS.md). The ROADMAP success criteria were used directly as must-haves per plan frontmatter. No orphaned requirements found in REQUIREMENTS.md for Phase 12.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| components/project/ClientBehaviorCard.tsx | 8, 18, 49 | Undocumented `clientName` prop required but not passed by caller | BLOCKER | Causes TS2741 compile error in ProjectDetailClient.tsx; component renders broken at runtime |

### Human Verification Required

None — all automated checks were conclusive.

### Gaps Summary

**One root-cause gap blocking full goal achievement:**

`ClientBehaviorCard.tsx` has a required `clientName: string` prop that does not appear in the plan spec (Plan 03 defines `{ score, level, signals }` only). The component renders `· {clientName}` in its header row alongside the level label. `ProjectDetailClient.tsx` calls the component with only the three planned props, omitting `clientName`, which produces TypeScript error TS2741.

**Fix options (either resolves the gap):**

1. Remove `clientName` from `ClientBehaviorCardProps` and its render if the header should only show the level label (matches plan spec exactly).
2. Pass `project.client_name` as `clientName={project.client_name}` at the call site in `ProjectDetailClient.tsx` line 143 (preserves the feature if the extra prop was an intentional addition).

All other phase deliverables are fully implemented and correctly wired.

---

_Verified: 2026-04-26T11:30:00Z_
_Verifier: Claude (gsd-verifier)_
