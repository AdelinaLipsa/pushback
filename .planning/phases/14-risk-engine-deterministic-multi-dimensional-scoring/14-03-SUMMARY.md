---
phase: 14-risk-engine-deterministic-multi-dimensional-scoring
plan: 03
subsystem: risk-engine-ui
tags: [ui, dashboard, risk, phase-14]
requires:
  - 14-01 (lib/risk/{types,weights,payment,scope,chargeback}.ts)
  - 14-02 (lib/risk/{actions,mitigations,index.ts} — computeRisk + RISK_LEVEL_COLORS)
provides:
  - "Phase 12 UI surfaces consume the new RiskResult shape without client-side recomputation (D-23)"
  - "Dashboard top-3 client risk panel above 'Needs attention' (D-21 #3, success criteria 3)"
  - "Per-signal evidence table on the project detail page (D-23, success criteria 4)"
  - "topMitigation callout when red/amber and non-null (D-20, success criteria 5)"
affects:
  - components/project/ClientRiskBadge.tsx
  - components/project/ClientBehaviorCard.tsx
  - components/project/ProjectCard.tsx
  - components/project/ProjectDetailClient.tsx
  - app/(dashboard)/dashboard/page.tsx
tech-stack:
  added: []
  patterns:
    - "Server components import `computeRisk` from `@/lib/risk`; no client-side score math"
    - "Per-signal evidence table renders `risk.dimensions[*].signals` directly — no recomputation"
    - "Top-3 dashboard panel pins `today` once per request → deterministic ordering across panel entries (T-14-11)"
key-files:
  created: []
  modified:
    - components/project/ClientRiskBadge.tsx
    - components/project/ClientBehaviorCard.tsx
    - components/project/ProjectCard.tsx
    - components/project/ProjectDetailClient.tsx
    - app/(dashboard)/dashboard/page.tsx
decisions:
  - "ClientBehaviorCard prop shape changed from `(score, level, signals)` → `(risk: RiskResult)` — every dimension + every signal flows straight from the engine"
  - "ClientRiskBadge keeps the Phase 12 D-04 pill geometry verbatim; only the level-color hex source switches from CLIENT_RISK_COLORS to RISK_LEVEL_COLORS (yellow→amber rename absorbed)"
  - "Dashboard top-3 panel filter is `composite >= LEVEL_THRESHOLDS.amber` (26) — green clients never appear in the panel, matching D-21 #3 intent"
  - "ProjectCard now suppresses the 'Client 0' badge in the no-contract path by gating on `risk.composite > 0` (avoids a misleading green pill on brand-new projects)"
  - "Per-signal evidence table always renders all three dimension groups, with 'No signals' placeholder rows so the user can audit that we checked every dimension (D-23 auditability)"
metrics:
  duration: <30 min
  completed_date: 2026-05-16
---

# Phase 14 Plan 03: UI Rewire to RiskResult Summary

One-liner: Rewired ProjectCard, ProjectDetailClient, ClientRiskBadge, and ClientBehaviorCard to consume the deterministic Phase 14 `computeRisk` engine, and added a dashboard "Top client risk" panel (top 3 by composite) that replaces the Phase 12 single-row injection.

## What changed

### `components/project/ClientRiskBadge.tsx`
Drop-in swap from Phase 12's `CLIENT_RISK_COLORS` / `ClientRiskLevel` to Phase 14's `RISK_LEVEL_COLORS` / `RiskLevel`. The pill geometry, font sizes, label format ("Client {score}"), and translucent background are unchanged per the D-04 visual lock. The `yellow → amber` key rename happens at the import boundary.

### `components/project/ClientBehaviorCard.tsx`
Substantial expansion. New prop shape `{ risk: RiskResult; clientName }`. Renders, top-to-bottom:
1. Header row (Phase 12 carryover) — "Client Risk · {clientName}" plus the composite number + level label ("Healthy" / "Watch closely" / "Act now")
2. Composite bar — full-width 8px track, fill = composite%, fill color = level color
3. Three dimension bars — 90px label column · flexible 6px track · 32px numeric column. Each bar's fill color is the level the *individual* dimension score maps to via `levelFromScore`, so an amber dimension inside a red composite still renders amber
4. `risk.nextAction` — text only, no link (D-22)
5. `topMitigation` callout — lime left border, "Biggest lever: {action}" + "~{deltaPoints} points" subline. Renders only when `risk.topMitigation !== null` AND `risk.level !== 'green'`
6. Per-signal evidence table (D-23 — success criteria 4) — three columns Signal | Source | Points, grouped by dimension with sub-header rows. Renders `signals[].points` verbatim (no client-side recomputation). Empty dimensions render a "No signals" placeholder row for audit consistency

No `'use client'` directive — server-renderable.

### `components/project/ProjectCard.tsx`
Switched `computeClientRisk` → `computeRisk`. Both `<ClientRiskBadge />` call sites now pass `score={risk.composite}` and `level={risk.level}`. The no-contract path now gates badge render on `risk.composite > 0` to avoid emitting a "Client 0" pill on brand-new projects.

