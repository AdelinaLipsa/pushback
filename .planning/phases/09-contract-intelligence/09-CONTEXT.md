# Phase 9: Contract-Aware Intelligence - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Deeply integrate the freelancer's actual contract analysis data into every generated defense message — structured extraction per tool type, visual attribution in the response UI, and risk-aware signaling in the generation panel.

**In scope:**
- `buildContractContext(analysis, toolType)` helper replacing raw JSON.stringify in the defend route
- Per-tool clause relevance mapping (scope tools → scope clauses, payment tools → payment clauses, etc.)
- Defend API extended to return `contract_clauses_used: string[]`
- `ResponseOutput` — "Based on your contract:" section showing clause titles used
- `SituationPanel` — risk-aware "High risk contract loaded" indicator with `hasContract` + `contractRiskLevel` props
- `DefenseDashboard` — passes `hasContract` and `contractRiskLevel` down from server-side project data
- `ClauseCard` — copy button next to "What to say back" label
- `DEFENSE_SYSTEM_PROMPT` — improved contract reference instruction (use pushback_language verbatim, cite clause title)

**Out of scope:**
- Contract comparison between projects
- Contract improvement suggestions
- Any changes to the contract upload or analysis flow

</domain>

<decisions>
## Implementation Decisions

### "Based on your contract:" Attribution (SC3 gap)
- **D-01:** `ResponseOutput` shows a "Based on your contract:" section below the response text — only when `contract_clauses_used` is a non-empty array. Never shown when no contract was used.
- **D-02:** Defend API response shape extends to `{ response, id, contract_clauses_used: string[] }`. The `contract_clauses_used` field is always present — empty array when no contract data was included.
- **D-03:** `DefenseDashboard` response state extends to `{ text: string; id: string; contractClausesUsed?: string[] }`.
- **D-04:** `ResponseOutput` adds `contractClausesUsed?: string[]` prop. When non-empty, renders a small section: label "Based on your contract:" + comma-separated clause titles in `text-[#52525b]` style.

### Contract Context Block (buildContractContext)
- **D-05:** Verbosity — focused format: each clause included as `title + pushback_language only`. Do NOT include `quote`, `plain_english`, or `why_it_matters` in the prompt. Keeps context block tight.
- **D-06:** Always include `risk_level` and `verdict` at the top of the context block regardless of tool type.
- **D-07:** Cap at **3 clauses** per tool type — the most directly relevant ones. If the contract has 6 scope-related clauses, include only the top 3.
- **D-08:** Also include up to 2 `missing_protections` relevant to the tool type (title + suggested_clause text). Missing protections are often more actionable than flagged clauses.
- **D-09:** `buildContractContext()` returns `{ contextBlock: string, clauseTitlesUsed: string[] }` — the `clauseTitlesUsed` array feeds directly into `contract_clauses_used` in the API response.
- **D-10:** When no contract is linked, `buildContractContext` returns `{ contextBlock: '', clauseTitlesUsed: [] }` — the DEFENSE_SYSTEM_PROMPT instruction must explicitly state "never say 'per your contract' when CONTRACT CONTEXT is absent".

### SituationPanel Risk-Aware Indicator
- **D-11:** `SituationPanel` adds two new optional props: `hasContract?: boolean` and `contractRiskLevel?: RiskLevel`.
- **D-12:** Indicator only renders when `hasContract` is true. Text format: `"{RiskLevel} risk contract loaded"` — capitalized risk level + " risk contract loaded". E.g., "High risk contract loaded".
- **D-13:** Color mapping for the indicator dot: `low` → lime (`var(--brand-lime)`), `medium` → lime, `high` → amber (`#f59e0b`), `critical` → red (`var(--urgency-high)`). Text color stays `text-[#52525b]` regardless of risk level.
- **D-14:** `DefenseDashboard` adds `hasContract?: boolean` and `contractRiskLevel?: RiskLevel` props. Passed down from the server component (`page.tsx`) which already has access to the joined contract data.

### ClauseCard Copy Button
- **D-15:** Add a copy-to-clipboard button inline with the "What to say back" label in `ClauseCard`. Uses the existing `CopyButton` component pattern (or a minimal inline copy icon button if CopyButton is not easily composable without a `responseId`).
- **D-16:** The copy button copies `clause.pushback_language` to clipboard. No `responseId` needed — this is not a DB-tracked copy action.

