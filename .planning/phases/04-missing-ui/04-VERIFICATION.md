---
phase: 04-missing-ui
verified: 2026-04-24T12:30:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open a project page as a free user with responsesUsed=2 — verify lime-accented nudge strip appears above the tool grid with '2 of 3 responses used' left and 'Upgrade to Pro →' right"
    expected: "Strip renders with var(--brand-lime) left border and CTA color; strip is non-dismissible; clicking 'Upgrade to Pro →' initiates checkout flow"
    why_human: "Visual rendering and checkout redirect require a running browser with an authenticated free-tier user session"
  - test: "Open a project page and click Edit — verify inline form appears pre-filled with current project data; save a change and verify the read view updates and toast 'Project updated' fires"
    expected: "Form replaces read view; all 7 fields (title, client_name, client_email, project_value, currency, status, notes) are pre-filled; focus rings turn lime on focus; save calls PATCH, closes form, refreshes, shows toast"
    why_human: "Interactive state transitions (IDLE ↔ EDITING), focus ring behavior, and toast notification require browser interaction"
  - test: "Click 'Delete project' on a project — confirm dialog appears; click 'Yes, delete' and verify project and all defense responses are removed, then redirect to /projects"
    expected: "Confirmation dialog shows; after confirm, project row deleted, defense_responses cascade-deleted, browser navigates to /projects"
    why_human: "End-to-end delete flow including DB cascade and redirect requires a live browser session and database"
  - test: "Click 'Delete contract' on a contract detail page — confirm dialog appears; click 'Yes, delete' and verify contract record is removed (Anthropic file cleanup attempted best-effort)"
    expected: "Dialog shows 'Delete this contract? The PDF stored with Anthropic will also be removed.' After confirm, redirects to /contracts"
    why_human: "Anthropic Files API cleanup and Supabase delete require a live environment with ANTHROPIC_API_KEY set"
---

# Phase 4: Missing UI Verification Report

