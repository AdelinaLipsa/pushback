# Phase 4: Missing UI - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Four missing UI surfaces that complete CRUD management for projects and contracts, plus a pre-wall upgrade nudge:

1. **Project edit form** — inline edit form on the project detail page (UI-01)
2. **Project delete** — inline two-step confirmation on the project detail page (UI-02)
3. **Contract delete** — inline two-step confirmation on the contract detail page, plus Anthropic Files API cleanup (UI-03)
4. **Pre-wall upgrade nudge** — usage counter strip shown at 2/3 defense responses used (UI-04)

All four API routes already exist. This phase is entirely UI work except for one backend change: updating the contract DELETE route to also delete the stored Anthropic Files API PDF.

</domain>

<decisions>
## Implementation Decisions

### Project Edit Form (UI-01)

- **D-01:** Placement: inline on the project detail page (`app/(dashboard)/projects/[id]/page.tsx`). An Edit button in the header area toggles an in-place form. No new route, no dialog component.
- **D-02:** Fields exposed in the edit form: all editable fields — title, client_name, client_email, project_value, currency, status, notes. The PATCH API supports all of these; expose them all rather than a subset.
- **D-03:** Currency field uses the same `CURRENCIES` array as NewProjectForm.tsx (`['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF']`).
- **D-04:** On successful save: close the form, reflect updated values in the header immediately (optimistic or via router.refresh()). Show a toast via sonner on success.
- **D-05:** The edit form is a client component — existing project detail page is a Server Component, so extract the header + edit toggle into a `ProjectHeader` client component (or a dedicated `EditProjectForm` client component that renders inline).

### Project Delete (UI-02)

