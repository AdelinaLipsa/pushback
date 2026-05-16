# Phase 15: Chargeback Evidence Pack — Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

A freelancer facing or expecting a chargeback can click one button on a project detail page and download a Stripe/PayPal-format PDF evidence pack assembled from existing project data. The pack is real, downloadable, and visibly a tool output — not a generated text.

The pack contents are assembled by **deterministic algorithms only**: contract excerpt extraction is rule-based, communication-log ranking is TF-IDF-based, cover-letter language is template-merged with field substitution. **No LLM at runtime.** (An LLM-assisted "summary" paragraph in the cover letter is the only optional LLM use — and only as v2 enhancement, gated behind a feature flag.)

What is **NOT** in scope: direct submission to Stripe Dispute API (out-of-scope for v1 — manual upload), real-time chargeback notification (no webhook handler yet), proactive auto-assembly when risk crosses threshold (this is the integration point with Phase 14 but the actual auto-trigger is v2).

</domain>

<decisions>
## Implementation Decisions

### PDF generation stack
- **D-01:** Use **`@react-pdf/renderer`** (not PDFKit, not Puppeteer). Reasoning: React-component model matches codebase idioms, server-renderable, font/styling control, no headless-browser cost. Add as dependency.
- **D-02:** Templates live in `lib/dispute/templates/` as `.tsx` files exporting React-PDF components. One template per dispute type (D-08).
- **D-03:** PDF generation happens in a new API route `POST /api/projects/[id]/dispute-pack`. Returns the PDF binary with `Content-Disposition: attachment; filename=...`. No client-side PDF rendering.
- **D-04:** A4 size, embedded **`Helvetica`** font (default; no custom font loading — keeps the pack visually neutral and reduces deps). Single typography style across all templates.

