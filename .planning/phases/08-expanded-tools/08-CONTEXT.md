# Phase 8: Expanded Defense Tools - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 12 new defense tool types to the existing 8-tool grid, covering the most common freelancer conflict scenarios not previously addressed: ghost clients, feedback stalls, moving goalposts, discount pressure, retroactive discounts, rate increase pushback, rush fee demands, IP disputes, chargeback threats, spec work pressure, post-handoff requests, and review threats.

**Phase 8 is already implemented in the working tree.** All 5 target files contain the complete changes. This CONTEXT.md documents the decisions made during implementation.

</domain>

<decisions>
## Implementation Decisions

### Tool Grid Layout
- **D-01:** Flat list for v1 — all 20 tools (8 existing + 12 new) in one scrollable grid. New tools appended after the original 8 in insertion order. No grouping by category or sorting by urgency. Keep simple for now; grouping is a post-launch UX concern.

### New Tool Definitions
- **D-02:** 12 new tool types added to `lib/defenseTools.ts` in order: `ghost_client`, `feedback_stall`, `moving_goalposts`, `discount_pressure`, `retroactive_discount`, `rate_increase_pushback`, `rush_fee_demand`, `ip_dispute`, `chargeback_threat`, `spec_work_pressure`, `post_handoff_request`, `review_threat`.
- **D-03:** Each tool follows the established `DefenseToolMeta` shape: `type`, `label`, `description`, `icon` (Lucide name string), `urgency` ('low'|'medium'|'high'), `contextFields` array.
- **D-04:** `review_threat` has empty `contextFields: []` — intentional. The tool's response depends on documented work quality, not a specific context field. User situations for this tool are self-explanatory.
- **D-05:** `ReceiptX` does not exist in lucide-react; `Receipt` is used for `retroactive_discount` instead.

### Icon Map (DefenseToolCard)
- **D-06:** Icons added to `ICON_MAP` in `DefenseToolCard.tsx`: `EyeOff`, `Hourglass`, `Shuffle`, `TrendingDown`, `TrendingUp`, `Zap`, `Copyright`, `CreditCard`, `Eye`, `PackageOpen`, `Star`, `Receipt`. All resolve in lucide-react.

### AI Tone Blocks (DEFENSE_SYSTEM_PROMPT)
- **D-07:** 12 new per-tool tone blocks added to `DEFENSE_SYSTEM_PROMPT` in `lib/anthropic.ts`. Each block prescribes tone, structure, and key messages for that conflict type (e.g., no apology language for `spec_work_pressure`, zero emotion for `review_threat`).

### Defend Route Labels
- **D-08:** 12 new entries added to `TOOL_LABELS` in `defend/route.ts`. Labels follow the existing ALL-CAPS em-dash format (e.g., `'GHOST CLIENT — RADIO SILENCE'`).

### Analyze-Message Route
- **D-09:** `DEFENSE_TOOL_VALUES` in `analyze-message/route.ts` extended to all 20 tool types. `z.enum(DEFENSE_TOOL_VALUES)` now validates classification against all 20. `CLASSIFY_SYSTEM_PROMPT` in `lib/anthropic.ts` updated with descriptions for all 12 new types.

### Free-Tier Gating
- **D-10:** New tools use the same `check_and_increment_defense_responses` RPC gate. No new RPC or migration needed. The free-tier credit pool is shared across all 20 tools.

### Claude's Discretion
- Future tool grouping/categorization (post-launch UX improvement)
- Grid virtualization if tool count grows beyond 30+
- Tool search/filter (not needed at 20 tools)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tool Definitions
- `lib/defenseTools.ts` — Source of truth for all 20 tool definitions (type, label, description, icon, urgency, contextFields)
- `types/index.ts` — DefenseTool union type — all 20 values required for TypeScript validation

### AI Prompts
- `lib/anthropic.ts` — DEFENSE_SYSTEM_PROMPT (tone blocks for all 20 tools) and CLASSIFY_SYSTEM_PROMPT (classifier descriptions for all 20 tools)

### API Routes
- `app/api/projects/[id]/defend/route.ts` — TOOL_LABELS map (all 20 entries)
- `app/api/projects/[id]/analyze-message/route.ts` — DEFENSE_TOOL_VALUES (all 20 types in z.enum)

### UI Components
- `components/defense/DefenseToolCard.tsx` — ICON_MAP with all icons, renders tool cards
- `components/defense/DefenseDashboard.tsx` — Renders DEFENSE_TOOLS.map() — flat grid, no grouping

### Phase Spec
- `.planning/phases/08-expanded-tools/08-PLAN.md` — Original implementation spec with tool definitions, tone blocks, and exact file changes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/ui.ts` — `btnStyles.primary` (lime CTA) used for any new buttons in this phase
- `lib/defenseTools.ts` — `DEFENSE_TOOLS` array; new tools appended following established `DefenseToolMeta` shape
- `components/defense/DefenseToolCard.tsx` — Renders any tool in `DEFENSE_TOOLS` automatically via ICON_MAP lookup

### Established Patterns
- `var(--bg-surface)` / `var(--bg-border)` — Card background style for all defense sections
- `--urgency-high` — Red accent for high-urgency tool labels (existing CSS variable)
- Compensating decrement on Anthropic/DB failure after RPC gate — applied to both defend and analyze routes

### Integration Points
- `DefenseDashboard.tsx` line 268: `DEFENSE_TOOLS.map()` — new tools render automatically once added to `lib/defenseTools.ts`
- `DEFENSE_TOOL_VALUES` in analyze-message route: used for Zod validation of classify response

</code_context>

<specifics>
## Specific Ideas

- Tool ordering follows community research priority (very high → high → medium → low frequency scenarios)
- `review_threat` placed last — it's a "nuclear option" scenario, less frequent than ghosting or price disputes
- `chargeback_threat` and `ip_dispute` both tagged `urgency: 'high'` — these have real legal/financial consequences

</specifics>

<deferred>
## Deferred Ideas

- Tool categories/grouping in the grid (e.g., "Payment", "Scope", "Relationship") — post-launch UX iteration
- Tool search/filter for when tool count grows — not needed at 20 tools
- Client-facing tool suggestions based on contract risk analysis — separate feature, Phase 9+ scope

</deferred>

---

*Phase: 08-expanded-tools*
*Context gathered: 2026-04-25 (retrospective — implementation already complete)*
