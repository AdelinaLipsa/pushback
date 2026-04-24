# Phase 6: Proactive Detection - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "paste client message → AI classifies situation" entry point to the project page. User pastes raw client text, the AI identifies the situation type and extracts a brief description, the matching defense tool is pre-selected and SituationPanel opens pre-filled — removing the "which tool do I even need?" friction.

Three requirements:
- **DETECT-01:** Paste message → AI returns situation type + 1-sentence explanation, in under 5 seconds
- **DETECT-02:** Classification pre-selects the defense tool and pre-fills the situation field — no re-typing
- **DETECT-03:** Each analysis uses one credit from the shared free-tier limit (same counter as defense responses)

</domain>

<decisions>
## Implementation Decisions

### UI Entry Point (DETECT-01)
- **D-01:** The "paste client message" input lives at the **top of DefenseDashboard**, above the tool grid. A textarea + Analyze button renders before the tool cards. Below it, a divider and "Or pick manually:" label precede the existing tool grid. Power users skip the textarea; new users use the smart path first. No new sections on the project page — everything stays within the DefenseDashboard component.

### Pre-fill Content (DETECT-02)
- **D-02:** The classify API returns `{ tool_type, explanation, situation_context }` — Claude extracts a distilled first-person situation description (e.g. "Client just asked to add full e-commerce to the project, same budget") alongside the tool classification. The raw client message is NOT used verbatim as the situation — Claude writes a clean summary. This matches the style expected by the situation textarea and the existing defense system prompt.

