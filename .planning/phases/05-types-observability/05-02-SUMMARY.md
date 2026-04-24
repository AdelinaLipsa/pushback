---
plan: 05-02
phase: 05-types-observability
status: complete
completed: 2026-04-24
---

# Plan 05-02: Remove as-any Casts — Summary

## What was built

Eliminated all `as any` and `as unknown as` casts on Supabase joined-query shapes across three files, now that Plan 01 applied the `Database` generic.

## Changes per file

**defend/route.ts** — replaced `(project.contracts as any)?.analysis` with Array.isArray narrowing:
```typescript
const contractAnalysis = Array.isArray(project.contracts)
  ? project.contracts[0]?.analysis
  : project.contracts?.analysis
```
Supabase infers contracts as an array (many-to-one FK) — the first branch fires at runtime.

**ProjectCard.tsx** — replaced three `project as any` casts with direct property access:
```typescript
const contract = Array.isArray(project.contracts) ? project.contracts[0] : project.contracts
const riskLevel = contract?.risk_level
const riskScore = contract?.risk_score
```
The hand-written `Project` type in `types/index.ts` already declares `contracts?` and `defense_responses?`.

**page.tsx** — removed the `ProjectWithContract` workaround type (3 lines) and the `as unknown as ProjectWithContract` cast. Replaced with `const contractsRaw = project.contracts` — typed client infers the shape directly.

## Supabase contracts join inference

Supabase typed client infers `project.contracts` as **array** (consistent with many-to-one FK from `projects.contract_id → contracts.id`). The `Array.isArray` guard handles both outcomes robustly.

## Verification

- `npm run types:check` exits 0
- Zero `as any` / `as unknown as` in all three target files
- Anthropic beta casts in `contracts/analyze/route.ts` and `contracts/[id]/route.ts` unchanged (intentional per D-04)

## Self-Check: PASSED
