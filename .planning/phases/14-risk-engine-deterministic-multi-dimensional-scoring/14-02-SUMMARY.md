---
phase: 14-risk-engine-deterministic-multi-dimensional-scoring
plan: 02
subsystem: risk-engine
tags: [risk, orchestrator, deterministic, pure-functions, public-api]
status: complete
dependency_graph:
  requires:
    - 14-01 (lib/risk/{types,weights,payment,scope,chargeback}.ts)
  provides:
    - lib/risk/actions.ts (ACTION_TABLE, pickNextAction)
    - lib/risk/mitigations.ts (MITIGATION_TABLE, pickMitigationAction)
    - lib/risk/index.ts (computeRisk + public re-export surface)
  affects:
    - Plan 03 (UI rewire) imports from `@/lib/risk` only — never sub-paths
    - Plan 04 (compat shim) delegates `computeClientRisk` to `computeRisk`
tech-stack:
  added: []
  patterns:
    - Static 2-key (level, dimension) decision table for nextAction — no template strings, no LLM
    - Static signal-code → counter-action map for topMitigation — null on miss, never default copy
    - Public re-export surface in lib/risk/index.ts — single import path `@/lib/risk`
    - Composite delta simulation: clone the dimension score with the top signal removed, recompute composite, report the difference (D-20)
    - Today-anchor normalisation: `today` (Date | string | undefined) is collapsed to one ISO string before any downstream scorer call
key-files:
  created:
    - lib/risk/mitigations.ts
    - lib/risk/index.ts
  modified: []
  pre-existing-in-tree:
    - lib/risk/actions.ts (untracked on disk before this plan ran; content matched the locked plan spec byte-for-byte — committed as part of this plan)
decisions:
  - "computeRisk(project, today?) is the single public entry point — re-exports cover types + weight constants so consumers import from `@/lib/risk` only"
  - "today is normalised to ISO once at the top of computeRisk; no downstream call reads `new Date()` (D-26 reproducibility)"
  - "Composite is rounded to integer at the engine boundary (D-18) so badges render an integer without UI-side rounding"
  - "topDimension tie-break order: payment > scope > chargeback (declared order — D-26 reproducibility)"
  - "topMitigation tie-break: highest-points signal in the top dimension; ties broken by array order (scorers emit deterministically) — falls back to highest-points signal across all dimensions if the top dimension has zero signals"
  - "When level === 'green', topMitigation = null (no actionable lever for a healthy score)"
  - "When the top signal's code is missing from MITIGATION_TABLE, topMitigation = null (safer than misleading default copy)"
  - "ContractAnalysis exposes flagged_clauses[].title and positive_notes[] strings — NOT a literal clauses_present array. computeRisk derives clauses_present via whole-word case-insensitive match across the known clause vocabulary (late_fee, kill_fee, payment_schedule, scope, revision_cap)"
  - "Empty / missing analysis → clauses_present = [] → all clause-gap signals fire (correct default for 'no contract on file')"
metrics:
  duration: ~15 minutes
  completed_date: 2026-05-16
  tasks_executed: 3
  files_created: 2
  files_modified: 0
---

# Phase 14 Plan 02: Risk Engine Orchestrator Summary

Glue layer that turns the three Plan 01 scorers into a single public entry point: `computeRisk(project, today?) → RiskResult`. Two static decision tables ship alongside — `lib/risk/actions.ts` (the (level × dimension) nextAction grid) and `lib/risk/mitigations.ts` (the signal-code → counter-action map). Zero LLM, zero DB, zero `await` anywhere in the engine.

## Files

### Created
- `lib/risk/mitigations.ts` — 2 exports: `MITIGATION_TABLE` (19 keys, one per signal code Plan 01 emits) and `pickMitigationAction(code) → string | null`. Locked v1 copy. The `chargeback_threat_sent` cell intentionally contains "Phase 15 trigger" (D-19 example + cross-phase coupling).
- `lib/risk/index.ts` — orchestrator + public re-export surface. Exports: `computeRisk`, plus types (`RiskResult`, `RiskSignal`, `RiskLevel`, `RiskDimension`, `DimensionScore`, `RiskInput`) and constants (`RISK_LEVEL_COLORS`, `LEVEL_THRESHOLDS`, `COMPOSITE_WEIGHTS`, `levelFromScore`).