### `components/project/ProjectDetailClient.tsx`
Switched `computeClientRisk` → `computeRisk`. Replaced the `<ClientBehaviorCard score level signals clientName />` call with `<ClientBehaviorCard risk={risk} clientName={...} />`. The `> 0` guard stays — `risk.composite > 0`.

### `app/(dashboard)/dashboard/page.tsx`
- Imports switched: removed `computeClientRisk, LEVEL_LABELS, CLIENT_RISK_COLORS`; added `computeRisk, RISK_LEVEL_COLORS, LEVEL_THRESHOLDS, type RiskResult`, plus the `ClientRiskBadge` component
- `AlertSeverity` no longer includes `'client-risk'`; `AttentionAlert` no longer accepts `borderColorOverride`
- Deleted the old single-row injection block (`topRiskItem` / `topRiskBorder` / `scored` / the dedupe block / the conditional render inside Needs Attention)
- Added a new **Top client risk** section above "Needs attention". Computes `ranked` once, filters to `composite >= LEVEL_THRESHOLDS.amber`, sorts descending, slices to 3. Each card has a 4px level-colored left border, project title + client name, `ClientRiskBadge`, the deterministic `nextAction` sentence, and (when present) a lime-accented "Lever: {action} (~N pts)" line. Whole card is a `<Link href="/projects/{id}">`. Empty state ("All clients in the green — no action needed.") renders when no project hits the amber threshold

## Deviations from Plan

### Auto-fixed (Rule 1/2 — tightening)

**1. [Rule 2 — Correctness] Suppressed "Client 0" badge in ProjectCard no-contract path**
- **Found during:** Task 2 review
- **Issue:** The original Phase 12 code in the `!riskLevel` branch always rendered `<ClientRiskBadge />` even for brand-new projects with `score === 0`, producing a green "Client 0" pill that is visually noisy and arguably misleading.
- **Fix:** Gated the render on `risk.composite > 0`. Aligns with the matching `> 0` gate already present in `ProjectDetailClient` and matches the plan's stated intent ("`clientRisk.score > 0` … replace with `risk.composite > 0`") even though the original ProjectCard code did not actually have that guard.
- **Files modified:** `components/project/ProjectCard.tsx`

## Auth gates

None. UI-only rewire; no new server actions or auth surfaces.

## Verification results

```
$ grep -E "from '@/lib/risk'" \
    components/project/ProjectCard.tsx \
    components/project/ProjectDetailClient.tsx \
    components/project/ClientBehaviorCard.tsx \
    components/project/ClientRiskBadge.tsx \
    "app/(dashboard)/dashboard/page.tsx" | wc -l
5

$ grep -RE "computeClientRisk|CLIENT_RISK_COLORS" components/ app/
(no hits)

$ npx tsc --noEmit
TYPECHECK_PASSED
```

**Dev-server smoke:** not run (sandbox denies `next dev` invocation). Typecheck is clean and all consumers use the same prop shapes documented by the engine; human verification (next section) covers runtime render.

## Threat surface scan

No new threat surface introduced beyond what was tracked in the plan's threat register. The top-3 panel reads only `projectList` (already RLS-scoped to `user_id` in the dashboard query), and the engine's outputs are deterministic strings / numbers with no untrusted HTML.

## Screenshot checkpoint notes (human verification)

The dashboard panel and the project-detail expansion should be eyeballed before merge:

1. **`/dashboard`** — Confirm a "TOP CLIENT RISK" section appears above "Needs attention" when at least one active project has `composite >= 26`. Each card should have a colored 4px left border (green/orange/red), the composite badge ("Client 47" etc.) right-aligned, the deterministic `nextAction` sentence below, and a lime "Lever: …" line when the engine returned a `topMitigation`. With no amber/red projects, the panel should render a single muted "All clients in the green" row.
2. **`/projects/{id}` on a project that has at least one sent defense response** — Confirm the expanded `ClientBehaviorCard` renders four bars (composite + payment + scope + chargeback), the `nextAction` line, the optional topMitigation callout, and the Signal | Source | Points table with one row per emitted signal. Verify no client-side recomputation: every points value should match what `computeRisk` returns.

## Self-Check: PASSED

- [x] `components/project/ClientRiskBadge.tsx` exists and imports `from '@/lib/risk'`
- [x] `components/project/ClientBehaviorCard.tsx` exists, accepts `{ risk: RiskResult; clientName }`, renders all four bars + evidence table
- [x] `components/project/ProjectCard.tsx` exists and uses `computeRisk`
- [x] `components/project/ProjectDetailClient.tsx` exists and passes `risk={risk}` to `ClientBehaviorCard`
- [x] `app/(dashboard)/dashboard/page.tsx` exists, contains the new "Top client risk" section, and contains no `computeClientRisk` / `CLIENT_RISK_COLORS` / `LEVEL_LABELS` references
- [x] `npx tsc --noEmit` exits clean
