# Phase 12: Client Risk Intelligence - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Compute a behavioral risk score (0–100) for each client from existing DB data — sent defense responses, payment overdue status — and surface it in two places: a badge on `ProjectCard` in the project list, and a `ClientBehaviorCard` on the project detail page above `DefenseDashboard`. A complementary dashboard insight shows high-risk clients when any project is yellow/red. No new DB tables, no new migrations, no AI calls — pure computation from data already in the schema.

</domain>

<decisions>
## Implementation Decisions

### Badge on ProjectCard
- **D-01:** The client behavior badge sits in the **existing badge row** (top-right of the card, alongside the status pill, contract risk badge, and OVERDUE pill). Do not inline next to client name, do not replace the contract risk badge.
- **D-02:** Show the badge for **all risk levels** including green (score 0–25). Every project card always has a behavior badge — absence does not indicate clean slate. A green badge at 0 is a positive signal the user can see.
- **D-03:** Badge label shows the **numeric score** (e.g., `Client 40` or `Behavior 40`). Do not use qualitative-only labels (Watch / High Risk). Consistent with the contract badge showing "Risk 7/10" — two parallel quantified signals on the card.
- **D-04:** Same **pill style** as the contract risk badge: dark background (`rgba(0,0,0,0.3)`), colored border matching the risk level, matching text color. Use the existing `RISK_COLORS` map or a new `CLIENT_RISK_COLORS` constant. No filled backgrounds — bordered pill only.

### Scoring Model
- **D-05:** Score counts **only sent responses** (`was_sent = true`). Generating a defense message without sending it does not count toward the score — only actual conflict that reached the client contributes.
- **D-06:** Severity weights — **Claude's discretion.** Use roughly the buckets from the informal plan as a baseline (disputes/threats heaviest, scope creep medium, ghost signals lighter), but adjust proportionally so a single chargeback_threat or dispute_response alone can push into yellow territory.
- **D-07:** **Permanent running total** — no time decay. Signals from 6 or 12 months ago still count. Simplicity over nuance.
- **D-08:** On-time payment bonus (-10 for `payment_received_at` before `payment_due_date`) — **Claude's discretion.** Include if it keeps the scoring range clean; drop if it adds edge-case complexity without meaningful UX benefit.

### Risk Levels (locked from ROADMAP)
- 0–25: green (no concerns)
- 26–60: yellow (watch this client)
- 61+: red (high-risk client)

### Project Detail — ClientBehaviorCard
- **D-09:** New component: `ClientBehaviorCard` (or `components/project/ClientBehaviorCard.tsx`). A card/panel, not an inline text row. Contains the score and the signal list.
- **D-10:** **Only render when score > 0.** When a project has zero sent defense responses and no overdue payment, the card does not appear at all.
- **D-11:** Position: **above `DefenseDashboard`** on the project detail page. Freelancer sees the risk context before choosing a tool — informs which tool to reach for.
- **D-12:** Detail page shows **score + signals**: e.g., "Client Risk: 72 · 3 scope changes · Payment overdue · 1 dispute". Both the number and the human-readable signal list are present.

### Dashboard Insights
- **D-13:** Framing — **Claude's discretion.** Prefer surfacing the **riskiest client** (actionable: names the specific client) over aggregate This-Month counts (pattern-level, less immediately useful). If there are multiple red clients, show the top one by score.
- **D-14:** Placement — **Claude's discretion.** Prefer merging high-risk client rows into the existing **Needs Attention** section from Phase 10 rather than adding a separate new section. Only add a dedicated section if the visual language conflicts.
- **D-15:** Only render the insight when **at least one project is yellow or red** (score > 25). Do not show the section when all clients are clean.
- **D-16:** Compute **server-side** as part of the existing dashboard Server Component query. No client-side hydration waterfall for risk scores. Consistent with how Needs Attention rows are computed in Phase 10.

