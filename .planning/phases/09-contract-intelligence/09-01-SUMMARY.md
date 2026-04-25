---
phase: 09-contract-intelligence
plan: 01
subsystem: api
tags: [anthropic, contract, typescript, next.js]

requires: []
provides:
  - buildContractContext helper: tool-type-aware contract context for Claude prompts
  - contract_clauses_used field in defend API response
  - Updated DEFENSE_SYSTEM_PROMPT with verbatim pushback_language and clause citation instructions
affects: [09-03, 09-04]

tech-stack:
  added: []
  patterns: [tool-group keyword matching for clause selection, D-05 through D-10 context caps]

key-files:
  created: []
  modified:
    - app/api/projects/[id]/defend/route.ts
    - lib/anthropic.ts

key-decisions:
  - "buildContractContext caps context at 3 clauses + 2 missing protections (D-07, D-08)"
  - "tool_type cast to DefenseTool consistent with existing PROMPT_TOOL_LABELS cast"
  - "clauseTitlesUsed declared in outer try block to be in scope at Response.json"

requirements-completed: [SC-01, SC-02]

duration: 12min
completed: 2026-04-25
---

# Phase 09 Plan 01: API Contract Context + System Prompt Summary

**Tool-type-aware `buildContractContext` replaces raw JSON.stringify; defend API now returns `contract_clauses_used`; `DEFENSE_SYSTEM_PROMPT` instructs Claude to cite clauses and use `pushback_language` verbatim**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-25T00:00:00Z
- **Completed:** 2026-04-25T00:12:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `TOOL_CLAUSE_KEYWORDS` and `TOOL_GROUP_MAP` covering all 20 `DefenseTool` values
- Added `buildContractContext` function: filters clauses by tool-group keyword match (capped at 3), includes up to 2 relevant missing protections, returns `{ contextBlock, clauseTitlesUsed }`
- Replaced `JSON.stringify(contractAnalysis)` with `CONTRACT CONTEXT:` block using tool-aware helper
- Extended `Response.json` to include `contract_clauses_used: string[]` (empty array when no contract)
- Updated `DEFENSE_SYSTEM_PROMPT`: use `pushback_language` verbatim when CONTRACT CONTEXT present; no invented contract references when absent

## Task Commits

1. **Task 1: Add buildContractContext helper and extend response shape** — `5bf21da` (feat)
2. **Task 2: Update DEFENSE_SYSTEM_PROMPT contract instruction** — `2a25089` (feat)

## Files Created/Modified
- `app/api/projects/[id]/defend/route.ts` — added `buildContractContext`, `TOOL_CLAUSE_KEYWORDS`, `TOOL_GROUP_MAP`; replaced contractContext block; extended response
- `lib/anthropic.ts` — replaced single-line contract instruction with two-line CONTRACT CONTEXT present/absent block

## Decisions Made
- `tool_type` cast to `DefenseTool` in `buildContractContext` call, consistent with existing cast at `PROMPT_TOOL_LABELS` (Zod infers `string` from `z.enum(DEFENSE_TOOL_VALUES)`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `as DefenseTool` cast to buildContractContext call**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** `tool_type` from Zod schema is typed as `string`; function signature expects `DefenseTool`
- **Fix:** Added `tool_type as DefenseTool` — consistent with existing cast at `PROMPT_TOOL_LABELS[tool_type as DefenseTool]`
- **Files modified:** app/api/projects/[id]/defend/route.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 5bf21da

---

**Total deviations:** 1 auto-fixed (TypeScript cast, consistent with existing pattern)
**Impact on plan:** Non-breaking fix required for type correctness. No scope change.

## Issues Encountered
None — plan executed as specified after type cast fix.

## Self-Check: PASSED

- `buildContractContext` defined at line 41, called at line 192 ✓
- `JSON.stringify` count in route.ts: 0 ✓
- `contract_clauses_used` in Response.json at line 239 ✓
- `CONTRACT CONTEXT is present` and `CONTRACT CONTEXT is absent` in anthropic.ts ✓
- `Reference contract only when` removed from anthropic.ts ✓
- `npx tsc --noEmit` exits 0 ✓

## Next Phase Readiness
- Backend API contract is locked. Plan 09-03 can now wire prop chain (hasContract, contractRiskLevel) from server data, and Plan 09-04 can display contract_clauses_used in ResponseOutput.

---
*Phase: 09-contract-intelligence*
*Completed: 2026-04-25*