### Pre-existing on disk before this plan ran
- `lib/risk/actions.ts` — was untracked on disk at the start of this plan; content already matched the locked plan spec byte-for-byte (3×3 grid with the 9 locked sentences; the red/chargeback cell contains "Phase 15 trigger"). Verified character-for-character against the plan body and committed alongside the new files. No edits.

## `computeRisk` signature

```ts
export function computeRisk(project: Project, today?: Date | string): RiskResult
```

- `project` — already loaded via the caller's RLS-scoped Supabase query (with `contracts` + `defense_responses` joins). The orchestrator never re-fetches.
- `today` — optional. When omitted, defaults to `new Date().toISOString()` (the only `new Date()` call in the orchestrator). When passed a `Date`, calls `.toISOString()`. When passed a string, used verbatim. The dashboard insight card should pass a single anchor for all projects so per-project ordering is reproducible within one request (D-25).

## ContractAnalysis → `contractClauses` derivation rule

The plan called out that `ContractAnalysis` (`types/index.ts`) has no literal `clauses_present` field. The orchestrator derives one as follows:

1. **Vocabulary:** `late_fee, kill_fee, payment_schedule, scope, revision_cap` — the exact set the Plan 01 scorers check via `contractClauses.includes(...)`.
2. **Synonyms (case-insensitive):** Each token has a synonym list (e.g. `payment_schedule` matches "payment schedule", "milestone payment"). The synonym list lives in `CLAUSE_SYNONYMS` inside `lib/risk/index.ts`.
3. **Haystacks:** all `flagged_clauses[].title` strings AND all `positive_notes[]` strings from the project's analysis.
4. **Match rule:** whole-word case-insensitive `indexOf` with `[a-z0-9_]` boundary check (so "scope" matches "Scope of Work" but not "telescope").
5. **Empty / missing analysis** → `contractClauses = []` → all clause-gap signals (`no_late_fee_clause`, `no_scope_clause`, etc.) fire. This is the correct default for "no contract on file" and matches the Plan 01 scorers' assumption.

If a future analyzer ever emits an explicit `clauses_present` array, the synonym lookup will still pick it up (each token is itself a synonym for itself).

## Locked `(level, dimension)` action grid (D-19)

| level → / dim ↓ | green | amber | red |
| --- | --- | --- | --- |
| **payment** | "Payment behavior looks healthy — no action needed." | "Send a polite payment reminder and confirm the next invoice date in writing." | "Escalate: issue a final payment notice and pause new work until the outstanding invoice clears." |
| **scope** | "Scope is stable — no action needed." | "Re-state the agreed scope in writing before accepting any further changes." | "Stop accepting changes. Issue a written scope-change order with revised price before proceeding." |
| **chargeback** | "No chargeback signals — no action needed." | "Save dated proof of delivery and sign-off for this project — keep it organized." | "Compile a dispute evidence pack now — see Phase 15 trigger." |

All 9 cells locked verbatim — no template variables, no concatenation.

## Tie-break rules

| Decision | Rule |
| --- | --- |
| `topDimension` (which dimension dominates the composite) | Highest raw `score`; ties broken in declared order `payment > scope > chargeback`. |
| `topMitigation` signal pick (within top dimension) | Highest `points`; ties broken by array order (each Plan 01 scorer emits signals in a deterministic order, so the first signal at the max wins reproducibly). |
| `topMitigation` fallback (top dimension has zero signals) | Scan all three dimensions in declared order, pick the highest-points signal across all of them. |
| `topMitigation = null` cases | level === 'green', OR the chosen signal's code is missing from `MITIGATION_TABLE` (defensive — keeps misleading copy off the UI). |

## Composite + level (D-08 / D-18)

```
composite = clamp(round(0.4 * payment.score + 0.3 * scope.score + 0.3 * chargeback.score), 0, 100)
level     = levelFromScore(composite)  // <26 green, 26..65 amber, >=66 red
```

Rounding happens at the engine boundary — UI never re-rounds.

## `topMitigation.deltaPoints` algorithm (D-20)

1. Pick `chosenSignal` from `topDimension.signals` (highest points, ties = first).
2. Compute `newDimScore = clamp(oldDimScore - chosenSignal.points, 0, 100)`.
3. Plug `newDimScore` into the composite formula in place of that dimension's score.
4. `deltaPoints = composite - newComposite` (integer, can be 0 if the dimension was outweighed by others).

