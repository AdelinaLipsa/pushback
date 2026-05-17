# 15-05 — Dispute Pack UI (Recovery card + Modal + Blob download)

**Executed:** 2026-05-17
**Status:** Complete locally — pending manual verification (Task 5 scenarios A-H) and single end-of-phase commit per user directive

## Files created

| Path | Purpose |
|------|---------|
| `components/project/DisputePackSection.tsx` | Recovery card on the project detail page — Pro shows modal trigger; free shows locked Stripe-checkout button |
| `components/project/DisputePackModal.tsx` | shadcn `Dialog` (same primitive as ProjectHeader's delete confirmation) wrapping the 4-option radio + case-reference input + Generate flow + blob download + inline error display |

## Files modified

| Path | Change |
|------|--------|
| `lib/api.ts` | Added `// ─── Dispute Pack ───` section between `// ─── Documents ───` and `// ─── Responses (fire-and-forget) ───`: exports `DisputePackResult` discriminated union + `generateDisputePack(projectId, body)` |
| `components/project/ProjectDetailClient.tsx` | One import + one JSX line — renders `<DisputePackSection project={project} plan={plan} />` between `ClientBehaviorCard` and the `#defense-dashboard` div in the Defend view only |

## `generateDisputePack` return-type discrimination

The helper differs from `generateDocument` because the success body is binary `application/pdf`, not JSON:

| Server outcome | Helper returns | Caller action |
|----------------|---------------|---------------|
| `200 application/pdf` | `{ blob, filename, upgradeRequired?: false }` | `triggerBlobDownload` + toast success + close modal |
| `403 PRO_REQUIRED` | `{ upgradeRequired: true }` | Inline error "Pro account required." (defensive — section already gates by plan) |
| `403 UPGRADE_REQUIRED` (quota) | `{ quotaExceeded: true }` | Inline error with D-18 copy ("You've used this month's response budget…") |
| Any other 4xx/5xx with JSON body | `null` (after `toast.error(data.error ?? fallback)`) | Inline echo "Pack generation failed — please try again." |
| Network failure / non-JSON error body | `null` (after `toast.error('Network error — check your connection.')`) | Same inline echo |

The success arm includes an optional `upgradeRequired?: false` discriminator so callers can use `if ('blob' in result)` without TypeScript complaining about the discriminator on the union members.

Filename is parsed from the server's `Content-Disposition: attachment; filename="..."` header via `/filename="([^"]+)"/.exec(cd)` and falls back to `dispute-pack-${dispute_type}.pdf` if the header is missing.

## shadcn Dialog conformance

The modal uses the project's existing `Dialog` primitive (`components/ui/dialog.tsx` wrapping `@base-ui/react/dialog`) — same primitive ProjectHeader uses for its delete confirmation. Knobs applied:

- `open={true}` — the component only mounts when `DisputePackSection` sets `open === true`, so it is always "open" from the Dialog's perspective.
- `onOpenChange={(o) => { if (!o && !generating) onClose() }}` — backdrop click + Escape close the modal, but **not** while a request is in flight (prevents orphan downloads).
- `showCloseButton={false}` — the footer's Cancel button is the close affordance (same idiom as ProjectHeader).
- `style={{ ...dialogContentStyle, maxWidth: '34rem' }}` — base 440px is too narrow for the 4-row radio group with descriptions; widened to 34rem.

No custom `<div role="dialog">` overlay. No hand-rolled focus trap. No `Escape` key handler — `@base-ui/react/dialog` handles both natively.

## Blob download mechanism

The DOM-touching `triggerBlobDownload(blob, filename)` helper lives module-private inside `DisputePackModal.tsx` (not in `lib/api.ts` — that file is intentionally DOM-free):

1. `const url = URL.createObjectURL(blob)`
2. `document.createElement('a')` → set `href = url`, `download = filename`
3. Append, click, remove
4. `setTimeout(() => URL.revokeObjectURL(url), 1500)` — deferred revocation so Safari and older browsers commit the download before the URL is invalidated

The 1.5s delay is the canonical pattern from MDN's "Programmatic file downloads" recipe; revoking synchronously after `.click()` causes intermittent failures on Safari.

## Recovery card placement

The card lives **only** in the `view === 'defend'` block of `ProjectDetailClient.tsx`, slotted between `<ClientBehaviorCard>` (which only renders when `risk.composite > 0`) and the `<div id="defense-dashboard">` wrapper. The Contract view and History view remain untouched. The component is `'use client'` (interaction state) and handles its own Pro/free branching internally — `ProjectDetailClient` passes `project` and `plan` and does no conditional gating at its layer.

## Modal accessibility

- `role="alert"` on the inline error region — screen readers announce PRO_REQUIRED / quotaExceeded / network failures as they appear
- Native `Escape` close via `@base-ui/react/dialog`
- `onOpenChange` guard blocks backdrop close + Escape during `generating`
- `aria-label="Compile dispute pack"` on Pro trigger; `aria-label="Pro feature — upgrade to unlock dispute packs"` on locked free trigger
- Each radio option's bold label + muted description render inside a single `<label>` so the entire row is the clickable hit area
- `<legend>` element semantically anchors the radio group to the "Dispute type" label for screen readers
- `<input maxLength={80}>` on the case-reference field is a UX hint; the Zod `.max(80)` on the server is the authoritative cap

## Build & type-check

```
npx tsc --noEmit  →  exit 0 (clean)
npm run build     →  exit 0 (dispute-pack route appears in the route manifest)
```

Plan files 15-01 through 15-04 produced working code in this same uncommitted state. Per user directive, all of Phase 15's work (Plans 01-05) commits together at the end of the phase after manual A-H verification, since `main` deploys to production on Vercel.

## Manual verification deferred

Task 5 is `checkpoint:human-verify` with scenarios A-H spanning:

- A: Pro happy path × 4 dispute types
- B: Case reference field
- C: Free user gating (UI + curl against the route)
- D: Pro user quota exhausted
- E: Empty / sparse projects
- F: Network failure
- G: Accessibility
- H: PDF visual sanity

These require a running `npm run dev` server and live database state; deferred to the user.

## v2 follow-ups

- "Recent packs" list on the project detail page — gated on revisiting D-17 (currently no DB write per phase decision)
- Auto-trigger when Phase 14's risk score crosses a chargeback threshold — wiring point exists in `computeRisk` output
- Per-tenant filename prefix for users who download many packs across projects
