# Phase 9: Contract-Aware Intelligence - Research

**Researched:** 2026-04-25
**Domain:** TypeScript / Next.js 16 App Router — defend API route, React client components, prompt engineering
**Confidence:** HIGH (all findings are from direct codebase inspection; no external lookups required)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**"Based on your contract:" Attribution (SC3 gap)**
- D-01: ResponseOutput shows a "Based on your contract:" section below the response text — only when `contract_clauses_used` is a non-empty array. Never shown when no contract was used.
- D-02: Defend API response shape extends to `{ response, id, contract_clauses_used: string[] }`. Always present — empty array when no contract data was included.
- D-03: DefenseDashboard response state extends to `{ text: string; id: string; contractClausesUsed?: string[] }`.
- D-04: ResponseOutput adds `contractClausesUsed?: string[]` prop. When non-empty, renders a small section: label "Based on your contract:" + comma-separated clause titles in `text-[#52525b]` style.

**Contract Context Block (buildContractContext)**
- D-05: Focused format: each clause included as `title + pushback_language only`. Do NOT include `quote`, `plain_english`, or `why_it_matters`.
- D-06: Always include `risk_level` and `verdict` at the top regardless of tool type.
- D-07: Cap at 3 clauses per tool type.
- D-08: Include up to 2 `missing_protections` relevant to tool type (title + suggested_clause text).
- D-09: `buildContractContext()` returns `{ contextBlock: string, clauseTitlesUsed: string[] }`.
- D-10: When no contract is linked, returns `{ contextBlock: '', clauseTitlesUsed: [] }`. DEFENSE_SYSTEM_PROMPT must explicitly state "never say 'per your contract' when CONTRACT CONTEXT is absent".

