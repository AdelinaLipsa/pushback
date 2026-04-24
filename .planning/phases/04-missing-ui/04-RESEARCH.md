# Phase 4: Missing UI - Research

**Researched:** 2026-04-24
**Domain:** React/Next.js 16 client component extraction, shadcn Dialog, Anthropic Files API delete, inline form patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Project edit form is inline on the project detail page. An Edit button in the header area toggles an in-place form. No new route, no dialog component.
- **D-02:** All editable fields exposed: title, client_name, client_email, project_value, currency, status, notes. PATCH API supports all of them.
- **D-03:** Currency field uses the same `CURRENCIES` array as NewProjectForm.tsx (`['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF']`).
- **D-04:** On successful save: close form, reflect updated values via `router.refresh()`. Show a sonner toast on success.
- **D-05:** Edit form is a client component — extract the header + edit toggle into a `ProjectHeader` client component.
- **D-06 (overridden by UI-SPEC):** Original decision was inline two-step for delete. UI-SPEC supersedes this: use shadcn Dialog for all destructive confirmations and error states.
- **D-07:** On project delete confirm: `DELETE /api/projects/[id]`, then `router.push('/projects')`. Supabase cascade handles associated record cleanup.
- **D-08:** Delete button placement: in the project detail page header alongside Edit button. Enforced by API's `eq('user_id', user.id)` check.
- **D-09 (overridden by UI-SPEC):** Same as D-06 — Dialog pattern used, not inline two-step.
- **D-10:** Contract delete button placement: on contract detail page, in header area near the back link.
- **D-11:** Backend change: update `app/api/contracts/[id]/route.ts` DELETE handler to call `anthropic.beta.files.delete(contract.anthropic_file_id)` before the Supabase delete.
- **D-12:** Anthropic file delete is best-effort: if `anthropic_file_id` is null or API call fails, log with `console.error` and continue. Do not fail the whole operation.
- **D-13:** After successful contract delete: `router.push('/contracts')`.
- **D-14:** Nudge trigger: free user with `responsesUsed >= 2` AND `responsesUsed < FREE_LIMIT`.
- **D-15:** UI: slim strip rendered above the defense tool grid in `DefenseDashboard`. Clicking triggers the existing `handleUpgrade` checkout flow.
- **D-16:** Strip is NOT dismissible.
- **D-17:** Styling: amber-accented, consistent with `--brand-amber`.

### Claude's Discretion

- Exact inline styles for the edit form and delete confirmation states — follow existing CSS custom property patterns.
- Whether to use a single `ProjectActions` client component or separate `EditProjectForm` and `DeleteProjectButton` components.
- Exact copy for delete confirmation messages.
- Exact copy for the upgrade strip.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | User can edit an existing project (title, client name, project value, situation context) | PATCH API confirmed to accept all editable fields. Client component extraction pattern verified from CONVENTIONS.md and Next.js 16 docs. |
| UI-02 | User can delete a project with a confirmation dialog — deletes project and all associated defense responses | Cascade delete confirmed via migration: `defense_responses.project_id references projects(id) on delete cascade`. Dialog pattern from UI-SPEC. |
| UI-03 | User can delete a contract with a confirmation dialog — also deletes the stored Anthropic Files API PDF | `anthropic.beta.files.delete(fileID)` confirmed in SDK type definitions. Beta header `files-api-2025-04-14` confirmed. Best-effort pattern per D-12. |
| UI-04 | Upgrade nudge appears when a free user has used 2 of 3 defense responses | `DefenseDashboard` already receives `responsesUsed` and `plan` props. `handleUpgrade()` pattern confirmed in `UpgradePrompt.tsx`. |
</phase_requirements>

---

## Summary

Phase 4 is entirely UI work (four surfaces) plus one small backend change (contract DELETE route). All four API routes already exist and are verified. The work decomposes cleanly into three new/modified files: a new `ProjectHeader` client component extracted from the project detail Server Component page, a new `ContractDeleteButton` client component extracted from the contract detail Server Component page, and an inline nudge strip added inside `DefenseDashboard.tsx`.

