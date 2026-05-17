# 15-01 — Dispute pack foundation

**Executed:** 2026-05-17
**Status:** Complete (uncommitted)

## Files created

| Path | Purpose |
|------|---------|
| `types/dispute.ts` | `DisputeType`, `ClauseExcerpt`, `ScoredMessage`, `PackData` |
| `types/index.ts` (edit) | Re-exports the four dispute types |
| `lib/dispute/vocab.ts` | `disputeVocab: Record<DisputeType, string[]>` — ~30 curated lowercase terms per dispute type |
| `lib/dispute/clauses.ts` | `extractClauses(text, type)` + `clauseKeywords` — keyword + paragraph-window extractor, deduped, 500-char truncated |
| `lib/dispute/ranking.ts` | `rankMessages(responses, type, project)` — deterministic TF-IDF + boosts |
| `lib/dispute/assemble.ts` | `assemblePackData(input) → PackData` — pure orchestrator |
| `tests/dispute/clauses.test.ts` | 6 vitest cases |
| `tests/dispute/ranking.test.ts` | 10 vitest cases |

## Algorithm notes

- **IDF formula:** smoothed log → `Math.log((N + 1) / (df + 1)) + 1`. Never zero, never negative, so a single-message corpus still produces positive scores when vocab matches.
- **Boost multipliers:** `was_sent` = ×1.5, `±7d window around payment_received_at` = ×1.3. Combined multiplicatively (×1.95) when both apply.
- **Cap:** 15 messages after sort. Ties broken by `created_at` descending.
- **Vocab indexing:** terms are wrapped in a `Set` once at the top of `rankMessages` so per-token vocab membership is O(1) — keeps the ≤300ms budget (D-21) comfortable.

## Case-reference sanitization

`sanitizeCaseRef` strips non-printable bytes (`/[^\x20-\x7E]/g`), trims, and caps at 80 chars. Empty after sanitization → `null`. Mitigates T-15-01 (control-character injection into PDF text).

## Contract availability rule (D-11)

`contractExcerpt.available` is `true` only when `extractClauses` returns at least one excerpt — i.e. contract text exists AND at least one keyword matched. Plan 02 renderer should branch on this flag to render the locked placeholder when `false`.

## Verification

```
npx vitest run tests/dispute/   →  2 files, 16 tests passed (232ms)
npx tsc --noEmit                →  exit 0
```

## Downstream pointers

- **Plan 15-02** — React-PDF templates consume `PackData` shape verbatim. Render the seven pages in this order: cover letter, contract excerpt (with locked placeholder when `contractExcerpt.available === false`), delivery timeline, ranked communication log (grouped by week in the renderer), sign-off proofs, payment record (with placeholder when `paymentRecord.placeholder === true`).
- **Plan 15-03** — PDF renderer composes the `<Document>`; golden snapshots should fix `now` via `assemblePackData({ ..., now: new Date('2026-01-01T00:00:00Z') })` for stable output.
- **Plan 15-04** — API route handler does the Supabase fetch (`projects` join `contracts` + `defense_responses`), then calls `assemblePackData(...)` and pipes into the renderer. `AssembleInput` is a plain object so route can map joined rows however it wants.