**Phase Goal:** Users can manage their projects and contracts fully — edit, delete, and see upgrade prompts before hitting the hard paywall
**Verified:** 2026-04-24T12:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A user on the project detail page sees the project title, client meta, status badge, an Edit button, and a Delete project button | VERIFIED | `ProjectHeader.tsx` lines 88-127: read view renders all elements; wired into `app/(dashboard)/projects/[id]/page.tsx` line 39 |
| 2 | Clicking Edit replaces the read-only header with an inline form pre-filled with all project fields | VERIFIED | `useState(editing)` toggle at lines 28, 88, 130; form state initialized from `project.*` props at lines 34-42 |
| 3 | The edit form exposes all editable fields: title, client_name, client_email, project_value, currency, status, notes | VERIFIED | All 7 fields present at lines 141-243 in `ProjectHeader.tsx` with correct input types and CURRENCIES/STATUS_OPTIONS constants |
| 4 | Saving changes calls PATCH /api/projects/[id], closes the form, refreshes server data, and shows a sonner toast 'Project updated' | VERIFIED | `handleSave` at lines 48-69: `method: 'PATCH'`, `setEditing(false)`, `router.refresh()`, `toast('Project updated')` all present |
| 5 | Clicking Cancel on the edit form restores the read view without a page reload | VERIFIED | `onClick={() => setEditing(false)}` at line 239 |
| 6 | Clicking Delete project opens a Dialog confirmation — confirming calls DELETE /api/projects/[id] then redirects to /projects | VERIFIED | `handleDelete` at lines 71-83: `method: 'DELETE'` fetch, `router.push('/projects')`; Dialog open controlled by `deleteDialogOpen` state |
| 7 | API errors on both save and delete open an error Dialog variant | VERIFIED | `setErrorDialogOpen(true)` on save error (line 63); `setErrorDialogOpen(true)` on delete error (line 79) |
| 8 | A user on the contract detail page sees a Delete contract button — clicking opens a Dialog, confirming calls DELETE /api/contracts/[id] | VERIFIED | `ContractDeleteButton.tsx` wired at `app/(dashboard)/contracts/[id]/page.tsx` line 35; `handleDelete` calls DELETE, error swaps dialog |
| 9 | DELETE /api/contracts/[id] fetches anthropic_file_id, best-effort deletes Anthropic file, then deletes Supabase row | VERIFIED | `app/api/contracts/[id]/route.ts` lines 27-53: SELECT `anthropic_file_id`, try/catch `anthropic.beta.files.delete`, then Supabase delete |
| 10 | A free user who has used 2 of 3 responses sees a lime-accented nudge strip above the tool grid | VERIFIED | `DefenseDashboard.tsx` lines 28, 117-150: `isNearLimit = plan === 'free' && responsesUsed >= 2 && responsesUsed < FREE_LIMIT`; strip renders with `borderLeft: '3px solid var(--brand-lime)'` |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/ui/dialog.tsx` | shadcn Dialog primitives | VERIFIED | 161 lines; exports Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogOverlay, DialogPortal, DialogTrigger; wraps @base-ui/react/dialog |
| `lib/ui.ts` | Shared inline-style constants | VERIFIED | 73 lines; exports btnStyles (primary/ghost/outline/destructive), inputStyle, labelStyle, dialogContentStyle; btnStyles.primary uses `var(--brand-lime)` |
| `app/globals.css` | `--brand-lime: #84cc16` in :root | VERIFIED | `grep "brand-lime"` returns `--brand-lime: #84cc16;` |
| `components/contract/ContractDeleteButton.tsx` | Client component with Dialog confirmation, error swap | VERIFIED | 105 lines; `'use client'` line 1; dialogOpen + isError state machine; imports from `@/lib/ui`; DELETE fetch + router.push('/contracts') |
| `app/api/contracts/[id]/route.ts` | DELETE handler with Anthropic file cleanup | VERIFIED | SELECT anthropic_file_id before DELETE; best-effort try/catch `anthropic.beta.files.delete`; ownership enforced via `eq('user_id', user.id)` on both queries |
| `app/(dashboard)/contracts/[id]/page.tsx` | Renders ContractDeleteButton with contractId prop | VERIFIED | Lines 5, 35: `import ContractDeleteButton`; `<ContractDeleteButton contractId={contract.id} />` |
| `components/project/ProjectHeader.tsx` | Client component with IDLE/EDITING toggle, inline form, delete Dialog, error Dialog | VERIFIED | 293 lines; `'use client'` line 1; all 7 edit fields; CURRENCIES and STATUS_OPTIONS constants; lime focus rings (7 occurrences of `var(--brand-lime)`); all state machines present |
| `app/(dashboard)/projects/[id]/page.tsx` | Server Component that passes project as prop to ProjectHeader | VERIFIED | No `'use client'`; line 5 imports ProjectHeader; line 39 `<ProjectHeader project={project} />`; contract strip, DefenseDashboard, history link preserved |
| `components/defense/DefenseDashboard.tsx` | Modified with isNearLimit nudge strip | VERIFIED | Lines 24, 28, 30-39, 117-150: upgradeLoading state, isNearLimit constant, handleUpgrade function, nudge strip JSX between intro block and tool grid |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ProjectHeader.tsx` | `PATCH /api/projects/[id]` | `handleSave` fetch on form submit | WIRED | Line 51-57: `fetch('/api/projects/${project.id}', { method: 'PATCH', ... })` |
| `ProjectHeader.tsx` | `DELETE /api/projects/[id]` | `handleDelete` fetch on dialog confirm | WIRED | Line 73: `fetch('/api/projects/${project.id}', { method: 'DELETE' })` |
| `app/(dashboard)/projects/[id]/page.tsx` | `ProjectHeader.tsx` | import and render with project prop | WIRED | Lines 5, 39: import + `<ProjectHeader project={project} />` |
| `ContractDeleteButton.tsx` | `DELETE /api/contracts/[id]` | fetch call on confirm | WIRED | Line 21: `fetch('/api/contracts/${contractId}', { method: 'DELETE' })` |
| `app/api/contracts/[id]/route.ts` | `anthropic.beta.files.delete` | best-effort try/catch | WIRED | Lines 39-48: `(anthropic.beta.files as any).delete(contract.anthropic_file_id, ...)` |
| `app/(dashboard)/contracts/[id]/page.tsx` | `ContractDeleteButton.tsx` | import and render with contractId prop | WIRED | Lines 5, 35: import + `<ContractDeleteButton contractId={contract.id} />` |
| `DefenseDashboard.tsx` nudge strip | `POST /api/checkout` | `handleUpgrade` fetch + `window.location.href` | WIRED | Lines 31-38: `fetch('/api/checkout', { method: 'POST' })` → `window.location.href = data.url` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ProjectHeader.tsx` | `project` (all fields) | Server Component passes `project` from Supabase query with `eq('user_id', user.id)` | Yes — DB query in `projects/[id]/page.tsx` lines 15-20 | FLOWING |
| `ContractDeleteButton.tsx` | `contractId` | Server Component passes `contract.id` from Supabase query | Yes — DB query in `contracts/[id]/page.tsx` lines 14-19 | FLOWING |
| `DefenseDashboard.tsx` | `plan`, `responsesUsed` | Server Component passes `p?.plan`, `p?.defense_responses_used` from `user_profiles` query | Yes — DB query in `projects/[id]/page.tsx` line 21 | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (no runnable entry points without environment variables — ANTHROPIC_API_KEY and SUPABASE credentials required for server startup)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UI-01 | 04-03-PLAN.md | User can edit an existing project (title, client name, project value, situation context) | SATISFIED | `ProjectHeader.tsx` inline edit form with 7 fields (notes = situation context per DB schema); PATCH wired to `/api/projects/[id]` |
| UI-02 | 04-03-PLAN.md | User can delete a project with a confirmation dialog — deletes project and all associated defense responses | SATISFIED | `ProjectHeader.tsx` delete Dialog + `handleDelete`; DB schema: `defense_responses.project_id ON DELETE CASCADE` (migration 001_initial.sql) handles cascade |
| UI-03 | 04-02-PLAN.md | User can delete a contract with a confirmation dialog — also deletes the stored Anthropic Files API PDF | SATISFIED | `ContractDeleteButton.tsx` + updated DELETE route with best-effort Anthropic cleanup |
| UI-04 | 04-04-PLAN.md | Upgrade nudge appears when a free user has used 2 of 3 defense responses (pre-wall, before the hard block) | SATISFIED | `isNearLimit` strip in `DefenseDashboard.tsx`; exact condition: `plan === 'free' && responsesUsed >= 2 && responsesUsed < FREE_LIMIT` |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` lines 54-55 | UI-01 and UI-02 marked `[ ]` (Pending) and traceability table shows "Pending" — but implementations exist and pass all checks | Info | Documentation staleness only; `04-03-SUMMARY.md` omitted `requirements-completed: [UI-01, UI-02]` from its frontmatter, so REQUIREMENTS.md was never updated |

No blocking anti-patterns in source files. No TODOs, placeholders, or stub patterns found in any Phase 4 component.

### Human Verification Required

#### 1. Nudge Strip Visual Rendering and Checkout Flow

**Test:** Log in as a free user who has used exactly 2 defense responses. Open any project page.
**Expected:** A lime-accented strip ("2 of 3 responses used" left, "Upgrade to Pro →" right with lime color) appears above the tool grid. The strip cannot be dismissed. Clicking "Upgrade to Pro →" redirects to Stripe checkout.
**Why human:** Visual rendering and Stripe checkout redirect require a running browser with authenticated free-tier session.

#### 2. Project Edit Form Interaction

**Test:** Open a project page, click Edit, modify a field, observe focus ring color, click Save Changes.
**Expected:** Form appears pre-filled; input focus rings turn lime (#84cc16); save calls PATCH, replaces form with read view showing updated data, and shows toast "Project updated".
**Why human:** Interactive state transitions, focus ring style change, and toast visibility require browser interaction.

#### 3. Project Delete End-to-End

**Test:** Click "Delete project" on a project that has defense responses. Confirm deletion.
**Expected:** Confirmation dialog shows "Delete this project? This will permanently delete all defense responses too." After confirm, project and its defense_responses are removed from DB, browser redirects to /projects.
**Why human:** Requires live DB connection and browser session to verify both the DB cascade and navigation.

#### 4. Contract Delete with Anthropic Cleanup

**Test:** Click "Delete contract" on a contract detail page for a PDF-uploaded contract. Confirm deletion.
**Expected:** Dialog shows correct copy. After confirm, redirects to /contracts. Anthropic Files API delete is attempted (may succeed or log error silently). Contract row is removed from Supabase.
**Why human:** Requires ANTHROPIC_API_KEY and live Supabase connection; Anthropic cleanup outcome is logged server-side only.

### Gaps Summary

No blocking gaps found. All 10 must-have truths verified. All artifacts exist, are substantive, and are correctly wired with real data flowing through all layers.

One documentation-only issue: `REQUIREMENTS.md` still marks UI-01 and UI-02 as `[ ]` (Pending) and lists them as "Pending" in the traceability table. The `04-03-SUMMARY.md` omitted `requirements-completed: [UI-01, UI-02]` from its frontmatter. This does not affect the codebase — it is a docs update that should be applied to `REQUIREMENTS.md`.

---

_Verified: 2026-04-24T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
