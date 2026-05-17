# 15-04 — POST /api/projects/[id]/dispute-pack

**Executed:** 2026-05-17
**Status:** Complete (uncommitted)

## Files created

| Path | Purpose |
|------|---------|
| `app/api/projects/[id]/dispute-pack/route.ts` | POST handler with full security stack + binary PDF response |
| `tests/api/dispute-pack.test.ts` | 9 vitest cases covering every gate path |

## Gate sequence (locked)

1. **`await params`** — destructure `id` from the Next.js 16 params Promise
2. **Auth** — `supabase.auth.getUser()` → 401 `{ error: 'Unauthorized' }` on missing session
3. **Pro gate** — `user_profiles.plan !== 'pro'` → 403 `{ error: 'PRO_REQUIRED' }` BEFORE any quota cost (free users do not consume rate-limit budget)
4. **Rate limit** — `checkRateLimit(defendRateLimit, user.id)` returns a 429 response when limited
5. **RPC quota gate** — `check_and_increment_defense_responses(uid)` → 403 `{ error: gate?.reason ?? 'UPGRADE_REQUIRED' }` on denial
6. **Zod validate** — `dispute_type` ∈ 4 D-06 values + optional `case_reference ≤ 80 chars` → 400 `{ error: 'field: message' }` + decrement
7. **IDOR-safe fetch** — `projects` joined with `contracts(id, contract_text, analysis)` + `defense_responses(...)`, chained `.eq('id', id).eq('user_id', user.id).single()` → 404 + decrement on miss
8. **Normalize contracts** — `Array.isArray(project.contracts) ? project.contracts[0] ?? null : project.contracts ?? null` (mirrors document route's handling)
9. **Build PackData** — `assemblePackData({ ... })` with `clausesPresent: contractRow.analysis?.clauses_present ?? null`
10. **Render** — inner try/catch wraps `await renderPack(packData)`; throw OR empty buffer → 500 + decrement
11. **Respond** — `new Response(pdfBuffer, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="..."', 'Content-Length': '...', 'Cache-Control': 'private, no-store' } })`

Every post-RPC failure path calls `decrement_defense_responses` so credit isn't consumed on failure.

## `safeFilename(disputeType, projectTitle)`

Character whitelist `[A-Za-z0-9- ]` → whitespace collapsed to `-` → sliced to 40 chars → lowercased → `'project'` fallback if empty. Date stamp is `new Date().toISOString().slice(0, 10)` (`YYYY-MM-DD`).

Pattern: `dispute-pack-{type}-{slug}-{YYYY-MM-DD}.pdf`

Mitigates T-15-22 (Content-Disposition `"..."` quote-escape) — all unsafe characters are pre-stripped at the boundary.

## Runtime

- `export const maxDuration = 30` (matches the document route; comfortably above the D-21 ≤10s budget)
- **Node runtime** (default) — `@react-pdf/renderer.renderToBuffer` needs Node `Buffer` + streams. NOT edge.

## Test cases (9)

1. 401 unauthenticated
2. 403 PRO_REQUIRED (free user)
3. 403 UPGRADE_REQUIRED (RPC denied)
4. 404 project not owned (IDOR safe)
5. 400 invalid `dispute_type`
6. 400 `case_reference > 80 chars`
7. 200 success — verifies `content-type: application/pdf` + attachment `Content-Disposition`
8. 500 + decrement when `renderPack` throws — verifies `mock.rpc('decrement_defense_responses', { uid: 'user-1' })` was called
9. All four D-06 `dispute_type` values accepted

`renderPack` is mocked (returns `Buffer.from('%PDF-1.4 mock')`) — tests never invoke the real React-PDF renderer. The mock buffer just needs `byteLength > 0` so the empty-buffer guard does not fire.

## Verification

```
npx tsc --noEmit                                          →  exit 0
npx vitest run tests/dispute tests/api/dispute-pack.test  →  4 files, 29 tests passed (462ms)
```

Pre-existing failures in `tests/api/{reply,stripe-webhook,defend}.test.ts` are unrelated — none of those files were modified by Phase 15.

## Downstream pointer (Plan 15-05)

The UI modal POSTs to this endpoint and downloads the body via a blob URL:

```typescript
const res = await fetch(`/api/projects/${projectId}/dispute-pack`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dispute_type, case_reference }),
})

if (!res.ok) {
  const { error } = await res.json()
  if (error === 'PRO_REQUIRED') /* show upgrade prompt */
  else if (error === 'UPGRADE_REQUIRED') /* show quota-exhausted prompt */
  else /* generic error toast */
  return
}

const blob = await res.blob()
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'dispute-pack.pdf'
a.click()
URL.revokeObjectURL(url)
```

`PRO_REQUIRED` and `UPGRADE_REQUIRED` are distinct error codes — the UI discriminates on them to route users to Stripe checkout vs the upgrade prompt.