**SituationPanel Risk-Aware Indicator**
- D-11: SituationPanel adds two new optional props: `hasContract?: boolean` and `contractRiskLevel?: RiskLevel`.
- D-12: Indicator renders only when `hasContract` is true. Format: "{RiskLevel} risk contract loaded".
- D-13: Color mapping — low/medium → lime (#84cc16), high → amber (#f59e0b raw hex), critical → red (var(--urgency-high)). Text color always var(--text-muted).
- D-14: DefenseDashboard adds `hasContract?: boolean` and `contractRiskLevel?: RiskLevel` props, passed from page.tsx.

**ClauseCard Copy Button**
- D-15: Add copy-to-clipboard button inline with the "What to say back" label.
- D-16: Copies `clause.pushback_language`. No responseId needed — not DB-tracked.

**DEFENSE_SYSTEM_PROMPT Update**
- D-17: Replace existing contract reference instruction with: (1) use `pushback_language` from relevant clauses verbatim when available, (2) cite specific clause title when referencing contract, (3) if CONTRACT CONTEXT is absent, generate without contract references — never invent terms.

### Claude's Discretion
- Exact formatting/styling of the "Based on your contract:" section in ResponseOutput (padding, font size, icon — keep consistent with existing ResponseOutput style)
- Whether `buildContractContext` is a standalone function in `defend/route.ts` or extracted to a `lib/` module (co-locate unless it's >50 lines)

### Deferred Ideas (OUT OF SCOPE)
- Showing which specific pushback_language phrases appeared in the generated response (reverse-tracing AI output to source clauses)
- Contract risk summary preview on hover in SituationPanel indicator
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SC-01 | The defend route builds a structured contract context block per tool type instead of raw JSON.stringify | buildContractContext helper; exact JSON.stringify location confirmed at line 111 of defend/route.ts |
| SC-02 | Generated messages reference specific contract language when a contract is attached — not generic advice | DEFENSE_SYSTEM_PROMPT contract instruction update (D-17) |
| SC-03 | ResponseOutput shows a "Based on your contract:" section when contract data was used | ResponseOutput prop extension (D-01, D-04); API response shape extension (D-02) |
</phase_requirements>

---

## Summary

Phase 9 is a surgical integration phase touching 7 files, zero new dependencies, and zero schema changes. All the data needed already exists: the defend route already fetches `contracts(analysis)`, the `ContractAnalysis` type has all required fields, and `RiskLevel` is already exported from `types/index.ts`. The gap is purely in how the data is used: raw `JSON.stringify` sent to Claude instead of a structured, tool-specific context block, and no UI surface showing what contract data was referenced.

The prop chain for new SituationPanel/DefenseDashboard props requires one additional hop: `page.tsx` currently passes `project.contracts` data only to `ProjectDetailClient`, but `ProjectDetailClient` does not forward it to `DefenseDashboard`. A new `hasContract` and `contractRiskLevel` derivation must happen in `ProjectDetailClient`, and then passed as new props through `DefenseDashboard` to `SituationPanel`. This is the one chain that CONTEXT.md describes as going from `page.tsx → DefenseDashboard → SituationPanel`, but the actual chain is `page.tsx → ProjectDetailClient → DefenseDashboard → SituationPanel` — the intermediate `ProjectDetailClient` is the place where `hasContract` and `contractRiskLevel` will be derived.

The `buildContractContext` function will need a tool-type-to-clause-category mapping. All 20 tool types are confirmed in both `types/index.ts` and the `PROMPT_TOOL_LABELS` record in the defend route. The existing 09-PLAN.md already documents a detailed mapping per tool type grouping — the planner should use it directly.

**Primary recommendation:** Implement in this order: (1) buildContractContext helper + defend route changes, (2) SituationPanel/DefenseDashboard/ProjectDetailClient prop chain, (3) ResponseOutput attribution section, (4) ClauseCard copy button, (5) DEFENSE_SYSTEM_PROMPT update. This ordering ensures each layer is testable independently and the API contract is locked before the UI consumes it.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool-type-to-clause mapping (buildContractContext) | API / Backend | — | Runs server-side in the defend route; keeps sensitive contract data off the client |
| contract_clauses_used in API response | API / Backend | — | Returned in same JSON response as the generated message text |
| "Based on your contract:" section | Browser / Client | — | ResponseOutput is a 'use client' component; purely display logic |
| Risk indicator in SituationPanel | Browser / Client | — | SituationPanel is 'use client'; props flow from server → client boundary at page.tsx |
| hasContract / contractRiskLevel derivation | Frontend Server (SSR) | Browser / Client | Derived in ProjectDetailClient from already-fetched project data; passed as props to client components |
| ClauseCard copy button | Browser / Client | — | ClauseCard is 'use client'; navigator.clipboard is browser API |
| DEFENSE_SYSTEM_PROMPT update | API / Backend | — | Compiled server-side constant in lib/anthropic.ts |

---

## Exact Current State of Canonical Files

### `app/api/projects/[id]/defend/route.ts`

**JSON.stringify location:** Line 111.

```typescript
// lines 107–113 (exact current code)
const contractAnalysis = Array.isArray(project.contracts)
  ? project.contracts[0]?.analysis
  : project.contracts?.analysis
const contractContext = contractAnalysis
  ? `\n\nCONTRACT DATA:\n${JSON.stringify(contractAnalysis, null, 2)}`   // LINE 111 — REPLACE THIS
  : '\n\n(No contract — do not reference or invent contract terms)'
```

**What `buildContractContext` replaces:** The entire ternary on lines 110–113. The new call becomes:
```typescript
const { contextBlock, clauseTitlesUsed } = buildContractContext(contractAnalysis ?? null, tool_type)
const contractContext = contextBlock
  ? `\n\nCONTRACT CONTEXT:\n${contextBlock}`
  : '\n\n(No contract — do not reference or invent contract terms)'
```

**Response line:** Line 156 — `return Response.json({ response, id: saved.id })`. Extend to `return Response.json({ response, id: saved.id, contract_clauses_used: clauseTitlesUsed })`.

**Compensating decrement:** The `await supabase.rpc('decrement_defense_responses', { uid: user.id })` call appears on lines 83, 96, 127, 153, and 159 (inside the catch). Any new failure path inside the try block must also call it. `buildContractContext` itself cannot throw — it works on already-validated data — so no new decrement paths are introduced.

**Zod version:** Per STATE.md deferred items, Zod 4.x is installed (not 3.x). The defend schema already uses Zod 4 API correctly.

---

### `components/defense/ResponseOutput.tsx`

**Current props interface (lines 7–11):**
```typescript
interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
}
```
**Add:** `contractClausesUsed?: string[]`

**Placement of new section:** After the `<div>` closing the pre block (line 58), before the action buttons `<div>` (line 60). The pre block container ends at line 58 with `marginBottom: '1.25rem'` — the attribution section goes between that container and the flex row holding CopyButton and "Mark as sent".

**CopyButton:** Already imported (line 5) and used (line 61). The ClauseCard copy button is separate and does NOT use this component (per D-16 guidance in UI-SPEC: write a minimal inline copy icon button within ClauseCard directly, because CopyButton is sized for primary action with large padding and "Copy Message" label text).

**CopyButton signature (current):** `text: string`, `responseId?: string` — the `responseId` is optional, so CopyButton itself is composable without it. However, per D-16, ClauseCard should use a minimal inline button anyway (not CopyButton).

---

### `components/defense/SituationPanel.tsx`

**Current props interface (lines 7–14):**
```typescript
interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
  initialSituation?: string
  initialContextFields?: Record<string, string>
}
```
**Add:** `hasContract?: boolean`, `contractRiskLevel?: RiskLevel`

**Import addition needed:** `RiskLevel` from `@/types` (not currently imported in this file).

**Indicator placement:** The header row is at lines 43–55. Below that header div and above the form (line 57). The risk indicator row is a new `div` between those two elements, rendered conditionally on `hasContract === true`.

---

### `components/defense/DefenseDashboard.tsx`

**Current props interface (lines 15–19):**
```typescript
interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
  initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }
}
```
**Add:** `hasContract?: boolean`, `contractRiskLevel?: RiskLevel`

**Response state (line 26):** `useState<{ text: string; id: string } | null>(null)`. Extend to `useState<{ text: string; id: string; contractClausesUsed?: string[] } | null>(null)`.

**Response state update (line 92):** `setResponse({ text: data.response, id: data.id })`. Extend to `setResponse({ text: data.response, id: data.id, contractClausesUsed: data.contract_clauses_used })`.

**ResponseOutput call site (lines 298–303):** Currently:
```tsx
<ResponseOutput
  response={response.text}
  responseId={response.id}
  onRegenerate={handleRegenerate}
/>
```
Add: `contractClausesUsed={response.contractClausesUsed}`

**SituationPanel call site (lines 287–295):** Add `hasContract={hasContract}` and `contractRiskLevel={contractRiskLevel}` props.

**Import addition needed:** `RiskLevel` from `@/types` (not currently imported in this file).

---

### `components/project/ProjectDetailClient.tsx`

**This is the missing link in the prop chain.** CONTEXT.md describes the chain as `page.tsx → DefenseDashboard → SituationPanel`, but the actual component tree is:

```
page.tsx (Server Component)
  → ProjectDetailClient (Client Component, line 26)
      → DefenseDashboard (line 74)
          → SituationPanel
          → ResponseOutput
```

**Data already available in ProjectDetailClient:** Lines 29–31 already derive `contract` and `riskLevel` from `project.contracts`. The `contract` variable is a normalized object (handles both array and single-object Supabase shapes).

**Derivation to add (alongside existing lines 29–31):**
```typescript
const hasContract = contract !== null
const contractRiskLevel = contract?.risk_level as RiskLevel | undefined
```

**page.tsx query (line 15):** `select('*, contracts(id, risk_score, risk_level, title)')` — this fetches `risk_level` on the contract. `analysis` is NOT fetched here (that's only in the defend route's own query). So `hasContract` and `contractRiskLevel` can be derived from `page.tsx` data without new queries.

**DefenseDashboard call site in ProjectDetailClient (lines 73–79):** Currently passes `projectId`, `plan`, `responsesUsed`, `initialPaymentPrefill`. Add `hasContract` and `contractRiskLevel`.

**RiskLevel import addition needed:** Add `RiskLevel` to the import from `@/types` in this file (currently imports `DefenseTool, Project`).

---

### `components/contract/ClauseCard.tsx`

**"What to say back" section (lines 62–65):**
```tsx
<div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '0.5rem', padding: '0.875rem' }}>
  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>What to say back</p>
  <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{clause.pushback_language}</p>
</div>
```

The `<p>` label on line 63 must become a flex row (`display: 'flex', justifyContent: 'space-between', alignItems: 'center'`) containing the label text and the copy button. The copy button sits at the same vertical level as the label, not inside the text paragraph.

**State needed:** `const [copied, setCopied] = useState(false)` — ClauseCard already uses `useState` (line 12), so no new import needed. Add a second `useState` for `copied`.

**Lucide icons:** `Copy` and `Check` from `lucide-react` — not currently imported in ClauseCard. Add to imports.

**Copy handler:**
```typescript
async function handleCopyPushback() {
  await navigator.clipboard.writeText(clause.pushback_language)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

---

### `lib/anthropic.ts` — DEFENSE_SYSTEM_PROMPT

**Current contract reference instruction (line 95, within OUTPUT RULES block):**
```
- Reference contract only when contract data is available — never invent terms
```

**Replace with (D-17):**
```
- When CONTRACT CONTEXT is present: use pushback_language from relevant clauses verbatim
  when available; cite the specific clause title when referencing the contract
- When CONTRACT CONTEXT is absent: generate without any contract references —
  never invent terms, never say "per your contract" or similar
```

**No other prompt changes required.** The TONE BY TOOL sections already reference contract terms appropriately ("Reference cancellation clause if available", "reference relevant clause if available") — these stay unchanged.

---

## Tool Type Groupings for buildContractContext

The following groupings are derived from the 20 tool types in `types/index.ts` and the `PROMPT_TOOL_LABELS` record in `defend/route.ts`. [VERIFIED: direct codebase inspection]

**All 20 tool type string values:**
```
scope_change, payment_first, payment_second, payment_final,
revision_limit, kill_fee, delivery_signoff, dispute_response,
ghost_client, feedback_stall, moving_goalposts, discount_pressure,
retroactive_discount, rate_increase_pushback, rush_fee_demand,
ip_dispute, chargeback_threat, spec_work_pressure,
post_handoff_request, review_threat
```

**Recommended groupings for keyword-matching logic in buildContractContext:**

| Group | Tool Types | Keywords to match against clause titles |
|-------|-----------|------------------------------------------|
| scope | `scope_change`, `moving_goalposts`, `post_handoff_request` | scope, revision, deliverable, change, amendment |
| payment | `payment_first`, `payment_second`, `payment_final`, `retroactive_discount`, `chargeback_threat` | payment, invoice, fee, net-30, late, interest |
| kill_fee | `kill_fee` | cancel, termination, kill, kill fee |
| revision | `revision_limit` | revision, change, rounds, unlimited |
| ip | `ip_dispute` | IP, intellectual property, source, ownership, license |
| dispute | `dispute_response`, `review_threat` | (use verdict + top 3 negotiation_priority items) |
| general | `delivery_signoff`, `ghost_client`, `feedback_stall`, `discount_pressure`, `rate_increase_pushback`, `rush_fee_demand`, `spec_work_pressure` | (use risk_level + verdict + highest-risk clauses) |

**Implementation note:** Keyword matching on `clause.title.toLowerCase()` is sufficient. The existing `ContractAnalysis.flagged_clauses` array is already ordered by the AI (most severe first per the analysis prompt's intent). Cap at 3 per D-07.

---

## Standard Stack

No new dependencies. All implementation uses existing project infrastructure:

| Asset | Current Location | Phase 9 Use |
|-------|-----------------|-------------|
| `RiskLevel` type | `types/index.ts` line 1 | contractRiskLevel prop typing |
| `ContractAnalysis` type | `types/index.ts` lines 57–66 | buildContractContext parameter type |
| `FlaggedClause` type | `types/index.ts` lines 42–49 | Iterate flagged_clauses in buildContractContext |
| `MissingProtection` type | `types/index.ts` lines 51–55 | Iterate missing_protections in buildContractContext |
| `RISK_COLORS_RICH` | `lib/ui.ts` line 82 | Already used in ClauseCard; NOT used for new indicator (indicator uses inline colors per D-13) |
| `var(--brand-lime)` | globals.css | low/medium risk dot color |
| `#f59e0b` | raw hex | high risk dot color (NOT `--brand-amber` — confirmed in UI-SPEC: `--brand-amber` maps to lime in globals.css) |
| `var(--urgency-high)` | globals.css | critical risk dot color |
| `var(--text-muted)` | globals.css | indicator text color; attribution label color |
| Lucide `Copy`, `Check` | lucide-react (already installed) | ClauseCard copy button icons |

---

## Gaps and Surprises vs. CONTEXT.md

### Gap 1: prop chain has an extra hop — ProjectDetailClient

CONTEXT.md (line 99) describes: "Props flow: page.tsx (server) → ProjectDetailClient (or direct) → DefenseDashboard → SituationPanel/ResponseOutput". The "(or direct)" parenthetical obscures that there is no way to pass props directly from `page.tsx` to `DefenseDashboard` — `ProjectDetailClient` is always in between. The plan must explicitly include a change to `ProjectDetailClient` to (a) derive `hasContract` and `contractRiskLevel` from `contract` and `riskLevel` (lines 29–31 already have the data), and (b) forward them to `DefenseDashboard`.

This is additive, not a blocker. The data is already available at `ProjectDetailClient` lines 29–31.

### Gap 2: RISK_COLORS_RICH does not include 'critical'

`lib/ui.ts` defines `RISK_COLORS_RICH` with only `high`, `medium`, and `low` keys — no `critical` key. ClauseCard already guards against this with `?? RISK_COLORS_RICH.medium` (line 13). The new indicator must NOT rely on RISK_COLORS_RICH for the critical risk color — use inline `#ef4444` (var(--urgency-high)) directly per D-13.

### Gap 3: CopyButton's responseId is already optional

CONTEXT.md (canonical refs) says "May need adaptation for ClauseCard since it takes a `responseId`". In reality, `responseId` is already optional in `CopyButton` (line 6: `responseId?: string`). However, the UI-SPEC still correctly mandates a minimal inline button for ClauseCard because CopyButton's visual design (large padding, "Copy Message" text label, lime fill) is wrong for the inline label row context. This is not a gotcha — the decision stands, just the stated reason is slightly different from reality.

### Gap 4: contractAnalysis extraction pattern requires defensive coding

In `defend/route.ts`, `project.contracts` can be either an array or a single object (Supabase join shape). Lines 107–109 already handle this with the `Array.isArray` check. The `buildContractContext` function should receive the already-resolved `contractAnalysis` value (after the Array.isArray extraction), not `project.contracts` directly. This keeps the helper type-clean.

### Gap 5: 'critical' not in RISK_COLORS_RICH — confirms D-13 inline hex requirement

The `RISK_COLORS_RICH` in `lib/ui.ts` maps only `high`, `medium`, `low`. The `critical` key is missing (this was noted above). This validates D-13's decision to use raw hex values for the indicator rather than trying to reference a shared map.

### Gap 6: No existing test infrastructure for phase 9 scope

`nyquist_validation` is explicitly `false` in `.planning/config.json` — Validation Architecture section is skipped per instructions.

---

## Architecture Patterns

### Pattern: buildContractContext placement

**Decision (Claude's Discretion):** Co-locate as a standalone function at the top of `defend/route.ts`, above the `POST` handler. The function will be approximately 35–45 lines (well under the 50-line threshold for extraction to lib/). Co-location keeps the contract context logic adjacent to the code that uses it.

**Function signature:**
```typescript
function buildContractContext(
  analysis: ContractAnalysis | null,
  toolType: DefenseTool
): { contextBlock: string; clauseTitlesUsed: string[] }
```

**Output format (D-05, D-06, D-07, D-08):**
```
Risk level: High (7/10) — Sign with changes

RELEVANT CLAUSES:
• Unlimited revisions clause
  → "You must provide revisions until the client is satisfied at their sole discretion"

• Payment terms
  → "Payment due within 60 days of invoice receipt"

MISSING PROTECTIONS:
• Kill fee clause — Suggested: "If client cancels after work commences, a cancellation fee of 50% of remaining project value is due within 14 days."
```

**When no contract:** Returns `{ contextBlock: '', clauseTitlesUsed: [] }`.

---

### Pattern: Conditional prop rendering in client components

Existing pattern confirmed in `SituationPanel` for `initialSituation` and `initialContextFields`. New props `hasContract` and `contractRiskLevel` follow the same optional prop pattern — no useEffect needed (pure render conditional, not a side effect trigger).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard write | Custom clipboard API wrapper | `navigator.clipboard.writeText()` directly | Already used in CopyButton; standard browser API |
| Risk color mapping | A new RISK_COLORS_RICH variant | Inline hex literals per D-13 | RISK_COLORS_RICH lacks 'critical'; inline hex is clearer and avoids a stale shared map |
| Tool grouping | A complex ML/AI routing layer | Simple string array membership check | 20 fixed tool types; static groupings sufficient |

---

## Common Pitfalls

### Pitfall 1: Forgetting compensating decrement on new failure paths

**What goes wrong:** If `buildContractContext` is placed after the Anthropic call but before the insert, and it throws, the credit is consumed without a response saved.

**Why it happens:** The `buildContractContext` call should happen BEFORE the Anthropic call (it builds the input to the prompt, not the response). Placed correctly at lines ~110–113 (replacing the current contractContext block), it runs before `acquireAnthropicSlot` (line 125). No new failure path is introduced.

**How to avoid:** Insert `buildContractContext` call at exactly where `JSON.stringify` is today (lines 110–113). Do not reorder relative to the `acquireAnthropicSlot` or Anthropic API call.

### Pitfall 2: `--brand-amber` CSS variable maps to lime, not amber

**What goes wrong:** Using `var(--brand-amber)` for the high-risk dot color renders lime (#84cc16), not amber (#f59e0b).

**Why it happens:** Per UI-SPEC (color section note): "NOTE: --brand-amber in globals.css is mapped to lime #84cc16 — use raw hex #f59e0b for high-risk dots, not the CSS variable."

**How to avoid:** Use `'#f59e0b'` as a raw hex string literal for the high-risk dot `backgroundColor`. Do not use `var(--brand-amber)`.

### Pitfall 3: Propagating contractClausesUsed before data arrives

**What goes wrong:** `data.contract_clauses_used` might be undefined if a cached or old API response is returned (e.g., during testing or if the route returns early on an error path that doesn't include the field).

**How to avoid:** Use `data.contract_clauses_used ?? []` when updating response state in `handleGenerate`. The API always returns the field (D-02), but defensive coding prevents a runtime crash if the shape is unexpected.

### Pitfall 4: Clause keyword matching is case-sensitive

**What goes wrong:** Matching `clause.title` against keyword arrays without normalizing case misses "IP Assignment" when searching for "ip".

**How to avoid:** Use `clause.title.toLowerCase().includes(keyword)` for all keyword comparisons inside `buildContractContext`.

### Pitfall 5: Missing the `ProjectDetailClient` intermediary in the prop chain

**What goes wrong:** Planner assumes `page.tsx` passes `hasContract` directly to `DefenseDashboard`, skipping the required change to `ProjectDetailClient`.

**How to avoid:** The plan must include `ProjectDetailClient` as a file to modify. It is the component that derives `hasContract` and `contractRiskLevel` from already-fetched contract data, then forwards them to `DefenseDashboard`.

---

## Implementation Sequencing Recommendation

| Wave | Files | Why this order |
|------|-------|----------------|
| 1 | `defend/route.ts` (buildContractContext + response shape) | API contract locked first; everything else depends on `contract_clauses_used` existing in the response |
| 2 | `lib/anthropic.ts` (DEFENSE_SYSTEM_PROMPT) | Prompt updated before testing generation quality; independent of UI |
| 3 | `ProjectDetailClient.tsx` (derive + forward new props) | Data derivation at the server→client boundary; required before Dashboard or Panel can receive props |
| 4 | `DefenseDashboard.tsx` (props + response state + call sites) | Receives from ProjectDetailClient, passes down to SituationPanel and ResponseOutput |
| 5 | `SituationPanel.tsx` (risk indicator) | Depends on Dashboard forwarding props |
| 6 | `ResponseOutput.tsx` (attribution section) | Depends on Dashboard forwarding contractClausesUsed |
| 7 | `ClauseCard.tsx` (copy button) | Completely independent; can be done in any wave |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all changes are code/config modifications to existing files with no new services, tools, or package installs required)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `project.contracts[0]?.analysis` in defend route contains populated `flagged_clauses` and `missing_protections` arrays (not null/empty) when a contract is linked | Tool type groupings section | buildContractContext returns empty clauseTitlesUsed even with a contract; SC-02 not achieved |
| A2 | `flagged_clauses` in the AI-generated analysis are roughly ordered most-severe-first | buildContractContext pattern | Cap at 3 may not select the most relevant clauses for the tool type; mitigation: sort by risk_level before capping |
| A3 | `navigator.clipboard.writeText` is available in the ClauseCard context (HTTPS or localhost) | ClauseCard copy button | Copy silently fails; wrap in try/catch |

---

## Open Questions

1. **Missing protections keyword matching**
   - What we know: `MissingProtection` has `title` and `why_you_need_it` and `suggested_clause` fields
   - What's unclear: Whether the AI-generated `title` values are consistent enough to keyword-match reliably (e.g., "Kill fee clause" vs "Cancellation protection")
   - Recommendation: Match on both `title` and `why_you_need_it` using the same keyword groups; D-08 caps at 2 missing protections so false positives are bounded

2. **Empty flagged_clauses array**
   - What we know: A contract could theoretically have an empty `flagged_clauses` array (e.g., a pristine "safe to sign" contract)
   - What's unclear: Whether `buildContractContext` should still return `risk_level` + `verdict` when there are no clauses to include
   - Recommendation: Yes — D-06 mandates risk_level and verdict "regardless of tool type"; even with zero matching clauses, the header line is still valuable signal for Claude

---

## Sources

### Primary (HIGH confidence)
All findings verified by direct file inspection in this session.

- `app/api/projects/[id]/defend/route.ts` — JSON.stringify at line 111, response shape at line 156, all 20 PROMPT_TOOL_LABELS confirmed
- `components/defense/ResponseOutput.tsx` — Props interface lines 7–11, component structure lines 13–78
- `components/defense/SituationPanel.tsx` — Props interface lines 7–14, header div lines 43–55
- `components/defense/DefenseDashboard.tsx` — Props interface lines 15–19, response state line 26, handleGenerate lines 68–95, call sites lines 287–303
- `components/contract/ClauseCard.tsx` — "What to say back" section lines 62–65, useState import confirmed
- `lib/anthropic.ts` — DEFENSE_SYSTEM_PROMPT lines 80–206, exact contract reference instruction at line 95
- `components/project/ProjectDetailClient.tsx` — Contract derivation lines 29–31, DefenseDashboard call site lines 73–79
- `app/(dashboard)/projects/[id]/page.tsx` — Query at line 15, type cast lines 27–29
- `types/index.ts` — All types confirmed; RiskLevel line 1, ContractAnalysis lines 57–66, FlaggedClause lines 42–49, MissingProtection lines 51–55
- `lib/ui.ts` — RISK_COLORS_RICH lines 82–86 (confirmed: no 'critical' key)
- `lib/defenseTools.ts` — All 20 DEFENSE_TOOL_VALUES confirmed; DEFENSE_TOOL_VALUES export line 227
- `components/shared/CopyButton.tsx` — responseId is optional (line 6); visual design confirmed as incompatible with inline ClauseCard use
- `.planning/config.json` — nyquist_validation: false confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing project infrastructure; no new dependencies
- Architecture: HIGH — all component shapes and data flows verified from actual source files
- Tool type groupings: HIGH — all 20 values verified; keyword groupings are ASSUMED (A2) but bounded by the 3-clause cap
- Pitfalls: HIGH — all sourced from actual code patterns observed during inspection

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable codebase; no fast-moving external dependencies)