### Claude's Discretion
- Exact badge label prefix: `Client` vs `Behavior` vs no prefix — pick what reads most naturally alongside `Risk 7/10`
- Whether to include the -10 on-time payment bonus in the scoring function
- Dashboard framing: riskiest client spotlight vs aggregate counts — pick whichever is more actionable for a freelancer scanning quickly
- Whether high-risk clients merge into Needs Attention or get a separate subsection below it
- Signal label formatting: "3 scope changes" vs "Scope creep ×3" vs individual bullet points

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components (read before modifying)
- `components/project/ProjectCard.tsx` — existing badge row implementation; new badge goes in the same row, same pill pattern
- `app/(dashboard)/dashboard/page.tsx` — dashboard Server Component; dashboard insight computation goes here
- `app/(dashboard)/projects/[id]/page.tsx` — project detail Server Component; ClientBehaviorCard renders here above DefenseDashboard

### Types and Constants
- `types/index.ts` — `Project`, `DefenseResponse`, `DefenseTool` union, `RiskLevel` — do not create new type files
- `lib/defenseTools.ts` — `DEFENSE_TOOLS` metadata array with all tool types and urgency levels; use to categorize tool_type values in the scoring function

### Design System
- `app/globals.css` — CSS custom properties (`--urgency-low`, `--urgency-medium`, `--urgency-high`, `RISK_COLORS` import source)

### Prior Phase Patterns (must-read for consistency)
- `.planning/phases/10-smart-escalation/10-CONTEXT.md` — Needs Attention section design decisions (D-01 to D-13); dashboard insight must coexist with this section
- `.planning/phases/11-document-generation/11-CONTEXT.md` — component placement patterns, secondary action patterns in the defense flow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RISK_COLORS` (imported in `ProjectCard.tsx` from `@/lib/ui`) — existing color map for risk levels; client risk uses the same green/yellow/red levels, may reuse or extend
- `isOverdue` logic in `ProjectCard.tsx` — already computed on the card; scoring function can use the same `payment_due_date` / `payment_received_at` fields without re-deriving
- `RiskScoreBadge` component (`components/contract/RiskScoreBadge.tsx`) — existing risk pill; evaluate whether this can be reused/extended for the client behavior badge or if a new `ClientRiskBadge` is cleaner

### Established Patterns
- Inline `style` objects with CSS vars for all layout — no Tailwind layout classes; match this pattern in `ClientBehaviorCard`
- `UPPER_SNAKE_CASE` for module-scope constants (`RISK_COLORS`, `DEFENSE_TOOLS`) — follow for any new `CLIENT_RISK_COLORS` or scoring constants
- Risk computation belongs in `lib/` as an isomorphic utility (e.g., `lib/clientRisk.ts`) — same pattern as `lib/defenseTools.ts`
- Server Components compute and pass data down; Client Components handle interactivity — `ClientBehaviorCard` is display-only, can be a Server Component

### Integration Points
- `Project` type already includes `defense_responses?: DefenseResponse[]` and payment fields — no schema changes needed; scoring function works from the existing join
- Dashboard query (`dashboard/page.tsx`) already joins `defense_responses(id, tool_type, created_at, was_sent)` from Phase 10 — the scoring function should work from this existing join without additional DB calls
- Project detail query (`projects/[id]/page.tsx`) should already join defense_responses; verify the join includes `was_sent` (needed for scoring filter)

</code_context>

<specifics>
## Specific Ideas

- The badge label format "Client 40" (prefix + number) distinguishes the behavior badge from the contract badge ("Risk 7/10"). "Client" makes the signal clearly about the person, not the document.
- `computeClientRisk(project: Project): ClientRiskResult` — pure function, takes a hydrated Project with defense_responses, returns score + level + signals array. Can be called server-side in both dashboard and project detail pages.
- Signal labels should be human-readable: "3 scope changes", "Payment overdue 12 days", "1 chargeback threat" — not tool_type slugs.

</specifics>

<deferred>
## Deferred Ideas

- **Client reply threading** (Phase 999.1, already in backlog) — freelancer pastes client's reply to a sent pushback, app surfaces risk signals and suggests next step. Out of scope here.
- **Risk trend over time** — showing whether a client is getting better or worse across a project timeline. Complex, no time-series data structure yet.
- **Cross-project client risk** — aggregating risk across multiple projects with the same client (same `client_name` or `client_email`). Phase 12 is per-project only.

</deferred>

---

*Phase: 12-client-risk*
*Context gathered: 2026-04-26*