### Post-Detection Flow (DETECT-02)
- **D-03:** After classification, a result banner appears inline in DefenseDashboard: the detected tool name + explanation (e.g. "Scope Change — client is asking for work outside the original agreement"). SituationPanel then opens immediately below the banner with `situation` pre-filled from `situation_context` and the tool pre-selected. The tool-specific `contextFields` are empty (not pre-filled — Claude doesn't extract structured fields in this phase). User reviews the pre-filled situation, optionally edits, then hits Generate. This follows the existing tool → situation → generate flow.

### Plan Gating (DETECT-03)
- **D-04:** Free limit stays at **1** (as in `lib/plans.ts` and migration `003_free_tier_limit.sql`). The analyze-message API calls the same `check_and_increment_defense_responses` RPC — analysis and generation share a single pool of 1 free use. A free user who analyzes will have spent their credit; if they then try to generate, the defend route will return UPGRADE_REQUIRED. No new migration or RPC needed.
- **D-05:** The compensating decrement pattern from the defend route applies here too — if classification fails after the RPC gate fires, decrement `defense_responses_used` back to `preIncrementCount`.

### New API Route
- **D-06:** New route `POST /api/projects/[id]/analyze-message`. Auth check, rate limit, RPC gate, Anthropic call, return JSON. Same pattern as defend route. No database row saved for analysis calls — the credit is counted but the classification result is ephemeral.
- **D-07:** The classify system prompt instructs Claude to return ONLY valid JSON with fields `tool_type`, `explanation`, `situation_context`. Add a new `CLASSIFY_SYSTEM_PROMPT` constant to `lib/anthropic.ts`.
- **D-08:** `tool_type` in the classification response must be one of the 8 `DefenseTool` union values. Parse with Zod and reject unknown types. `extractJson` pattern (inline) handles preamble-wrapped responses.

### Component Changes
- **D-09:** `DefenseDashboard.tsx` gains new state: `messageInput` (string), `analyzeLoading` (boolean), `analysisResult` (`{ tool_type: DefenseTool; explanation: string; situation_context: string } | null`). On analysis success, `selectedTool` is set from `analysisResult.tool_type` and SituationPanel receives `initialSituation`.
- **D-10:** `SituationPanel.tsx` gains an optional `initialSituation?: string` prop. If provided, `useState(initialSituation ?? '')` initialises the situation field pre-filled.

### Visual Style
- **D-11:** Analyze button uses `btnStyles.primary` from `lib/ui.ts` (lime accent — consistent with Phase 4 CTA style). The analyze section uses the same `var(--bg-surface)` / `var(--bg-border)` card style as SituationPanel.
- **D-12:** The result banner uses a subtle lime border or lime left-strip to signal success without being distracting. Tool name displayed in lime; explanation in `var(--text-secondary)`.

### Claude's Discretion
- Exact textarea rows/height for the message input
- Whether to show a character count on the message input
- Loading state copy ("Analyzing..." vs "Identifying situation...")
- Whether to show a "Start over" link to clear the analysis result and go back to the raw input

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Components to Modify
- `components/defense/DefenseDashboard.tsx` — add analyze section + new state; pre-select tool from analysis result
- `components/defense/SituationPanel.tsx` — add `initialSituation?: string` prop

### New Route to Create
- `app/api/projects/[id]/defend/route.ts` — exact pattern to mirror for the new analyze-message route (auth, rate limit, RPC gate, compensating decrement, Anthropic call, Zod validation)

### Shared Libraries
- `lib/anthropic.ts` — add `CLASSIFY_SYSTEM_PROMPT` constant; Anthropic singleton lives here
- `lib/defenseTools.ts` — `DEFENSE_TOOLS` array; all 8 `DefenseTool` values needed for Zod enum in classify route
- `lib/ui.ts` — `btnStyles.primary` for lime Analyze button
- `lib/plans.ts` — `PLANS.free.defense_responses` = 1 (shared credit limit)

### Types
- `types/index.ts` — `DefenseTool` union; add new `MessageAnalysis` type for classify API response

### Plan Gating (reuse existing RPC, no new migration)
- `supabase/migrations/002_atomic_gating.sql` — `check_and_increment_defense_responses` RPC definition
- `supabase/migrations/003_free_tier_limit.sql` — confirms free limit = 1 (no change needed)

### No External Specs
- No new ADRs or external docs. Implementation follows the defend route pattern exactly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `check_and_increment_defense_responses` RPC — reuse as-is; no migration needed for analysis gating
- `extractJson` pattern from `app/api/contracts/analyze/route.ts` — inline JSON extraction for Claude responses that may have preamble
- `btnStyles.primary` from `lib/ui.ts` — lime CTA button, already used in Phase 4 nudge strip
- `SituationPanel.tsx` — needs only one new prop (`initialSituation`) to support pre-fill

### Established Patterns
- Route handler pattern: `getUser()` → rate limit → RPC gate → try/catch with compensating decrement → Anthropic call → save/return
- Compensating decrement: on any failure after RPC gate, reset `defense_responses_used` to `preIncrementCount`
- `UPGRADE_REQUIRED` error with status 403 — DefenseDashboard already handles this shape; reuse
- `response-enter` CSS animation class on SituationPanel — reuse for result banner entrance

### Integration Points
- `DefenseDashboard.tsx` → new `POST /api/projects/[id]/analyze-message` fetch call
- `DefenseDashboard.tsx` → passes `initialSituation={analysisResult.situation_context}` to `SituationPanel`
- `DefenseDashboard.tsx` `selectTool()` logic — analysis auto-calls this with the detected tool type

</code_context>

<specifics>
## Specific Ideas

- The classify prompt should include the list of all 8 tool types and their descriptions (from `lib/defenseTools.ts`) so Claude can match accurately. Output: `{ "tool_type": "scope_change", "explanation": "Client is asking for work outside the original agreement.", "situation_context": "Client asked to add e-commerce to the project at the same budget." }`
- The result banner copy: "**Scope Change** — client is asking for work outside the original agreement." Tool name bolded, explanation as plain text.
- The "Or pick manually" divider between the analyze section and the tool grid should use the existing `var(--bg-border)` divider style (same as the `div` with `height: '1px'` on the project page).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-proactive-detection*
*Context gathered: 2026-04-24*