### DEFENSE_SYSTEM_PROMPT Update
- **D-17:** Replace the existing contract reference instruction with: (1) use `pushback_language` from relevant clauses verbatim when available, (2) cite the specific clause title when referencing the contract, (3) if CONTRACT CONTEXT is absent, generate without any contract references — never invent terms.

### Claude's Discretion
- Exact formatting/styling of the "Based on your contract:" section in ResponseOutput (padding, font size, icon — keep consistent with existing ResponseOutput style)
- Whether `buildContractContext` is a standalone function in `defend/route.ts` or extracted to a `lib/` module (co-locate unless it's >50 lines)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types
- `types/index.ts` — `ContractAnalysis`, `FlaggedClause`, `MissingProtection`, `RiskLevel` types. `FlaggedClause` has `title`, `quote`, `plain_english`, `why_it_matters`, `pushback_language`, `risk_level`.

### Key Source Files
- `app/api/projects/[id]/defend/route.ts` — Current defend route. Contract context is currently raw `JSON.stringify(contractAnalysis, null, 2)` at line ~111. Response shape is `{ response, id }` at line ~156.
- `components/defense/ResponseOutput.tsx` — Current props: `{ response, responseId, onRegenerate }`. Extend with `contractClausesUsed?: string[]`.
- `components/defense/SituationPanel.tsx` — Current props include `initialSituation?` and `initialContextFields?`. Add `hasContract?` and `contractRiskLevel?`.
- `components/defense/DefenseDashboard.tsx` — Current props: `{ projectId, plan, responsesUsed, initialPaymentPrefill? }`. Add `hasContract?` and `contractRiskLevel?`. Response state is `{ text: string; id: string }`.
- `components/contract/ClauseCard.tsx` — Renders `pushback_language` as text in an elevated box under "What to say back" label. Add copy button next to that label.
- `lib/anthropic.ts` — `DEFENSE_SYSTEM_PROMPT` has a contract reference instruction to update.

### Prior Phase Patterns
- `components/shared/CopyButton.tsx` — Existing copy-to-clipboard component (used in ResponseOutput). May need adaptation for ClauseCard since it takes a `responseId` — either adapt or write a minimal inline copy button.
- Phase 07 context (`07-CONTEXT.md`) — `initialContextFields` prop pattern for SituationPanel (D-15 pattern to follow for new props)
- Phase 04 context (`04-CONTEXT.md`) — `btnStyles.primary` for lime CTAs; `var(--brand-lime)` for accent colors

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ContractAnalysis` type already has all needed fields — no schema changes required
- `RiskLevel` type (`'low' | 'medium' | 'high' | 'critical'`) — use directly for contractRiskLevel prop typing
- `CopyButton` in `components/shared/` — exists for ResponseOutput; may need a simpler variant for ClauseCard (no responseId tracking)
- `var(--brand-lime)` and `#f59e0b` (amber) and `var(--urgency-high)` — risk-level color mapping can reuse existing CSS variables

### Established Patterns
- API response extensions follow `{ response, id }` pattern — add `contract_clauses_used: string[]` to same return
- Compensating decrement after RPC gate applies to all failure paths — any new logic in defend route must preserve this
- Props flow: page.tsx (server) → ProjectDetailClient (or direct) → DefenseDashboard → SituationPanel/ResponseOutput
- `var(--bg-elevated)` for the "What to say back" container in ClauseCard — copy button sits at the label row level above it

### Integration Points
- `page.tsx` for `projects/[id]` already fetches `contracts(analysis)` — `hasContract` and `contractRiskLevel` derivable from existing data without new queries
- `DefenseDashboard` already passes `projectId` to the defend fetch — `contract_clauses_used` comes back in the same response

</code_context>

<specifics>
## Specific Ideas

- Risk-level indicator in SituationPanel: dot color follows risk level (lime for low/medium, amber for high, red for critical) — same palette already established in `RISK_COLORS_RICH` in `lib/ui.ts`
- "Based on your contract: Revision clause, Payment terms" — clause titles shown as a comma-separated list, no bullets, compact

</specifics>

<deferred>
## Deferred Ideas

- Showing which specific pushback_language phrases appeared in the generated response (reverse-tracing AI output to source clauses) — interesting but requires comparing generated text to clause content, post-launch
- Contract risk summary preview on hover in SituationPanel indicator — tooltip with verdict text; post-launch UX iteration

</deferred>

---

*Phase: 09-contract-intelligence*
*Context gathered: 2026-04-25*
