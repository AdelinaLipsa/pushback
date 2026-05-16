# Phase 14: Risk Engine — Deterministic Multi-Dimensional Scoring — Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the simple aggregate `computeClientRisk` from Phase 12 (`lib/clientRisk.ts`) with a deterministic, auditable, multi-dimensional risk engine. The engine scores each client/project across three independent dimensions — **PaymentRisk**, **ScopeRisk**, **ChargebackRisk** — each computed from at least three independent signals already present in the DB. A composite score (weighted average) plus a per-dimension breakdown is the output. The whole engine is **LLM-free at runtime**: the same inputs always yield the same score.

Phase 12 leaves the dashboard and badge UI surfaces in place. Phase 14 keeps those surfaces but rewires them to the new engine. The Phase 12 `computeClientRisk` becomes a thin compatibility shim that delegates to the new engine; existing consumers (`ProjectCard`, `ClientBehaviorCard`, dashboard "Needs Attention") continue to work.

What is **NOT** in scope: external data sources (Companies House, public Stripe issuer signals), the Phase 15 Chargeback Evidence Pack (which consumes the chargeback score as a trigger), and any LLM-based "narrative explanation" of why a score moved (optional v3 addition).

</domain>

<decisions>
## Implementation Decisions

### Engine architecture
- **D-01:** The engine is split into per-dimension scorer modules under `lib/risk/`. Each scorer is a **pure function** taking a typed input bundle and returning `{ score: number, signals: RiskSignal[] }`. No DB access inside scorers — the orchestrator fetches data and passes typed bundles in.
- **D-02:** File layout is locked: `lib/risk/index.ts` (public API + `computeRisk`), `lib/risk/payment.ts`, `lib/risk/scope.ts`, `lib/risk/chargeback.ts`, `lib/risk/types.ts`, `lib/risk/weights.ts`. The orchestrator lives in `lib/risk/index.ts`.
- **D-03:** No new DB tables, no new migrations. All signals derive from existing tables: `projects`, `defense_responses`, `contracts`, `reply_threads` (when Phase 999.1 ships). The engine is read-only at the DB layer.
- **D-04:** Compute on-demand server-side. No background job, no caching table. If perf becomes an issue (>50ms per client at 100 clients), we add a per-request memo in v2 — not a persistent cache.
- **D-05:** `lib/clientRisk.ts` from Phase 12 is preserved as a thin re-export: `export { computeRisk as computeClientRisk } from './risk'` with a type adapter. Phase 12 consumers do not change. New consumers import from `lib/risk` directly.

### Output shape
- **D-06:** The public output type is locked:
  ```ts
  type RiskResult = {
    composite: number              // 0–100
    level: 'green' | 'amber' | 'red'
    nextAction: string             // recommended action sentence, deterministic
    dimensions: {
      payment: { score: number, signals: RiskSignal[] }
      scope:   { score: number, signals: RiskSignal[] }
      chargeback: { score: number, signals: RiskSignal[] }
    }
    topMitigation: { dimension: 'payment' | 'scope' | 'chargeback', action: string, deltaPoints: number } | null
  }
  type RiskSignal = { code: string, label: string, points: number, source: 'projects' | 'responses' | 'contracts' }
  ```