The shadcn `Dialog` component (`components/ui/dialog.tsx`) does NOT yet exist in the codebase — only `button.tsx` and `sonner.tsx` are present in `components/ui/`. It must be added via `npx shadcn add dialog` as a Wave 0 prerequisite. The UI-SPEC (approved 2026-04-24) explicitly overrides the CONTEXT.md inline two-step pattern (D-06, D-09) in favour of Dialog-based confirmations for all destructive actions and error states.

The backend change for UI-03 is minimal but requires care: the contracts DELETE route must fetch `anthropic_file_id` from the contract row before deleting, call `(anthropic.beta.files as any).delete(file_id, { betas: ['files-api-2025-04-14'] })` in a try/catch (best-effort), then proceed with the Supabase delete regardless of outcome. The `as any` cast is required (established in `analyze/route.ts`).

**Primary recommendation:** Execute in three waves — Wave 0 installs dialog; Wave 1 builds `ProjectHeader` (edit + delete) and patches the contract DELETE route; Wave 2 adds `ContractDeleteButton` and the nudge strip in `DefenseDashboard`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project edit form (UI-01) | Frontend Client Component | API / Backend (PATCH) | Interactive state lives in client; data persistence in existing PATCH route |
| Project delete (UI-02) | Frontend Client Component | API / Backend (DELETE) | Delete trigger/confirmation is client state; cascade delete handled DB-side |
| Contract delete (UI-03) | API / Backend (DELETE) | Frontend Client Component | Backend change required (Anthropic Files API call); UI trigger is client state |
| Pre-wall upgrade nudge (UI-04) | Frontend Client Component | — | Purely presentational; `DefenseDashboard` already receives all needed props |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.4 | Component model, `useState`, `use()` for async params | Already installed |
| Next.js 16 | 16.2.4 | App Router, Server/Client boundary, `router.refresh()`, `router.push()` | Project runtime |
| @anthropic-ai/sdk | ^0.90.0 | `anthropic.beta.files.delete()` for contract PDF cleanup | Already installed; type definitions confirmed |

[VERIFIED: package.json + node_modules/@anthropic-ai/sdk/resources/beta/files.d.ts]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | `toast('Project updated')` on edit success | Edit form save success only |
| shadcn Dialog | base-nova | Confirmation and error modals | All destructive actions; all API error states |
| lucide-react | ^1.9.0 | Icons (if needed in dialog title or buttons) | Optional — use only if icon adds clarity |