### Pack contents — locked order
- **D-05:** Pack contents in this exact sequence (Stripe evidence-submission order):
  1. **Cover Letter** — 1 page. Addressed to issuer. Includes: case reference (from user input), transaction summary (date, amount, currency), statement of position (1 paragraph from template).
  2. **Contract Excerpt** — 1–2 pages. Highlighted clauses relevant to the dispute type (e.g., for `not_as_described` dispute: scope, deliverables, revision policy, acceptance). Pulled from `contracts.text` field, with relevant clause text extracted by regex matching against the contract analysis output's `clauses_present` keys.
  3. **Delivery Timeline** — 1 page. Chronological list of milestones with timestamps and sign-off status. Pulled from `projects.payment_due_date`, `payment_received_at`, and any `defense_responses` of type `delivery_signoff`.
  4. **Communication Log** — N pages (capped at 8). Ranked subset of `defense_responses.response` text + `responses.created_at` formatted as message log with date headers. Ranking per D-09.
  5. **Sign-Off Proofs** — 1 page. List of `defense_responses` where `tool_type === 'delivery_signoff'` AND `was_sent === true`. Includes message text + timestamp.
  6. **Payment Record** — 1 page. Project payment info from `projects.payment_amount`, `payment_received_at`. (No Stripe API integration in v1 — relies on what's in the DB.)
  7. **Summary Statement** — 1 page. Template-generated 4-paragraph closing argument. Field substitution from project + analysis. **No LLM** in v1.

### Dispute type taxonomy
- **D-06:** Four dispute types supported in v1:
  - `not_as_described` — most common, focus on scope+deliverables clauses
  - `not_received` — focus on delivery timeline + sign-offs
  - `cancelled` — focus on cancellation clause + work-completed evidence
  - `unauthorized` — focus on payment authorization records + correspondence
- **D-07:** User selects dispute type via a small radio-group modal when clicking "Compile Dispute Pack". No free-text input for dispute reason in v1.

### Message ranking algorithm
- **D-08:** Ranking is deterministic, TF-IDF based, no LLM. Algorithm:
  1. Build vocabulary from a **curated `disputeVocab` per dispute type** stored in `lib/dispute/vocab.ts`. Vocab is hand-built (~30 terms per type) — e.g., `not_as_described`: ["scope", "deliverable", "acceptance", "approved", "signed off", "agreed", "revision", "specification", ...].
  2. For each candidate message (any `defense_responses` row for the project), compute relevance = `sum(termFreq(term in message) * idf(term))` against the dispute-type vocab. Apply IDF over the message corpus of the project.
  3. Boost messages where `was_sent === true` (multiply score by 1.5).
  4. Boost messages within ±7 days of `payment_received_at` (multiply by 1.3).
  5. Cap selected messages at 15. Group by week.
- **D-09:** Algorithm lives in `lib/dispute/ranking.ts`. Pure function: `rankMessages(responses, disputeType, project) -> ScoredMessage[]`. Testable in isolation; golden-fixture tests.

### Contract clause excerpt extraction
- **D-10:** From `contracts.text` (the OCR'd contract text), extract clauses relevant to the dispute type using a **regex + keyword library** in `lib/dispute/clauses.ts`. For `not_as_described`: regexes for "scope of work", "deliverables", "acceptance", "approval", "revision". Output: array of `{ heading, paragraph }` snippets.
- **D-11:** If `contracts.text` is missing OR `contracts.analysis.clauses_present` is empty, the Contract Excerpt page renders a placeholder: "**Contract not analyzed** — upload via Pushback first to include clause excerpts." The pack is still generated; this section is just shorter.

### Cover-letter + summary templates
- **D-12:** Cover letter is a **React-PDF component with field substitution** — no LLM. Fields: `{client_name}`, `{transaction_date}`, `{transaction_amount}`, `{currency}`, `{user_business_name}`, `{user_email}`, `{case_reference}`. The "statement of position" paragraph is dispute-type-specific from a static template library.
- **D-13:** Summary Statement is a 4-paragraph template per dispute type, with field substitution from contract analysis output (clauses present/absent) and project data (milestones, payments, sign-offs). Templates live in `lib/dispute/templates/summary/{disputeType}.tsx`.

### UI surface
- **D-14:** New button: **"Compile Dispute Pack"** on the project detail page (`app/(dashboard)/projects/[id]/page.tsx`). Lives in a new "Recovery" section card alongside existing payment + defense tools. Button opens a small modal with: dispute type radio group, case reference input (optional), generate button.
- **D-15:** On click, calls `POST /api/projects/[id]/dispute-pack` with `{ dispute_type, case_reference? }`. Response: PDF binary. Client triggers a browser download via blob URL.
- **D-16:** Pro-only feature. Free users see the button greyed out with the existing UpgradePrompt pattern.

### Existing DB integration
- **D-17:** No new DB tables. No migrations. All reads from existing `projects`, `contracts`, `defense_responses`. Pack generation does not write anything (no audit log in v1; revisit in v2 if needed for "how many packs have you generated" metrics).
- **D-18:** RPC gate: pack generation counts as 1 unit against the user's `defense_responses` quota for Pro users (per existing plan gating). This means Pro's "50 contract analyses + 10 defense responses" budget covers ~10 dispute packs / month. Adjust the message in the modal: "Uses 1 of your monthly responses."

### Testing strategy
- **D-19:** Golden-snapshot tests for PDF output: render a pack from fixture project + responses + contract, write the binary to `tests/dispute/__snapshots__/`, diff on CI via byte-comparison OR pixel-diff of rendered first page (Vitest doesn't ship a PDF snapshotter — planner picks between byte-diff and a lightweight image-diff lib). Locked: tests must exist and cover at least the 4 dispute types with one realistic fixture each.
- **D-20:** Ranking algorithm tests in `tests/dispute/ranking.test.ts` — table-driven with synthetic message corpora.

### Performance
- **D-21:** Pack generation must complete in <10s end-to-end (Success Criteria #1). React-PDF is fast; the bottleneck will be ranking + clause extraction. Budget: ranking ≤300ms, clause extraction ≤200ms, PDF render ≤2s. Plenty of headroom.
- **D-22:** Generation runs on the standard Vercel function timeout (300s default per the env). No special config needed.

### Why no LLM at runtime — locked
- **D-23:** Same reasoning as Phase 14. Determinism + auditability. A user (or their lawyer) must be able to inspect why a particular message was included. TF-IDF ranking is inspectable; LLM ranking is not. The whole point of the pack is **evidence** — it must be defensible and reproducible. The pack is generated from data the user owns; nothing is "made up" by an LLM. v2 may add an optional LLM-paraphrased summary paragraph, gated behind an opt-in flag.

</decisions>

<claudes-discretion>
## Claude's Discretion (planner free to decide)

- Exact font/embed strategy in React-PDF (Helvetica is locked; weight/size scale is planner's call)
- Whether to put the modal in `components/project/DisputePackModal.tsx` or co-locate with the page — pick whatever matches existing modal conventions
- Plan-file count — expect ~5 plans (1) lib types + ranking + clauses, (2) cover-letter + summary templates, (3) PDF renderer composition, (4) API route + RPC gate, (5) UI modal + button wiring
- Whether to include payment-record details in the Payment Record page if the data is sparse (fall back to a placeholder if `payment_received_at` is null)
- Test approach for the PDF snapshot — byte-diff vs pixel-diff vs JSON-of-component-tree — pick whichever is most maintainable

</claudes-discretion>

<phase-14-relation>
## Relation to Phase 14

Phase 14's `RiskResult.dimensions.chargeback.score` is the trigger signal. Phase 15 v1 does not consume this trigger automatically — the user clicks the button. v2 wires the chargeback score crossing 66 (red) into a `Recovery > Active alerts` insight card on the dashboard with one-click pack generation. This v2 wiring is mentioned in the plan but not built.

</phase-14-relation>
