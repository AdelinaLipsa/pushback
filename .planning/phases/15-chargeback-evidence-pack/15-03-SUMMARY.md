# 15-03 — Five remaining pages + renderPack + golden snapshots

**Executed:** 2026-05-17
**Status:** Complete (uncommitted)

## Files created

| Path | Purpose |
|------|---------|
| `lib/dispute/templates/substitute.ts` | Shared `{name}` substitution helper (unknown keys preserved literally) |
| `lib/dispute/templates/format.ts` | Shared `formatDate` + `formatMoney` |
| `lib/dispute/templates/ContractExcerpt.tsx` | Page 2 — clauses + D-11 placeholder |
| `lib/dispute/templates/DeliveryTimeline.tsx` | Page 3 — sorted milestones |
| `lib/dispute/templates/CommunicationLog.tsx` | Page 4 — ISO-week grouped messages |
| `lib/dispute/templates/SignOffProofs.tsx` | Page 5 — pre-filtered sign-offs, 800-char cap |
| `lib/dispute/templates/PaymentRecord.tsx` | Page 6 — record or sparse-data placeholder |
| `lib/dispute/renderPack.tsx` | `PackDocument` JSX + `renderPack(data) → Buffer` |
| `tests/dispute/fixtures/{not_as_described,not_received,cancelled,unauthorized}.ts` | 4 deterministic PackData fixtures |
| `tests/dispute/golden.test.tsx` | 4 golden snapshot tests + `treeToJson` walker |
| `tests/dispute/__snapshots__/.gitkeep` + auto-generated `golden.test.tsx.snap` | Committed snapshot baseline |

## Refactored (no behavior change)

- `lib/dispute/templates/CoverLetter.tsx` — inline `substitute` / `formatDate` / `formatMoney` deleted, replaced with imports from `./substitute` + `./format`
- `lib/dispute/templates/SummaryStatement.tsx` — same refactor

## Composition order (D-05 locked)

`PackDocument` renders the 7 pages directly under one `<Document>` in this order:

1. CoverLetter
2. ContractExcerpt
3. DeliveryTimeline
4. CommunicationLog
5. SignOffProofs
6. PaymentRecord
7. SummaryStatement

`Document` metadata is derived from `PackData`: `title` = `Pushback Dispute Pack — {clientName}`, `author` = `user.businessName`, `subject` = `Dispute response: {disputeType}`, `creator` = `Pushback (https://pushback.to)`, `producer` = `@react-pdf/renderer`.

## Snapshot strategy

The test uses a small `treeToJson(node)` walker that recursively converts the React element tree into a plain JSON shape `{ type, props, children }`. Reasons we did NOT pick the alternatives:

- `react-dom/server.renderToString` → React-PDF host elements aren't DOM; the call either throws or returns garbage.
- `renderToBuffer` binary diff → the PDF embeds font-subset hashes that vary across `@react-pdf/renderer` patch versions, so byte-diffs would be flaky in CI.

The JSON walker:
- Returns strings/numbers as-is
- Maps `null` / `undefined` / `false` / `true` to `null` (React no-op nodes)
- For elements, captures `type` (string tag or component `displayName`/`name`), shallow-copies `props` excluding `children` and stripping function values, and recurses into children
- Does NOT invoke component functions — pins the JSX tree as authored, stable across React renderer changes

Snapshot file: `tests/dispute/__snapshots__/golden.test.tsx.snap` (committed).

## Fixtures

Each fixture exercises a different branch:

| Fixture | Currency | contractExcerpt.available | signOffs | paymentRecord.placeholder | Other |
|---|---|---|---|---|---|
| `not_as_described` | EUR | true (2 clauses) | 1 entry | false | baseline happy path |
| `not_received` | EUR | true (1 clause) | empty | false | exercises SignOffProofs empty path + 2 ISO weeks of messages |
| `cancelled` | USD | true (cancel + kill-fee clauses) | empty | **true** | exercises PaymentRecord sparse path + SummaryStatement's cancellation note |
| `unauthorized` | EUR | **false** | empty | false | exercises ContractExcerpt D-11 placeholder path |

`generatedAt` and every timestamp is a fixed ISO string. No `Date.now()`, no `new Date()` calls.

## Verification

```
npx tsc --noEmit                          →  exit 0
npx vitest run tests/dispute/             →  3 files, 20 tests passed (437ms)
  - clauses.test.ts:   6 cases
  - ranking.test.ts:  10 cases
  - golden.test.tsx:   4 cases (snapshots stable on re-run)
```

No `import.*anthropic`, no `fetch`, no Supabase client in any `lib/dispute/` file.

## Downstream pointer (Plan 15-04)

The API route imports a single function:

```typescript
import { renderPack } from '@/lib/dispute/renderPack'
```

…then returns the resulting `Buffer` directly:

```typescript
const pdfBuffer = await renderPack(packData)
return new Response(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="dispute-pack-${slug}.pdf"`,
    'Cache-Control': 'private, no-store',
  },
})
```

Runtime must be Node (not edge) since `renderToBuffer` returns a Node `Buffer`. The route handler also needs to call `assemblePackData(...)` first to convert the Supabase joined rows into `PackData`.
