# 15-02 — Cover Letter + Summary Statement templates

**Executed:** 2026-05-17
**Status:** Complete (uncommitted)

## Files created

| Path | Purpose |
|------|---------|
| `lib/dispute/templates/styles.ts` | Shared React-PDF `StyleSheet` + `PAGE_SIZE = 'A4'` |
| `lib/dispute/templates/copy.ts` | `coverLetterTemplates` (1 paragraph × 4 types) + `summaryTemplates` (4-tuple × 4 types) |
| `lib/dispute/templates/CoverLetter.tsx` | Page 1 — title, From/Re/Case Ref, transaction summary, statement of position, contents, footer |
| `lib/dispute/templates/SummaryStatement.tsx` | Page 7 — 4-paragraph closing per dispute type + derived hints |

## Dependency

- **Installed:** `@react-pdf/renderer@^4.5.1` (maintainer: `diegomura`, canonical React-PDF team)
- Approved via blocking-human checkpoint
- No fonts registered — relies on built-in Helvetica / Helvetica-Bold / Courier per D-04

## Typography scale (locked)

- Body: Helvetica 11pt, line-height 1.45, color `#111111`
- Page title: Helvetica-Bold 18pt
- Section title: Helvetica-Bold 12pt
- Meta label: Helvetica-Bold 10pt (110pt fixed width)
- Mono block: Courier 9.5pt on `#f4f4f4`
- Footer: 8pt centered, repeated on every page via `fixed` prop

Plan 03 composes all 7 pages inside one `<Document>` using this same `styles` object — no per-page overrides expected.

## Field substitution

`substitute(template, vars)` matches `{name}` placeholders. Unknown keys are preserved as literal `{name}` so typos surface in golden snapshots rather than crash the render. Both components ship their own `substitute` copy (intentional duplication — tiny function, no shared module needed yet).

CoverLetter vars: `clientName`, `transactionDate`, `transactionAmount`.
SummaryStatement vars: `clientName`, `messageCount`, `transactionSummary`, plus three derived notes (`revisionsNote`, `signOffNote`, `cancellationClauseNote`) that produce contextual sentences or empty strings depending on PackData content. The `\s+` collapse after substitution prevents double-spaces from empty notes.

## Verification

```
grep -c "@react-pdf/renderer" package.json  →  2 (deps + lock)
npx tsc --noEmit                            →  exit 0
```

No `import.*anthropic`, no `fetch`, no Supabase client in any of the four new files.

## Downstream pointers

- **Plan 15-03** — Build `DisputePackDocument.tsx` that composes `<Document>{<CoverLetter />, <ContractExcerpt />, <DeliveryTimeline />, <CommunicationLog />, <SignOffProofs />, <PaymentRecord />, <SummaryStatement />}</Document>`. Five new page components needed; can mirror the substitute + `Page size={PAGE_SIZE} style={styles.page}` shape from this plan.
- **Plan 15-03** — Add golden-snapshot test that calls `assemblePackData({ now: fixed })` then renders the Document — pin the rendered XML/PDF buffer hash.
- **Plan 15-04** — API route handler: `POST /api/projects/[id]/dispute-pack`. Use `@react-pdf/renderer`'s `renderToStream` (Node) and pipe to the response with `Content-Type: application/pdf` + `Content-Disposition: attachment`.