[VERIFIED: package.json, components/ui/sonner.tsx, 04-UI-SPEC.md]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Dialog | inline two-step confirmation | Dialog is safer for destructive actions (user can't accidentally click past it); UI-SPEC explicitly chose Dialog |
| `router.refresh()` after edit | optimistic update | `router.refresh()` is simpler, correct, and already established in the codebase (defend flow) |

**Installation (Wave 0):**
```bash
npx shadcn add dialog
```

---

## Architecture Patterns

### System Architecture Diagram

```
project/[id]/page.tsx (Server Component)
  → fetches project + profile data
  → passes project as props to ProjectHeader (Client Component)
  → passes projectId, plan, responsesUsed to DefenseDashboard (Client Component)

ProjectHeader (Client Component) [NEW]
  ├─ IDLE state: renders read-only title, client meta, status badge, Edit button, Delete button
  ├─ EDITING state: renders inline edit form (all fields pre-filled)
  │   ├─ PATCH /api/projects/[id] → success → IDLE + router.refresh() + toast
  │   └─ PATCH /api/projects/[id] → error → Error Dialog open
  ├─ CONFIRM_DELETE state: Dialog open
  │   ├─ DELETE /api/projects/[id] → success → router.push('/projects')
  │   └─ DELETE /api/projects/[id] → error → Error Dialog open
  └─ Dialog (shadcn): handles confirm + error modal variants

contracts/[id]/page.tsx (Server Component)
  → fetches contract data
  → renders ContractDeleteButton (Client Component) with contractId prop

ContractDeleteButton (Client Component) [NEW]
  ├─ IDLE: renders "Delete contract" outline button
  ├─ CONFIRM_DELETE: Dialog open
  │   ├─ DELETE /api/contracts/[id] → success → router.push('/contracts')
  │   └─ DELETE /api/contracts/[id] → error → Error Dialog open
  └─ Dialog (shadcn): handles confirm + error modal variants

app/api/contracts/[id]/route.ts [MODIFIED — DELETE handler only]
  → fetch contract row to get anthropic_file_id
  → try: (anthropic.beta.files as any).delete(anthropic_file_id, { betas: ['files-api-2025-04-14'] })
  → catch: console.error, continue
  → supabase.from('contracts').delete(...)

DefenseDashboard.tsx [MODIFIED — nudge strip added]
  ├─ existing isAtLimit check unchanged
  ├─ NEW: isNearLimit = plan === 'free' && responsesUsed >= 2 && responsesUsed < FREE_LIMIT
  └─ NudgeStrip (inline JSX): amber left-border strip above tool grid
      └─ handleUpgrade: fetch('/api/checkout') → window.location.href = data.url
```

### Recommended Project Structure
```
components/
├── project/
│   ├── NewProjectForm.tsx     # existing — reference only
│   ├── ProjectCard.tsx        # existing — do not touch
│   └── ProjectHeader.tsx      # NEW — extracted from project/[id]/page.tsx
├── contract/
│   ├── ClauseCard.tsx         # existing
│   ├── ContractDeleteButton.tsx  # NEW — extracted from contracts/[id]/page.tsx
│   ├── ContractUploader.tsx   # existing
│   ├── RiskReport.tsx         # existing
│   └── RiskScoreBadge.tsx     # existing
├── defense/
│   └── DefenseDashboard.tsx   # MODIFIED — nudge strip added
└── ui/
    ├── button.tsx             # existing
    ├── dialog.tsx             # NEW — npx shadcn add dialog
    └── sonner.tsx             # existing
```

### Pattern 1: Client Component Extraction from Server Component Page

**What:** Server Component page fetches data, passes it as props to a Client Component that owns interactive state.

**When to use:** Any time a page needs interactive elements (toggle, form, dialog) but the data fetch must remain server-side.

**Example (established pattern in this codebase):**
```typescript
// Source: app/(dashboard)/projects/[id]/page.tsx (existing pattern), Next.js 16 docs
// Server Component page:
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ... fetch data server-side ...
  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <ProjectHeader project={project} />   {/* client component receives data as props */}
      <DefenseDashboard projectId={project.id} plan={...} responsesUsed={...} />
    </div>
  )
}

// Client Component (new):
'use client'
// MUST be first line — no imports before it (CONVENTIONS.md)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
// ...
export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false)
  // ...
}
```

[VERIFIED: CONVENTIONS.md "Server vs Client split", existing project/[id]/page.tsx, Next.js 16 dynamic-routes.md]

### Pattern 2: Inline Two-State Toggle (Read → Edit)

**What:** A single client component renders read-only view or edit form based on a boolean state flag. No route change, no modal for the form itself.

**When to use:** Edit forms where the data is already on the page and the form fields are compact enough to replace the read view.

**Example:**
```typescript
// Source: NewProjectForm.tsx form pattern + CONTEXT.md D-01/D-05
const [editing, setEditing] = useState(false)
const [form, setForm] = useState({
  title: project.title,
  client_name: project.client_name,
  // ... pre-fill all fields from project prop
})

function set(key: string, value: string) {
  setForm(f => ({ ...f, [key]: value }))
}

if (editing) {
  return <form onSubmit={handleSave}>...</form>
}
return (
  <div>
    <h1>{project.title}</h1>
    <button onClick={() => setEditing(true)}>Edit</button>
  </div>
)
```

### Pattern 3: Best-Effort API Call (fire-and-forget with logging)

**What:** Call an external API in a try/catch, log errors with `console.error`, but continue regardless of outcome.

**When to use:** Cleanup operations that should not block the primary operation (Anthropic file delete before Supabase delete).

**Example:**
```typescript
// Source: CONTEXT.md D-12, established in Phase 3 email sending (fire-and-forget)
// In the contract DELETE route handler:
if (contract.anthropic_file_id) {
  try {
    await (anthropic.beta.files as any).delete(
      contract.anthropic_file_id,
      { betas: ['files-api-2025-04-14'] }
    )
  } catch (err) {
    console.error('Anthropic file delete error:', err)
    // continue — do not return early
  }
}
const { error } = await supabase.from('contracts').delete().eq('id', id).eq('user_id', user.id)
```

[VERIFIED: node_modules/@anthropic-ai/sdk/resources/beta/files.d.ts — `delete(fileID: string, params?: FileDeleteParams)`, beta.d.ts confirms `'files-api-2025-04-14'` as valid `AnthropicBeta` value]

### Pattern 4: shadcn Dialog — Dark Theme Override

**What:** shadcn Dialog provides focus trap, overlay, keyboard dismiss (Escape). Inner content uses project CSS custom properties.

**When to use:** All destructive confirmations and API error states in this phase (UI-SPEC).

**API (to be installed via `npx shadcn add dialog`):**
```typescript
// Source: 04-UI-SPEC.md Modal / Dialog Contract
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// Usage:
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent style={{
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--bg-border)',
    borderRadius: '0.875rem',
    padding: '1.5rem',
    maxWidth: '440px',
    width: '100%',
  }}>
    <DialogHeader>
      <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Are you sure?
      </DialogTitle>
    </DialogHeader>
    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
      Delete this project? This will permanently delete all defense responses too.
    </p>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={handleDelete} style={buttonVariants.destructive}>Yes, delete</button>
      <button onClick={() => setDialogOpen(false)} style={buttonVariants.ghost}>Cancel</button>
    </div>
  </DialogContent>
</Dialog>
```

[ASSUMED — Dialog API is standard shadcn; exact component API will be confirmed when installed. The `open`/`onOpenChange` props are the shadcn standard. Inner content styling is project-specific per UI-SPEC.]

### Pattern 5: Upgrade CTA (`handleUpgrade`)

**What:** Fetch `/api/checkout`, redirect to Stripe URL. Already established in `UpgradePrompt.tsx`.

**When to use:** All upgrade CTAs — both the existing `UpgradePrompt` and the new nudge strip.

**Example:**
```typescript
// Source: components/shared/UpgradePrompt.tsx
async function handleUpgrade() {
  setLoading(true)
  const res = await fetch('/api/checkout', { method: 'POST' })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    setLoading(false)
  }
}
```

[VERIFIED: components/shared/UpgradePrompt.tsx lines 14-22]

### Anti-Patterns to Avoid

- **`'use client'` not on the first line:** Any import before `'use client'` causes a build error. CONVENTIONS.md is explicit: `'use client'` is always the very first line.
- **Using `NextResponse.json()` in route handlers:** The project uses `Response.json()` (native Web API). Do not deviate.
- **Named exports for components:** All components use `export default function`. Named exports are for types and constants only.
- **Tailwind classes for layout/sizing:** Inline `style` objects only. Tailwind only for hover states and responsive visibility.
- **Importing `buttonVariants` from `components/ui/button.tsx` for inline styles:** The `buttonVariants` in `button.tsx` is a `cva()` function for class names, not the inline-style objects needed here. Define the phase's `buttonVariants` as a plain object constant (`{ primary: {...}, ghost: {...}, ... }`) in a shared location or inline in each component. Do not confuse the two.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal overlay + focus trap + keyboard dismiss | Custom modal component | `shadcn Dialog` | Focus management and keyboard handling have edge cases; shadcn handles them correctly |
| Toast notifications | Custom toast | `sonner` (already installed) | Already in the codebase; `import { toast } from 'sonner'` |
| Checkout redirect | Custom Stripe flow | `handleUpgrade()` pattern from UpgradePrompt.tsx | Already implemented and tested |
| Anthropic file cleanup | Custom retry logic | Best-effort try/catch (D-12) | Over-engineering a cleanup operation; best-effort with logging is the established pattern |

**Key insight:** The project already has all the primitives needed. The only new dependency is the shadcn Dialog component.

---

## Critical Findings

### Finding 1: Cascade Delete Chain Confirmed

The `supabase/migrations/001_initial.sql` confirms:

```sql
create table public.defense_responses (
  project_id uuid references public.projects(id) on delete cascade not null,
  ...
)
```

`defense_responses.project_id` references `projects(id)` **with `on delete cascade`** — directly, not via a `user_id` chain. Deleting a project row cascades to delete all its `defense_responses` rows automatically at the DB level.

[VERIFIED: supabase/migrations/001_initial.sql lines 41-52]

**The CONTEXT.md note "actually via `user_id` cascade chain — verify" is incorrect.** The cascade is direct: `project_id → projects.id`. No secondary verification needed.

### Finding 2: Anthropic Files API Delete — SDK Type Confirmed

The installed `@anthropic-ai/sdk@^0.90.0` has `Files.delete()` typed and available without TypeScript complaints when accessed as `(anthropic.beta.files as any).delete(...)`. The `as any` cast is required because the SDK types `beta.files` as an internal type that loses the methods in TypeScript's view — this is the established pattern from `analyze/route.ts` where `(anthropic.beta.files as any).upload(...)` is used.

The correct call signature:
```typescript
await (anthropic.beta.files as any).delete(
  contract.anthropic_file_id,
  { betas: ['files-api-2025-04-14'] }
)
```

The `FileDeleteParams` interface accepts `betas?: Array<AnthropicBeta>`. The string `'files-api-2025-04-14'` is a valid `AnthropicBeta` value (confirmed in `beta.d.ts`).

[VERIFIED: node_modules/@anthropic-ai/sdk/resources/beta/files.d.ts, node_modules/@anthropic-ai/sdk/resources/beta/beta.d.ts]

### Finding 3: PATCH Route Allowed Fields Confirmed

`app/api/projects/[id]/route.ts` line 27:
```typescript
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id']
```

All fields the edit form needs to send are in the allowlist. The route returns `{ project: data }` on success.

[VERIFIED: app/api/projects/[id]/route.ts lines 26-39]

### Finding 4: `dialog.tsx` Does Not Exist

Only `button.tsx` and `sonner.tsx` exist in `components/ui/`. `dialog.tsx` must be installed as Wave 0 prerequisite.

[VERIFIED: ls components/ui/]

### Finding 5: `buttonVariants` Name Collision

`components/ui/button.tsx` exports a `buttonVariants` `cva()` function for Tailwind class composition. The UI-SPEC recommends a `buttonVariants` plain object for inline styles. These are two different things — use a different name for the inline-style constant (e.g., `btnStyle` or `btnVariants`) to avoid confusion when both are imported in the same file. Alternatively, define inline-style button objects at the top of each component file without a shared export.

[VERIFIED: components/ui/button.tsx line 6 (`const buttonVariants = cva(...)`)]

### Finding 6: `contract.anthropic_file_id` Must Be Fetched Before Delete

The existing contract DELETE route (`app/api/contracts/[id]/route.ts` line 26) calls `supabase.from('contracts').delete()` directly without fetching the row first. To call `anthropic.beta.files.delete()`, the route must first `select('anthropic_file_id')` from the row (while the row still exists), then perform the file cleanup, then delete the row.

[VERIFIED: app/api/contracts/[id]/route.ts lines 20-28]

### Finding 7: Sonner Toast Import Pattern

The `components/ui/sonner.tsx` exports a `Toaster` component (the toast provider). The actual `toast()` function comes from the `sonner` package directly:

```typescript
import { toast } from 'sonner'
// ...
toast('Project updated')  // simple string toast
```

The `Toaster` component is already mounted in the app layout. No additional setup needed.

[VERIFIED: components/ui/sonner.tsx — wraps `Sonner` from `sonner` package]

### Finding 8: No `lib/ui.ts` Exists

`lib/` contains: `anthropic.ts`, `defenseTools.ts`, `email.ts`, `plans.ts`, `rate-limit.ts`, `stripe.ts`, `utils.ts`, `supabase/`. No `lib/ui.ts` exists. The UI-SPEC recommends exporting the inline-style `buttonVariants` object from `lib/ui.ts` or from the component file. Given the project's CONVENTIONS.md rule ("UI-only constants defined inline in the component where used"), defining them inline per component is the convention-consistent approach — but the UI-SPEC's `lib/ui.ts` option is also valid for sharing across the three new components in this phase.

[VERIFIED: ls lib/]

---

## Common Pitfalls

### Pitfall 1: `'use client'` Placement
**What goes wrong:** Build error `SyntaxError: Cannot use import statement in a module` or similar when `'use client'` is not the absolute first line.
**Why it happens:** Any code (including comments) before the directive causes the file to be treated as a Server Component even if the directive is present.
**How to avoid:** First line, no exceptions. Pattern confirmed in NewProjectForm.tsx, DefenseDashboard.tsx, UpgradePrompt.tsx.
**Warning signs:** TypeScript error on `useState` or `useRouter` import.

### Pitfall 2: Importing `buttonVariants` from `components/ui/button.tsx` for Inline Styles
**What goes wrong:** Developer imports the shadcn `buttonVariants` (which is a `cva()` function returning CSS class strings) and tries to use it as an inline `style` object.
**Why it happens:** Name collision — the UI-SPEC defines an inline-style `buttonVariants` constant; the shadcn `button.tsx` exports a same-named Tailwind class generator.
**How to avoid:** Name the inline-style constant something different (e.g., `btnStyle`) or don't import from `button.tsx` when using inline styles.
**Warning signs:** `style={buttonVariants.primary}` resolves to a string, not an object.

### Pitfall 3: Missing `anthropic_file_id` Fetch in Contract DELETE Route
**What goes wrong:** `anthropic_file_id` is undefined because the route deletes the row before trying to read from it, or because it skips the fetch step.
**Why it happens:** The existing DELETE handler goes straight to `supabase...delete()` without a prior `select()`.
**How to avoid:** Add a `select('anthropic_file_id')` call before the delete. If the select fails or returns no row, return 404 early. Only proceed to Anthropic cleanup and Supabase delete if the row was found.
**Warning signs:** `console.error` shows file ID is `undefined` or `null` on every delete.

### Pitfall 4: `router.refresh()` vs `router.push()` Confusion
**What goes wrong:** After a delete, `router.refresh()` keeps the user on the now-deleted resource's page (404). After an edit, `router.push('/projects')` navigates away instead of staying.
**Why it happens:** The two operations require different navigation behavior.
**How to avoid:**
- Edit (UI-01): `router.refresh()` — stay on page, revalidate server data.
- Delete (UI-02, UI-03): `router.push('/projects')` / `router.push('/contracts')` — leave page.
**Warning signs:** User sees 404 page after edit, or is unexpectedly redirected after saving.

### Pitfall 5: Dialog Not Installed Before Wave 1
**What goes wrong:** `import { Dialog, ... } from '@/components/ui/dialog'` throws a module-not-found error.
**Why it happens:** `components/ui/dialog.tsx` does not exist in the codebase — it must be installed first.
**How to avoid:** Wave 0 plan installs dialog before any component that uses it.
**Warning signs:** TypeScript error on Dialog import.

### Pitfall 6: Fetching `anthropic_file_id` After Row Is Already Deleted
**What goes wrong:** Same as Pitfall 3, but from a different code path — if the Supabase delete runs before the file fetch.
**Why it happens:** Order of operations bug.
**How to avoid:** Always: (1) SELECT the row, (2) attempt Anthropic delete, (3) DELETE the Supabase row.

---

## Code Examples

### Edit Form — Pre-filled State Initialization
```typescript
// Source: NewProjectForm.tsx useState pattern adapted for edit (pre-fill from props)
const [form, setForm] = useState({
  title: project.title,
  client_name: project.client_name,
  client_email: project.client_email ?? '',
  project_value: project.project_value ? String(project.project_value) : '',
  currency: project.currency ?? 'EUR',
  status: project.status ?? 'active',
  notes: project.notes ?? '',
})

function set(key: string, value: string) {
  setForm(f => ({ ...f, [key]: value }))
}
```

### PATCH API Call for Edit Form
```typescript
// Source: NewProjectForm.tsx handleSubmit pattern, app/api/projects/[id]/route.ts PATCH
async function handleSave(e: React.FormEvent) {
  e.preventDefault()
  setError('')
  setLoading(true)

  const res = await fetch(`/api/projects/${project.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...form,
      project_value: form.project_value ? Number(form.project_value) : null,
    }),
  })

  const data = await res.json()
  setLoading(false)

  if (!res.ok) {
    setErrorDialogOpen(true)  // open error modal, not inline error
    setErrorMessage(data.error ?? 'Could not save changes. Please try again.')
    return
  }

  setEditing(false)
  router.refresh()
  toast('Project updated')
}
```

### Contract DELETE Route — Updated with Anthropic Cleanup
```typescript
// Source: app/api/contracts/[id]/route.ts existing pattern + D-11/D-12
import { anthropic } from '@/lib/anthropic'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch anthropic_file_id before deleting the row
  const { data: contract } = await supabase
    .from('contracts')
    .select('anthropic_file_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return Response.json({ error: 'Not found' }, { status: 404 })

  // Best-effort Anthropic file cleanup (D-12)
  if (contract.anthropic_file_id) {
    try {
      await (anthropic.beta.files as any).delete(
        contract.anthropic_file_id,
        { betas: ['files-api-2025-04-14'] }
      )
    } catch (err) {
      console.error('Anthropic file delete error:', err)
      // continue regardless
    }
  }

  const { error } = await supabase.from('contracts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
```

### Nudge Strip (UI-04) — Inline JSX in DefenseDashboard
```typescript
// Source: DefenseDashboard.tsx existing structure + CONTEXT.md D-14/D-15 + UI-SPEC
const FREE_LIMIT = 3
const isAtLimit = plan === 'free' && responsesUsed >= FREE_LIMIT
const isNearLimit = plan === 'free' && responsesUsed >= 2 && responsesUsed < FREE_LIMIT

// Inside the return, above the tool grid:
{isNearLimit && (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem',
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
    borderLeft: '3px solid var(--brand-amber)', borderRadius: '0.5rem',
    fontSize: '0.85rem',
  }}>
    <span style={{ color: 'var(--text-secondary)' }}>2 of 3 responses used</span>
    <button
      onClick={handleUpgrade}
      disabled={upgradeLoading}
      style={{
        background: 'none', border: 'none',
        cursor: upgradeLoading ? 'not-allowed' : 'pointer',
        color: 'var(--brand-amber)', fontWeight: 700,
        fontSize: '0.85rem', padding: 0,
        opacity: upgradeLoading ? 0.7 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {upgradeLoading ? 'Loading…' : 'Upgrade to Pro →'}
    </button>
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `middleware` export | `proxy.ts` with `proxy` export | Next.js 16 (Phase 2 complete) | Already done; no action needed |
| Synchronous `params` in page components | `params: Promise<{ id: string }>` — must `await params` | Next.js 15+ (applied throughout) | Already applied in existing pages |
| `NextResponse.json()` | `Response.json()` (native Web API) | App Router convention | Already applied throughout |

**Deprecated/outdated:**
- Inline two-step delete confirmation: Superseded by Dialog pattern per UI-SPEC (non-blocking checker flag acknowledged and approved).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn Dialog API uses `open`/`onOpenChange` props (base-ui/react primitive pattern) | Architecture Patterns — Pattern 4 | Dialog might have different prop names; resolved by reading the installed `dialog.tsx` after `npx shadcn add dialog` in Wave 0 |
| A2 | `toast('Project updated')` call signature from `sonner` v2 is a simple string arg | Code Examples | sonner v2 might require different call shape; verify against installed package after Wave 0 |

---

## Open Questions

1. **Dialog component exact API (post-install)**
   - What we know: shadcn standard dialog uses `open`/`onOpenChange` props, `DialogContent`, `DialogHeader`, `DialogTitle`
   - What's unclear: base-nova preset may customise the component API or class names
   - Recommendation: Read `components/ui/dialog.tsx` immediately after `npx shadcn add dialog` in Wave 0, before writing any component that uses it

2. **`status` field select options for edit form**
   - What we know: DB schema defines `status text default 'active'`; CONTEXT.md says expose `status`; UI-SPEC says `['active', 'completed', 'paused']`
   - What's unclear: Whether `'paused'` is a valid status value used elsewhere in the app
   - Recommendation: Use `['active', 'completed', 'paused']` per UI-SPEC

---

## Environment Availability

Step 2.6: SKIPPED — Phase is code/config changes only. No new external services or CLIs beyond what is already installed. `npx shadcn add dialog` uses the locally-installed `shadcn@^4.4.0` CLI (confirmed in package.json devDependencies).

---

## Validation Architecture

No automated test infrastructure exists for this project (no jest.config, no vitest.config, no test/ directory). Manual verification is the expected test approach for UI phases.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| UI-01 | Edit form pre-fills from existing project, saves changes, shows toast, closes form | manual | — | Browser: load project page, click Edit, change fields, save |
| UI-02 | Delete project button opens dialog, confirm deletes project and responses, redirects | manual | — | Browser: confirm dialog appears, project gone after confirm |
| UI-03 | Delete contract opens dialog, backend cleans up Anthropic file, redirects | manual | — | Check console.error on contracts without anthropic_file_id |
| UI-04 | Nudge strip appears at exactly 2/3 responses, not at 0/3 or 3/3 | manual | — | Browser: use 2 responses, verify strip appears; use 3rd, verify UpgradePrompt replaces strip |

### Wave 0 Gaps

- [ ] `npx shadcn add dialog` — installs `components/ui/dialog.tsx`

*(No test framework to install — manual testing is the established practice for this project)*

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes — edit/delete routes require auth | `supabase.auth.getUser()` + 401 guard (already in all routes) |
| V3 Session Management | no | N/A |
| V4 Access Control | yes — user can only edit/delete their own data | `eq('user_id', user.id)` in all Supabase queries (already in all routes) |
| V5 Input Validation | partial — PATCH route has allowlist | The `allowed` array in PATCH route filters fields; no additional Zod schema required for this phase (edit form fields are same as POST route which was validated in Phase 1) |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on project/contract delete | Elevation of Privilege | `eq('user_id', user.id)` in all DELETE queries — already implemented |
| Mass assignment via PATCH | Tampering | `allowed` array allowlist in PATCH route — already implemented |
| Anthropic file ID exposure | Information Disclosure | `anthropic_file_id` only used server-side in route handler; never returned to client |

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md references AGENTS.md which states:

> **This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.**

**Verified breaking changes relevant to this phase:**

1. `params` is a `Promise<{ id: string }>` — must `await params` in Server Component pages and route handlers. Already applied in all existing files. [VERIFIED: dynamic-routes.md, existing route files]
2. In Client Components, access dynamic params via `use(params)` from React or `useParams()` hook — NOT via `await params`. For this phase, client components receive data as props from the Server Component parent, so this is not directly applicable.
3. `cookies()` from `next/headers` is async — must be awaited. Not directly used in new components for this phase.
4. Middleware renamed to `proxy.ts` with `proxy` export — already done in Phase 2.

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/001_initial.sql` — cascade delete chain confirmed
- `app/api/projects/[id]/route.ts` — PATCH allowed fields, DELETE confirmed
- `app/api/contracts/[id]/route.ts` — existing DELETE pattern confirmed
- `app/api/contracts/analyze/route.ts` — `as any` cast pattern for Files API, beta header usage
- `node_modules/@anthropic-ai/sdk/resources/beta/files.d.ts` — `delete()` signature confirmed
- `node_modules/@anthropic-ai/sdk/resources/beta/beta.d.ts` — `'files-api-2025-04-14'` beta string confirmed
- `components/project/NewProjectForm.tsx` — `inputStyle`, `labelStyle`, `CURRENCIES`, form pattern
- `components/shared/UpgradePrompt.tsx` — `handleUpgrade()` pattern
- `components/defense/DefenseDashboard.tsx` — existing props, state structure, `FREE_LIMIT`
- `components/ui/button.tsx` — `buttonVariants` name collision identified
- `components/ui/sonner.tsx` — toast provider pattern, `toast()` imported from `sonner` package
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — async params confirmed
- `.planning/codebase/CONVENTIONS.md` — inline styles, `'use client'` placement, component patterns
- `.planning/codebase/STACK.md` — Next.js 16 version, all package versions
- `.planning/phases/04-missing-ui/04-CONTEXT.md` — all locked decisions
- `.planning/phases/04-missing-ui/04-UI-SPEC.md` — approved visual contract, Dialog override of D-06/D-09

### Secondary (MEDIUM confidence)
- Package.json — all installed versions

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules and package.json
- Architecture: HIGH — all patterns verified against existing codebase files
- Pitfalls: HIGH — derived from direct code inspection, not speculation
- Cascade delete: HIGH — confirmed directly in migration SQL
- Anthropic Files API delete: HIGH — confirmed in SDK type definitions

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable stack; Anthropic SDK updates rarely break beta API method signatures)