- **D-06:** Pattern: inline two-step. First click shows "Are you sure? This cannot be undone." with "Yes, delete" / "Cancel" replacing the delete button in-place. No dialog, no new dependencies.
- **D-07:** On confirm: call `DELETE /api/projects/[id]`, then `router.push('/projects')`. The Supabase cascade (`on delete cascade` on defense_responses) handles associated record cleanup at the DB level.
- **D-08:** Delete button placement: in the project detail page header, alongside the Edit button. Only visible/usable by the project owner (already enforced by the API's `eq('user_id', user.id)` check).

### Contract Delete (UI-03)

- **D-09:** Pattern: same inline two-step as project delete. First click shows confirmation; second click calls the API.
- **D-10:** Contract delete button placement: on the contract detail page (`app/(dashboard)/contracts/[id]/page.tsx`), in the header area near the back link.
- **D-11:** Backend change required: update `app/api/contracts/[id]/route.ts` DELETE handler to call `anthropic.beta.files.delete(contract.anthropic_file_id)` before the Supabase delete, using the `files-api-2025-04-14` beta header.
- **D-12:** Anthropic file delete is best-effort: if `anthropic_file_id` is null (text-upload contracts with no file) or if the Anthropic API call fails, log the error with `console.error` and continue with the Supabase delete. Do not fail the whole operation.
- **D-13:** After successful delete: `router.push('/contracts')`.

### Pre-Wall Upgrade Nudge (UI-04)

- **D-14:** Trigger: free user with `responsesUsed >= 2` AND `responsesUsed < FREE_LIMIT` (i.e., exactly at 2/3). The existing `isAtLimit` logic (at 3/3) is unchanged.
- **D-15:** UI: a slim strip/bar rendered above the defense tool grid in `DefenseDashboard`. It shows "2 of 3 responses used · Upgrade to Pro →". Clicking the link triggers the existing `handleUpgrade` checkout flow.
- **D-16:** The strip is NOT dismissible — it persists until the user upgrades or uses their last response (at which point the existing full-page UpgradePrompt takes over).
- **D-17:** Styling: amber-accented, consistent with `--brand-amber`. Small text, full-width, subtle — does not replace the tool grid, just sits above it.

### Claude's Discretion

- Exact inline styles for the edit form and delete confirmation states — follow existing CSS custom property patterns (`--bg-surface`, `--bg-border`, `--text-secondary`, etc.).
- Whether to use a single `ProjectActions` client component or separate `EditProjectForm` and `DeleteProjectButton` components — Claude decides based on what keeps the Server Component boundary clean.
- Exact copy for delete confirmation messages — follow the "This will permanently delete [entity] and all associated data" pattern.
- Exact copy for the upgrade strip — "2 of 3 responses used · Upgrade to Pro →" is the intent; Claude can adjust wording slightly for fit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to Modify
- `app/(dashboard)/projects/[id]/page.tsx` — Add inline edit form + delete confirmation (UI-01, UI-02). Currently a Server Component; a client component extraction will be needed for the interactive parts.
- `app/(dashboard)/contracts/[id]/page.tsx` — Add inline delete confirmation (UI-03).
- `app/api/contracts/[id]/route.ts` — Update DELETE handler to call Anthropic Files API before DB delete (D-11, D-12).
- `components/defense/DefenseDashboard.tsx` — Add `isNearLimit` check and usage counter strip above tool grid (UI-04).

### Files to Reference (do not modify)
- `components/project/NewProjectForm.tsx` — Field names, CURRENCIES array, input styles, form submission pattern to mirror for the edit form.
- `components/shared/UpgradePrompt.tsx` — `handleUpgrade` function pattern to reuse in the nudge strip's CTA.
- `app/api/projects/[id]/route.ts` — Confirms PATCH supports all fields in D-02; DELETE confirmed to cascade via Supabase.
- `app/api/contracts/analyze/route.ts` — Shows how `anthropic.beta.files.upload()` is called with the `files-api-2025-04-14` beta header; use same `as any` cast pattern for `anthropic.beta.files.delete()`.
- `supabase/migrations/001_initial.sql` — Confirms `contracts.anthropic_file_id text` column; confirms `defense_responses` has `on delete cascade` via `user_id` cascade chain.
- `.planning/codebase/STACK.md` — Next.js 16 async params, TypeScript version, component patterns.
- `.planning/codebase/CONVENTIONS.md` — Error response format, CSS custom property naming, import patterns.
- `node_modules/next/dist/docs/` — Next.js 16 specifics before touching any route/layout.

### No External API Docs Needed
- Anthropic Files API delete endpoint — use same pattern as the upload call in analyze/route.ts; method is `anthropic.beta.files.delete(file_id)` with the same beta header.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/project/NewProjectForm.tsx` — Complete form reference: field list, CURRENCIES array, input/label styles, submit pattern. The edit form mirrors this structure with pre-filled values.
- `components/shared/UpgradePrompt.tsx` — `handleUpgrade()` function (fetches `/api/checkout`, redirects to Stripe URL) — copy this pattern into the nudge strip's CTA button.
- `components/ui/button.tsx` — Available; use for action buttons in edit form and delete confirmation.
- `components/ui/sonner.tsx` — Toast available for save success feedback.
- `lib/anthropic.ts` — Exports `anthropic` client; use for `anthropic.beta.files.delete()` in the contract DELETE route.

### Established Patterns
- Server Components fetch data; Client Components handle interaction — the project detail page is a Server Component; interactive edit/delete elements need `'use client'` extraction.
- Inline dark styling via CSS custom properties: `--bg-surface`, `--bg-base`, `--bg-border`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--text-muted`, `--brand-amber`, `--brand-green`, `--urgency-high`.
- `Response.json({ error: '...' }, { status: N })` — consistent API error response format.
- `router.push('/projects')` after delete, `router.refresh()` after edit (established in Phase 1 defend flow).
- `as any` cast on Anthropic beta APIs — used in analyze/route.ts; acceptable and expected for Files API calls.
- Fire-and-forget with `console.error` for non-critical failures — established in Phase 3 email sending.

### Integration Points
- `DefenseDashboard` already receives `plan` and `responsesUsed` props from the project detail page — nudge strip only needs these same props, no new data fetching.
- Contract DELETE route at `app/api/contracts/[id]/route.ts` — minimal change: fetch `anthropic_file_id` from the contract record before deleting, call Anthropic delete, then proceed with Supabase delete regardless of outcome.
- The project delete API already cascades properly via Supabase (`defense_responses` references `projects` via `project_id`... actually via `user_id` cascade — verify the cascade chain in the migration before assuming).

</code_context>

<specifics>
## Specific Ideas

- Edit form toggle: an "Edit" button in the project detail header (next to the status badge) triggers the inline form. "Cancel" restores the read view without a page reload.
- Delete confirmation copy (project): "Delete this project? This will permanently delete all defense responses too."
- Delete confirmation copy (contract): "Delete this contract? The PDF stored with Anthropic will also be removed."
- Upgrade strip copy: "2 of 3 responses used · Upgrade to Pro →" (the arrow should link to checkout, not navigate to a page).
- Nudge strip color: amber border or amber left-accent bar to draw attention without being jarring.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-missing-ui*
*Context gathered: 2026-04-24*
