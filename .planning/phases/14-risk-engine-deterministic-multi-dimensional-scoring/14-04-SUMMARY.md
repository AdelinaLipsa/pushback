---
phase: 14-risk-engine-deterministic-multi-dimensional-scoring
plan: 04
subsystem: risk-engine
tags: [risk, testing, compat-shim, phase-12-compat, vitest, deterministic]
dependency-graph:
  requires:
    - 14-01 (per-dimension scorers: payment / scope / chargeback)
    - 14-02 (computeRisk orchestrator + actions + mitigations tables)
    - 14-03 (UI rewire — Plan 04 leaves UI untouched)
    - phase-12 (lib/clientRisk.ts surface this plan preserves)
  provides:
    - lib/clientRisk.ts compat shim (Phase 12 surface → Phase 14 engine)
    - tests/risk/{payment,scope,chargeback,orchestrator,compat}.test.ts CI suite
  affects:
    - any future caller of @/lib/clientRisk continues to see Phase 12 shape
    - any future change to lib/risk/* must keep tests/risk/* green
tech-stack:
  added: []
  patterns:
    - "Compat shim pattern: legacy file delegates to new module, preserves legacy boundary"
    - "Determinism-by-injection: tests anchor today on a fixed ISO string"
    - "Pure-CPU vitest fixtures: no DB, no Supabase, no network mocks"
key-files:
  created:
    - tests/risk/payment.test.ts
    - tests/risk/scope.test.ts
    - tests/risk/chargeback.test.ts
    - tests/risk/orchestrator.test.ts
    - tests/risk/compat.test.ts
  modified:
    - lib/clientRisk.ts (Phase 12 implementation → compat shim)
decisions:
  - "Shim translates engine RiskSignal.source → Phase 12 icon: projects→CreditCard, responses→Layers, contracts→FileText"
  - "Shim overrides icon to ShieldAlert for chargeback/dispute/review signal codes (Phase 12 visual grouping)"
  - "Shim filters engine signals with points<=0 (e.g. on_time bonus) — Phase 12 never surfaced negative signals"
  - "Shim re-derives Phase 12 level using legacy thresholds (61+ red, 26+ yellow) on a Phase 14 composite — D-08 handoff rule"
  - "Test fixtures use today=2026-05-17 anchor for full determinism (D-26)"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-17"
---

# Phase 14 Plan 04: Compat shim + deterministic test suite — Summary

Closed out Phase 14 by rewriting `lib/clientRisk.ts` into the CONTEXT D-05 compat shim and adding a five-file vitest suite under `tests/risk/` that locks ROADMAP success criteria 1, 2, 5 plus the D-08 handoff rule into CI.

## Shim rewrite — before / after

**Before (Phase 12, ~170 LOC):** `computeClientRisk` ran its own weighted-tally loop over `defense_responses` keyed on `RISK_WEIGHTS`, added an `OVERDUE_PAYMENT_WEIGHT` independent term, applied an `ON_TIME_BONUS`, and mapped via a `SIGNAL_RULES` table. The level boundary was `score >= 61 ? 'red' : score >= 26 ? 'yellow' : 'green'`.

**After (Plan 04, ~205 LOC, no business logic of its own):** `computeClientRisk` pads the caller-supplied `Pick<Project, ...>` subset into a full `Project`, calls `computeRisk(fullProject)` from `./risk`, then translates the Phase 14 `RiskResult` back into the Phase 12 `ClientRiskResult` shape.

**Surface preserved verbatim:**
- `ClientRiskLevel`, `ClientRiskSignal`, `ClientRiskResult` types (note: `level` keeps `'yellow'`, NOT `'amber'`)
- `CLIENT_RISK_COLORS` (`green '#22c55e'`, `yellow '#f97316'`, `red '#ef4444'`) — cannot re-export `RISK_LEVEL_COLORS` because the key set differs (`amber` vs `yellow`)
- `LEVEL_LABELS` (`'No concerns'`, `'Watch this client'`, `'High-risk client'`)
- `RISK_WEIGHTS` — frozen at Phase 12 values (no behavioral promise that they match the engine internals, which use per-dimension caps)
- `computeClientRisk` signature

**Translation rules (locked):**
- `score` ← `RiskResult.composite`
- `level` ← legacy boundary applied to `composite`: `>=61 ? 'red' : >=26 ? 'yellow' : 'green'` (D-08 handoff: Phase 14 raised red to 66, the shim absorbs the shift)
- `signals` ← flatten `dimensions.{payment,scope,chargeback}.signals`, filter `points > 0` (drops `on_time` bonus), map to `{ icon, label }`:
  - `code.startsWith('chargeback'|'dispute'|'review')` → `'ShieldAlert'`
  - else `source==='projects'` → `'CreditCard'`
  - else `source==='responses'` → `'Layers'`
  - else `source==='contracts'` → `'FileText'`

## Test files created — what each locks

| File | LOC | Locks | Cases |
|------|-----|-------|-------|
| `tests/risk/payment.test.ts` | 156 | D-10 lateness bands, contract-gap signals, partial_payment_pressure >=2 boundary, D-11 clamping | 11 |
| `tests/risk/scope.test.ts` | 122 | D-13 per-tool caps (32/24), revision_pressure+no_revision_cap as separate signals, D-14 unsent-filter precondition | 8 |
| `tests/risk/chargeback.test.ts` | 154 | D-16 chargeback_threat cap (60), silence_14d gating (unpaid-only, strict >=14), no_signoff_on_delivery 30-day window, D-17 clamp | 9 |
| `tests/risk/orchestrator.test.ts` | 207 | Success criteria 1 (determinism), D-18 composite math, D-08 level boundaries via `levelFromScore`, declared-order tie-break, D-19 red/chargeback exact-string lock, D-20 topMitigation | 8 |
| `tests/risk/compat.test.ts` | 195 | Phase 12 surface preserved, D-08 handoff (composite 61 → amber on engine, red on shim), on_time signal filter, icon mapping (ShieldAlert / CreditCard / FileText) | 9 |

**Total: 51 cases, all passing.**

## Test results

```
RUN  v4.1.5 /Users/adelinalipsa/Documents/GitHub/pushback
Test Files  5 passed (5)
     Tests  51 passed (51)
  Duration  262ms
```

`npx tsc --noEmit` exits 0. Plan-verification greps:
- `grep -E "from './risk'" lib/clientRisk.ts` → present
- `grep -c "^export " lib/clientRisk.ts` → 7 (≥7 required)
- `grep "Compile a dispute evidence pack now — see Phase 15 trigger." tests/risk/orchestrator.test.ts` → present (D-19 lock)

## Success criteria coverage

| ROADMAP Success Criterion | Locked in |
|---------------------------|-----------|
| 1. Reproducibility — same inputs always yield same score | `orchestrator.test.ts` Case 1 (determinism — `computeRisk(p, today)` called twice asserts `toEqual`) |
| 2. ≥3 independent signals per dimension | `payment.test.ts` (4 codes), `scope.test.ts` (6 codes), `chargeback.test.ts` (5 codes) all asserted by code |
| 5. Red threshold → named mitigation | `orchestrator.test.ts` Case 6 (D-19 exact-string lock) + Case 7 (D-20 `topMitigation.action` from MITIGATION_TABLE) |
| D-05 backward compatibility | `compat.test.ts` (Phase 12 surface + D-08 handoff) |

## Deviations from plan

1. **[Rule 1 — Bug in plan text] "Empty project" test cases corrected.** The plan said an empty project (`contracts: null`, no responses, no due date) yields `composite: 0`. In practice, `deriveContractClauses(null)` returns `[]`, which fires all five clause-gap signals (no_late_fee +10, no_kill_fee +8, no_payment_schedule +8, no_scope_clause +10, no_revision_cap +8) for composite ~16. To honor the test's intent (testing the green/zero baseline + the green/payment action lookup), the tests pass a `ContractAnalysis` whose `positive_notes` contains every locked clause token, so `deriveContractClauses` returns the full set and the dimensions are genuinely zero. The Task 1 done-criterion of `computeClientRisk({ defense_responses: [] }) → { score: 0, level: 'green', signals: [] }` is correspondingly tested in `compat.test.ts` with a project that has full clauses present.

2. **[Rule 1 — Bug in plan text] "Three payment_first sent responses cap at 15" with `5 × n` formula.** The plan's exact wording asked for "Two `payment_first` sent responses: `partial_payment_pressure` does NOT fire". The Plan 01 scorer threshold is `>= 2`, so 2 reminders DOES fire (10 points uncapped). The tests reflect actual scorer behavior: 1 → does not fire, 2 → fires at 10 points, 3 → fires at 15 points (cap). Documented in the test descriptions.

3. **[Rule 1 — Bug in plan text] Case 6 composite math.** The plan's narrative reached "force red/chargeback specifically: payment=80, scope=100, chargeback=100" but the payment scorer maxes at 66 (late_severe 25 + clause gaps 26 + partial_payment_pressure cap 15). The realistic red/chargeback construction used in the test is `payment=66, scope=34, chargeback=100`, giving composite=67 → red with chargeback top — locking the D-19 sentence as required.

4. **[Rule 1 — Bug in plan text] Case 4 exact 25/26/65/66 inputs.** Hitting these composite values exactly with the engine's discrete signal point set is impractical (payment max=66, no clean 65-point construction). The test instead asserts `levelFromScore` directly at 0, 25, 26, 65, 66, 100 (the canonical boundary helper exported from `lib/risk/weights.ts`), then validates that `computeRisk(...).level === levelFromScore(composite)` on a representative input — the same invariant by construction.

No auth gates encountered. No new dependencies added. No DB migrations.

## Known stubs

None.

## Threat flags

None — no new network endpoints, auth paths, or schema changes. All test fixtures are synthetic strings; no real client data in the repo.

## Self-Check: PASSED

- `lib/clientRisk.ts` modified and tracked (verified by `git status`)
- `tests/risk/{payment,scope,chargeback,orchestrator,compat}.test.ts` all exist on disk
- `npx tsc --noEmit` exits 0
- `npx vitest run tests/risk/` reports 5/5 files, 51/51 tests passing
- All seven Phase 12 exports remain in `lib/clientRisk.ts`
- D-19 sentence asserted verbatim in `tests/risk/orchestrator.test.ts`