`deltaPoints = 0` is possible at very low signal weights — Plan 03 may want to suppress display of zero-delta mitigations, but the engine still surfaces the action sentence so a perfectionist user can act on it.

## Verification

| Check | Result |
| --- | --- |
| `lib/risk/actions.ts` exists | yes |
| `lib/risk/mitigations.ts` exists | yes |
| `lib/risk/index.ts` exists | yes |
| `npx tsc --noEmit` | exit 0, no output |
| `grep -RE "fetch\\(|supabase|process\\.env" lib/risk/` | no hits |
| `grep -E "export function computeRisk" lib/risk/index.ts` | match |
| `grep -c "Phase 15 trigger" lib/risk/actions.ts` | 2 |
| `grep -c "Phase 15 trigger" lib/risk/mitigations.ts` | 2 |
| Mitigation table key count (one per Plan 01 signal code) | 19 — matches 1:1 with the 19 codes emitted across `payment.ts`, `scope.ts`, `chargeback.ts` |
| No `await`, `Promise.`, `fetch`, `supabase` in `lib/risk/index.ts` | confirmed via grep |

The optional inline-runtime smoke (the plan said "if convenient") was not executable in this sandbox (Bash blocked from running `npx tsx -e`). All four required automated verifications passed.

## Deviations from Plan

### Notable — none

**1. `lib/risk/actions.ts` was already on disk untracked when this plan started.** Its content already matched the locked Task 1 spec byte-for-byte (3×3 grid, "Phase 15 trigger" present, no template literals). I verified character-for-character against the plan body and included it in this plan's atomic commit. Not a code deviation — saved one re-write.

**2. Synonym table for clause derivation.** The plan said "token matches against the known clause vocabulary" — I implemented an explicit `CLAUSE_SYNONYMS` map so real-world `flagged_clauses[].title` strings like "Late Fee Clause" or "Statement of Work" match the canonical tokens. The plan's verbatim-token rule alone (`scope` substring) would have under-counted clause presence on every project that uses human language in its contract analysis. Whole-word boundary check prevents false positives ("scope" does not match "telescope"). Documented at length in the ContractAnalysis section above so Plan 03 reviewers see the rule explicitly.

**3. `topMitigation = null` when signal code is missing from `MITIGATION_TABLE`.** The plan called this out as defensive ("safer than emitting unhelpful text"). Implemented exactly as specified, but noting it here because it intersects with Plan 03's UI contract: the topMitigation render branch must handle null. Not a deviation from the plan — it's the plan's instruction.

## Out-of-scope state (untouched per orchestrator instructions)

- `.planning/phases/{14,15,16}/...` planning artifacts and `.planning/{ROADMAP,STATE}.md` modifications stay untracked.
- Pre-existing test failures in `tests/api/{stripe-webhook,reply,defend,analyze-message}` are unrelated to Phase 14 — confirmed by Wave 1, no Phase 14 file is imported by any of those test paths.

## Pointer for Plan 03

```ts
import { computeRisk } from '@/lib/risk'
import type { RiskResult, RiskLevel } from '@/lib/risk'
import { RISK_LEVEL_COLORS, levelFromScore } from '@/lib/risk'
```

Plan 03 should:
1. Compute one shared `today` ISO at the top of the server component and pass it to every `computeRisk` call so the dashboard top-3 ordering is reproducible within the request (D-25).
2. Render `result.composite` and `result.level` (with `RISK_LEVEL_COLORS[result.level]` for the pill).
3. Render the per-dimension `score` bars + the per-signal evidence table from `result.dimensions.{payment,scope,chargeback}.signals`.
4. Render `result.nextAction` as plain text (D-22 — no deep-link in v1).
5. Render `result.topMitigation` IFF non-null. Display format: `"${action} (–${deltaPoints} points)"` or similar — concatenation lives in the UI, not the engine.

## Self-Check: PASSED

- `lib/risk/actions.ts` — FOUND
- `lib/risk/mitigations.ts` — FOUND
- `lib/risk/index.ts` — FOUND
- `npx tsc --noEmit` — exit 0
- All `must_haves.truths` from the plan frontmatter satisfied
- All `must_haves.key_links` satisfied (5 imports from `index.ts` to sibling modules confirmed via grep)
- No new untracked files outside `lib/risk/` and the phase planning dir