- **D-07:** Composite weights default to **payment 40 / scope 30 / chargeback 30**, lockable via `lib/risk/weights.ts`. Weights are constants — not user-configurable in v1.
- **D-08:** Level thresholds: 0–25 green, 26–65 amber, 66–100 red. (Phase 12 used 0–25 / 26–60 / 61+ — we shift to 65/66 for cleaner thirds. Phase 12 compatibility shim handles the boundary.)
- **D-09:** `signals` arrays are append-only — each signal carries the points it contributed, so the dashboard can render a per-signal evidence table. **This is the auditability requirement** (Success Criteria #4) — never hide which signal pushed a score up.

### PaymentRisk dimension
- **D-10:** Inputs: `payment_due_date`, `payment_received_at`, `project_value`, contract presence (`contract_id`), and contract clause coverage from `contracts.analysis` if present. Compute:
  - `daysLate` = days between `payment_due_date` and `payment_received_at` (or today if unpaid); negative = on-time.
  - Signals: `late_severe` (>14d late: +25), `late_moderate` (1–14d: +12), `late_minor` (0–1d: +4), `on_time` (-10 if `daysLate <= 0`).
  - Contract gaps: `no_late_fee_clause` (+10), `no_kill_fee_clause` (+8), `no_payment_schedule` (+8). Read from `contracts.analysis.clauses_present` array.
  - Partial-payment frequency from `defense_responses` count of `payment_first`/`payment_second`/`payment_final` sent to the same client.
- **D-11:** Final score clipped to `[0, 100]`. Negative scores after on-time bonus are floored to 0 before being added back into the composite.

### ScopeRisk dimension
- **D-12:** Inputs: `defense_responses` rows where `tool_type ∈ { scope_change, revision_limit, moving_goalposts, post_handoff_request, spec_work_pressure }`, plus contract clause coverage for scope-protective clauses.
- **D-13:** Signals:
  - `scope_change_sent` (+8 per sent response, capped at 32)
  - `revision_pressure_sent` (+6 per sent `revision_limit`, capped at 18)
  - `goalpost_shift_sent` (+12 per sent `moving_goalposts`, capped at 24)
  - `post_handoff_request_sent` (+10 per sent `post_handoff_request`, capped at 20)
  - `no_scope_clause` (+10 if `contracts.analysis.clauses_present` does not include `scope`)
  - `no_revision_cap` (+8 if not in clauses)
- **D-14:** `defense_responses.was_sent === true` is required for a signal to count. Drafted-but-not-sent responses do not contribute (consistent with Phase 12 D-05).

### ChargebackRisk dimension
- **D-15:** Inputs: `defense_responses` of type `chargeback_threat`, `dispute_response`, `review_threat`, `ghost_client`. Plus contract sign-off presence (D-22 from Phase 12 — sign-off proxy: presence of `delivery_signoff` tool use means a sign-off exists). Plus days since last `defense_responses.created_at` to that client (silence detector).
- **D-16:** Signals:
  - `chargeback_threat_sent` (+30 per response, capped at 60 — this is the strongest single signal)
  - `dispute_response_sent` (+18 per response, capped at 36)
  - `review_threat_sent` (+20 per response, capped at 40)
  - `silence_14d` (+15 if no message in 14+ days AND there is an unpaid invoice)
  - `no_signoff_on_delivery` (+18 if any sent defense response in last 30 days and zero `delivery_signoff` responses)
- **D-17:** Cap chargeback at 100; no on-time bonus applies.

### Composite + next action
- **D-18:** `composite = clamp(0.4*payment + 0.3*scope + 0.3*chargeback, 0, 100)`. No square-rooting, no exponential weighting — boring math by design.
- **D-19:** `nextAction` is generated from a **static decision table** in `lib/risk/actions.ts`, NOT from an LLM. The table is keyed on `(level, topDimension)` and emits a sentence. Example: `(red, chargeback)` → "Compile a dispute evidence pack now — see Phase 15 trigger." The phrasing is locked for v1; future variants are a copy-only change.
- **D-20:** `topMitigation` is computed by simulating "if I removed the top-contributing signal in the top dimension, how much would composite drop?" The orchestrator iterates signals in the top dimension, finds the one with the highest `points`, names the recommended counter-action from a static mitigation table in `lib/risk/mitigations.ts`. **Deterministic — no LLM.**

### UI surface
- **D-21:** Three UI surfaces touched:
  1. Existing `ProjectCard` badge — switches to render the new `composite` and `level`. Visual unchanged (per Phase 12 D-04 pill style).
  2. Existing `ClientBehaviorCard` on project detail — expanded to show per-dimension scores as three stacked horizontal bars (payment / scope / chargeback) with the composite at the top. Per-signal evidence list below.
  3. New: dashboard "Top Risk" insight card replacing the simple Phase 12 risk row. Shows top 3 clients by composite score with their level pill + `nextAction` sentence.
- **D-22:** No new pages, no new routes. The `nextAction` is text — clicking it does nothing in v1 (no deep-link to a tool). v2 adds deep-link to the recommended defense tool with pre-filled context.

### Auditability — locked
- **D-23:** Per-signal breakdown view is **required** (Success Criteria #4). On the project detail page, below the dimension bars, render a table: `Signal | Source | Points`. The table renders the `signals` arrays from the engine output directly — no client-side recomputation.

### Performance budget
- **D-24:** Engine compute must complete in <50ms per project at typical data volumes (≤50 sent defense responses per project). No async, no network calls. Pure CPU.
- **D-25:** Top-risk dashboard insight computes risk for all active projects of the user (typically ≤30). At a budget of 50ms/project, total <1.5s — acceptable for the dashboard server component. If projects grow beyond 100, planner should add a `Promise.all`-style parallelism note (still pure CPU per call, so parallelism is hollow — the real fix would be caching).

### Why no LLM at runtime — locked
- **D-26:** The whole pitch of this engine is auditability + reproducibility + compounding calibration. Putting an LLM at the core breaks all three:
  - Reproducibility: same input must yield same score. LLMs are stochastic.
  - Auditability: a user must see which signal caused the score. LLM outputs are not signal-attributable.
  - Compounding calibration: with more clients over time, weights can be tuned with data. LLM weights are opaque.
  - Future optional: an LLM-based "narrative explanation" of why a score moved (e.g., "Score jumped 18 points because the client missed two consecutive payment dates and the contract lacks a late-fee clause"). This is post-computation, descriptive only. **Not in v1.**

</decisions>

<claudes-discretion>
## Claude's Discretion (planner free to decide)

- Exact phrasing of the `nextAction` and `topMitigation` strings (subject to: must be deterministic, no LLM)
- Whether to add a `lib/risk/cache.ts` per-request memo (skip in MVP unless a perf test fails)
- Whether to derive partial-payment frequency from `defense_responses` (D-10) or skip in MVP if the signal correlation is weak — fall back to days-late only if dropped
- How many plan files (NN-PLAN.md) to split the work across — but expect ~4 plans: 1) types + scorers, 2) orchestrator + actions + mitigations tables, 3) UI rewire, 4) per-signal evidence view
- Whether tests live in `tests/risk/` (preferred) or co-located `lib/risk/*.test.ts` — pick whichever matches existing codebase convention (check `tests/` and `lib/` first)

</claudes-discretion>

<phase-12-relation>
## Relation to Phase 12

Phase 12 shipped a simpler `computeClientRisk` aggregate. Phase 14 supersedes it but does not delete it — `lib/clientRisk.ts` becomes a compatibility shim. Phase 12 success criteria still hold; Phase 14 adds:
- Three independent dimensions instead of one composite-only number
- Per-dimension signals (auditability)
- Deterministic `nextAction` + `topMitigation`
- Wider input set: scope tools, chargeback tools, contract clause coverage

If the planner finds Phase 12 code patterns that are reusable (e.g., `RISK_COLORS` constant, `RiskLevel` type), reuse them rather than reinventing.

</phase-12-relation>
