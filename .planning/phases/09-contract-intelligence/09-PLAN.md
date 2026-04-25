# Phase 09: Contract-Aware Intelligence

## Goal
Make every generated message demonstrably smarter than what a generic Claude prompt would produce, by deeply integrating the freelancer's actual contract data into generation. This is the core moat: Pushback knows your contract. Claude doesn't.

## Current State
The defend route already fetches `contracts(analysis)` and JSON.stringifies the full analysis blob into the prompt. This is functional but crude — Claude receives a wall of JSON it has to parse, and the prompt says "reference contract only when contract data is available." The UI shows nothing about what contract data was used.

## What Changes

### 1. Smarter contract context extraction in defend route
**File:** `app/api/projects/[id]/defend/route.ts`

Replace the raw JSON.stringify of contractAnalysis with a structured, human-readable contract context block that extracts only what's relevant to the tool type.

New helper function `buildContractContext(analysis, toolType)`:
- For `scope_change` / `moving_goalposts`: extract scope-related flagged clauses + missing protections around scope definition + `negotiation_priority` first item
- For `payment_*` / `chargeback_threat` / `retroactive_discount`: extract payment-related flagged clauses + `missing_protections` around payment terms + any late payment clause flags
- For `kill_fee`: extract cancellation-related clauses + kill fee missing protection if present
- For `revision_limit`: extract revision-related flagged clauses
- For `ip_dispute`: extract IP assignment flagged clauses + `pushback_language` from those clauses
- For `dispute_response` / `review_threat`: extract the contract `verdict` + top 3 `negotiation_priority` items
- For all tools: always include `risk_level`, `verdict`, and any clause with `pushback_language` that is directly relevant

Format output as readable text, not JSON:
```
CONTRACT CONTEXT:
Risk level: High (7/10) — Sign with changes
Relevant clause: "Client reserves right to request unlimited revisions until satisfied"
  → What this means: subjective approval with no revision limit
  → Your position: [pushback_language from that clause]
Missing protection: No kill fee clause
  → Suggested language: [suggested_clause text]
```

### 2. Contract context indicator in SituationPanel
**File:** `components/defense/SituationPanel.tsx`

When a contract is linked to the project, show a subtle "Contract context loaded" indicator at the top of the panel. Pull this from a new optional prop `hasContract: boolean`.

Add the `hasContract` prop to `SituationPanel` and pass it from `DefenseDashboard`. `DefenseDashboard` already receives `projectId` and can derive whether a contract is linked from the project data it fetches — but since the project data is fetched server-side, the simplest approach is to add `hasContract: boolean` as a prop to `DefenseDashboard` and pass it down.

UI: a small lime dot + "Contract terms loaded" in `text-[#52525b]` at the top of the SituationPanel form, below the header row.

### 3. Surface contract pushback_language in contract analysis UI
**File:** `components/contract/RiskReport.tsx` (or wherever the contract analysis is rendered)

Each `flagged_clause` already has a `pushback_language` field. Currently unknown if this is surfaced. Read the file first and add a "Copy pushback language" button next to each flagged clause if not already present.

### 4. DEFENSE_SYSTEM_PROMPT improvement
**File:** `lib/anthropic.ts`

Update the contract reference instruction in DEFENSE_SYSTEM_PROMPT:
- Current: "Reference contract only when contract data is available — never invent terms"
- New: Add explicit instruction to use the `pushback_language` from relevant clauses verbatim when available, and to cite the specific clause title when referencing the contract

## Files to Change
1. `app/api/projects/[id]/defend/route.ts` — replace raw JSON contract dump with `buildContractContext()` helper
2. `components/defense/SituationPanel.tsx` — add `hasContract` prop + indicator UI
3. `components/defense/DefenseDashboard.tsx` — add `hasContract` prop, pass to SituationPanel
4. `app/(dashboard)/projects/[id]/page.tsx` — pass `hasContract` to DefenseDashboard
5. `lib/anthropic.ts` — improve contract reference instruction in DEFENSE_SYSTEM_PROMPT
6. Read `components/contract/RiskReport.tsx` — add pushback_language copy button if missing

## Success Criteria
1. A scope_change message for a project with a contract includes the specific clause language from that contract, not generic advice
2. SituationPanel shows "Contract terms loaded" when a contract is linked
3. Each flagged clause in the contract analysis has a copyable pushback_language
4. The generated message never says "per your contract" when there is no contract
