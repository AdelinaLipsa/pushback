# Phase 7: Payment Tracking - Research

**Researched:** 2026-04-24
**Domain:** Supabase schema migration, React state lifting, Next.js 16 Server→Client prop passing, inline UI patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** New migration adds three nullable columns to `public.projects`:
  - `payment_due_date date`
  - `payment_amount numeric`
  - `payment_received_at timestamptz`
- **D-02:** Overdue logic: `payment_due_date < today AND payment_received_at IS NULL`
- **D-03:** PATCH route adds `payment_due_date`, `payment_amount`, `payment_received_at` to `allowed` list
- **D-04:** New `PaymentSection` client component below DefenseDashboard on project detail page
- **D-05:** Empty state: inline form with due date + amount + "Save Payment Details" button
- **D-06:** Populated state: read view with Edit toggle; pre-filled form on edit
- **D-07:** Status display: "Due [date]" in `--text-secondary`, "OVERDUE · N days" in `--urgency-high`, "Received [date]" in `--brand-green`
- **D-08:** Overdue state: "Handle Late Payment" (primary, lime) + "Mark as Received" (outline) both visible
- **D-09:** Mark as Received: `payment_received_at = new Date().toISOString()` via PATCH; no datepicker; `router.refresh()` on success
- **D-10:** Days overdue: `Math.floor((today - payment_due_date) / 86400000)` — client-side
- **D-11:** Tier thresholds: 0–7 → `payment_first`, 8–14 → `payment_second`, 15+ → `payment_final`
- **D-12:** Context field pre-fill per tier (invoice_amount, due_date for first; invoice_amount, days_overdue for second/final)
- **D-13:** "Handle Late Payment" calls `onHandleLatePayment({ tool, contextFields })` prop callback; parent sets pre-fill state; scrolls to `#defense-dashboard`
- **D-14:** `DefenseDashboard` gains `initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }` prop
- **D-15:** When `initialPaymentPrefill` is set, `DefenseDashboard` sets `selectedTool` and passes `initialContextFields` to `SituationPanel`
- **D-16:** Situation textarea is NOT pre-filled by payment CTA — only context fields
- **D-17:** OVERDUE badge in `ProjectCard` (chip cluster, top-right) and `ProjectHeader` (beside status badge)
- **D-18:** Badge condition: `payment_due_date !== null && payment_received_at === null && new Date(payment_due_date) < new Date()`

### Claude's Discretion

- Exact date input type — `<input type="date">` (already decided in UI-SPEC)
- Whether "Handle Late Payment" scrolls smoothly or jumps — smooth scroll chosen in UI-SPEC
- Exact button copy and sizing within PaymentSection — all specified in UI-SPEC
- Whether PaymentSection card uses `--bg-surface` / `--bg-border` — yes, per UI-SPEC

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | User can add a payment due date and expected amount to any project | D-01 migration + D-03 PATCH allowed list + D-04 PaymentSection form |
| PAY-02 | Dashboard shows an overdue badge on projects where payment due date has passed and payment is not received | D-17/D-18 badge placement + Project type update + client-side date comparison |
| PAY-03 | Overdue projects show a "Handle Late Payment" CTA that opens the Late Payment defense tool with context pre-filled | D-10–D-13 tier selection + D-14–D-15 DefenseDashboard pre-fill prop chain |
| PAY-04 | User can mark a payment as received on a project, clearing the overdue badge | D-09 Mark as Received PATCH + router.refresh() |
</phase_requirements>

---

## Summary

Phase 7 adds three nullable columns to `public.projects`, a new `PaymentSection` client component on the project detail page, overdue badge logic in `ProjectCard` and `ProjectHeader`, and an `initialPaymentPrefill` prop chain from `PaymentSection` through the project detail page down into `DefenseDashboard` and `SituationPanel`.

All implementation decisions are fully locked in CONTEXT.md. The research confirms these decisions are safe to implement with zero new dependencies — this phase is entirely in-codebase. The critical implementation insight is that `PaymentSection` and `DefenseDashboard` are siblings on the project detail page (both rendered by the same Server Component), meaning the "Handle Late Payment" callback requires lifting state to a thin client wrapper on the project detail page, or passing a callback prop from the page down to both components. The current page is a pure Server Component; adding sibling communication requires adding a `'use client'` wrapper component at the page level to hold the pre-fill state.

The `database.types.ts` file currently does not include the three new payment columns — it reflects the pre-migration schema. The migration must be pushed to the live DB before `npm run gen:types` can regenerate the types. Phase 5 (TYPES-01) has not run, so `database.types.ts` is already not perfectly in sync with some prior changes; this phase should update `database.types.ts` manually for the three new columns (rather than block on Phase 5) to keep TypeScript compilation clean. This is the lowest-risk path given Phase 5 is still pending.

**Primary recommendation:** Implement in four sequential waves: (1) migration SQL + manual `database.types.ts` update + `Project` type update, (2) PATCH route extension + badge logic in ProjectCard/ProjectHeader, (3) PaymentSection component, (4) DefenseDashboard/SituationPanel pre-fill prop chain + page-level state lift.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payment schema (3 new columns) | Database / Storage | — | Data lives in Supabase `projects` table; nullable ADD COLUMN migration |
| Overdue badge (ProjectCard) | Browser / Client | — | Client-side date arithmetic on `Project` props already fetched server-side |
| Overdue badge (ProjectHeader) | Browser / Client | — | Same: props from server, client arithmetic |
| PaymentSection form + status | Browser / Client | — | Needs `useState` for edit toggle, loading state, error; must be 'use client' |
| Handle Late Payment callback | Browser / Client | — | Sibling communication requires client-side state lift at page level |
| "Mark as Received" PATCH | API / Backend | Browser / Client | Route Handler validates auth + updates DB; client fires fetch and handles response |
| Pre-fill DefenseDashboard | Browser / Client | — | Prop-passing from lifted state in client wrapper to sibling DefenseDashboard |
| Server data fetch (project page) | Frontend Server (SSR) | — | Page.tsx fetches project + new payment columns server-side; passes as props |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Client component state management | Already in project |
| Next.js | 16.2.4 | Page server component, route handler | Already in project |
| @supabase/supabase-js | ^2.104.1 | DB client for PATCH mutations | Already in project |

### No New Dependencies
This phase requires zero new npm packages. All required functionality (date arithmetic, inline form, PATCH fetch, router.refresh, CSS variables, inline styles) is already present.

**Installation:**
```bash
# No new packages required
```

---

## Architecture Patterns

### System Architecture Diagram

```
User action                     Client state                    Server
─────────────────────────────────────────────────────────────────────
[ProjectPage server]
  │ fetches project.*           (payment_due_date, payment_amount,
  │                              payment_received_at auto-included
  │                              once migration runs)
  │
  ▼ passes project as props
[ProjectDetailClient]  ←── new 'use client' wrapper component
  │ holds: paymentPrefill state (tool + contextFields)
  │ holds: onHandleLatePayment callback
  │
  ├──► [ProjectHeader]
  │     reads payment fields → OVERDUE badge (client date check)
  │
  ├──► [PaymentSection]   ←── new component
  │     props: project payment fields, onHandleLatePayment
  │     state: editing, saving, error
  │     on "Mark as Received" → PATCH /api/projects/[id] → router.refresh()
  │     on "Handle Late Payment" → calls onHandleLatePayment({tool, contextFields})
  │                                → scrollIntoView('#defense-dashboard')
  │
  └──► [DefenseDashboard]
        props: ..., initialPaymentPrefill? (from ProjectDetailClient state)
        on mount/prop change: sets selectedTool, passes initialContextFields
        │
        └──► [SituationPanel]
              props: ..., initialContextFields? (Record<string, string>)
              on mount: initializes extra state from initialContextFields
```

```
PATCH flow (Mark as Received / Save / Update):
Client ──► PATCH /api/projects/[id]
           │ Auth check (createServerSupabaseClient)
           │ Filter body through allowed list
           └──► supabase.from('projects').update(...).eq('id', id).eq('user_id', user.id)
                └── Response.json({ project: data }) → router.refresh() on client
```

### Recommended Project Structure
```
supabase/migrations/
└── 005_payment_tracking.sql     # ADD COLUMN migration

types/
├── database.types.ts            # Manual update: add payment columns to projects Row/Insert/Update
└── index.ts                     # Add payment fields to Project type

app/api/projects/[id]/
└── route.ts                     # PATCH: add 3 fields to allowed list

app/(dashboard)/projects/[id]/
└── page.tsx                     # Extract ProjectDetailClient wrapper; pass payment props

components/project/
├── PaymentSection.tsx           # NEW: client component, all payment UI
├── ProjectCard.tsx              # MODIFY: add OVERDUE badge
├── ProjectHeader.tsx            # MODIFY: add OVERDUE badge + accept payment props
└── ProjectDetailClient.tsx      # NEW: thin 'use client' wrapper for page-level state

components/defense/
├── DefenseDashboard.tsx         # MODIFY: add initialPaymentPrefill prop
└── SituationPanel.tsx           # MODIFY: add initialContextFields prop
```

### Pattern 1: Server Component passes props to Client siblings via thin wrapper

**What:** The project detail page is a Server Component that fetches data. `PaymentSection` and `DefenseDashboard` are siblings — `PaymentSection` needs to trigger state changes in `DefenseDashboard`. Since siblings cannot share state without a common parent, the solution is a thin `'use client'` wrapper that holds the `paymentPrefill` state and passes it down to both.

**When to use:** When two client sibling components need to share state but their common parent is a Server Component (which cannot hold client state).

**Example pattern:**
```tsx
// components/project/ProjectDetailClient.tsx
'use client'

import { useState } from 'react'
import { DefenseTool } from '@/types'
import PaymentSection from './PaymentSection'
import DefenseDashboard from '@/components/defense/DefenseDashboard'

interface PaymentPrefill {
  tool: DefenseTool
  contextFields: Record<string, string>
}

interface ProjectDetailClientProps {
  project: /* project type with payment fields */
  plan: 'free' | 'pro'
  responsesUsed: number
}

export default function ProjectDetailClient({ project, plan, responsesUsed }: ProjectDetailClientProps) {
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)

  return (
    <>
      <PaymentSection
        project={project}
        onHandleLatePayment={(prefill) => setPaymentPrefill(prefill)}
      />
      <div id="defense-dashboard">
        <DefenseDashboard
          projectId={project.id}
          plan={plan}
          responsesUsed={responsesUsed}
          initialPaymentPrefill={paymentPrefill ?? undefined}
        />
      </div>
    </>
  )
}
```
[VERIFIED: Next.js 16 docs — server-and-client-components.md, confirmed pattern of server page passing data props to client child]

### Pattern 2: initialContextFields prop on SituationPanel (extends Phase 6 pattern)

**What:** Phase 6 added `initialSituation?: string` to `SituationPanel` — the value initializes `useState(initialSituation ?? '')`. Phase 7 extends this with `initialContextFields?: Record<string, string>` to initialize the `extra` state map.

**When to use:** When a parent needs to pre-fill controlled inputs in a child on mount.

**Example:**
```tsx
// In SituationPanel.tsx — add to interface:
initialContextFields?: Record<string, string>

// In component:
const [extra, setExtra] = useState<Record<string, string>>(initialContextFields ?? {})
```
[VERIFIED: read SituationPanel.tsx — existing `initialSituation` prop uses identical pattern at line 17]

### Pattern 3: Extending PATCH allowed list

**What:** The PATCH route in `app/api/projects/[id]/route.ts` uses an `allowed` array as a whitelist. Adding three new fields is a one-line change — append to the array.

**Current allowed list (line 28):**
```ts
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id']
```

**Extended (D-03):**
```ts
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id', 'payment_due_date', 'payment_amount', 'payment_received_at']
```
[VERIFIED: read route.ts — exact line confirmed]

### Pattern 4: Supabase migration for nullable ADD COLUMN

**What:** Adding nullable columns to an existing live table. Postgres `ALTER TABLE ... ADD COLUMN` with no `NOT NULL` constraint and no `DEFAULT` is safe for tables with existing rows — existing rows get NULL for the new columns automatically.

**Migration file:** `supabase/migrations/005_payment_tracking.sql`

```sql
ALTER TABLE public.projects
  ADD COLUMN payment_due_date date,
  ADD COLUMN payment_amount numeric,
  ADD COLUMN payment_received_at timestamptz;
```

**Push to live DB:**
```bash
supabase db push
```
Or via the Supabase dashboard SQL editor if the CLI isn't configured locally.

[VERIFIED: read 001_initial.sql for existing schema — projects table confirmed; read 004_stripe_rename.sql for migration style (bare ALTER TABLE statements, no transactions needed for DDL-only migrations)]

### Pattern 5: Manual database.types.ts update

**What:** Phase 5 (TYPES-01) has not run. The `database.types.ts` currently reflects the pre-Phase 7 schema. The correct approach is to manually add the three new payment columns to the `projects` `Row`, `Insert`, and `Update` shapes. This unblocks TypeScript compilation without requiring the full Phase 5 type-generation infrastructure.

**What to add to `projects` Row:**
```ts
payment_due_date: string | null        // Supabase returns date as ISO string
payment_amount: number | null
payment_received_at: string | null     // timestamptz returned as ISO string
```

**What to add to `projects` Insert (all optional):**
```ts
payment_due_date?: string | null
payment_amount?: number | null
payment_received_at?: string | null
```

**What to add to `projects` Update (all optional):**
```ts
payment_due_date?: string | null
payment_amount?: number | null
payment_received_at?: string | null
```

**What to add to `types/index.ts` Project type:**
```ts
payment_due_date: string | null
payment_amount: number | null
payment_received_at: string | null
```

[VERIFIED: read database.types.ts — projects.Row at line 107; confirmed three columns are absent; confirmed Supabase returns `date` columns as string (ISO 8601)]

### Pattern 6: Overdue badge — client-side date arithmetic

**What:** The overdue condition uses `new Date()` for the current time and compares against `new Date(payment_due_date)`. This is done client-side to avoid server/client hydration mismatch (a server-rendered timestamp would differ from the client's `Date.now()`).

**In ProjectCard and ProjectHeader:**
```tsx
const isOverdue =
  project.payment_due_date !== null &&
  project.payment_received_at === null &&
  new Date(project.payment_due_date) < new Date()
```

**Timezone note:** `payment_due_date` is a `date` type (no time). Supabase returns it as `"YYYY-MM-DD"`. `new Date("YYYY-MM-DD")` parses as UTC midnight. The client's `new Date()` is in local time. This means a due date of "2026-04-24" will appear overdue for users in UTC-offset timezones at the start of the day.

**Mitigation per D-18:** The overdue check uses `new Date(payment_due_date) < new Date()` — this is the accepted approach per the decisions. The off-by-timezone-offset risk is acceptable for a freelance payment nudge (no financial consequence to a few-hour error). Do NOT attempt to normalize to UTC or add complex timezone handling — this is explicitly in Claude's Discretion and the simple comparison is the decided approach.

[VERIFIED: read 07-CONTEXT.md D-10, D-18; read 07-UI-SPEC.md interaction contract step 2]

### Pattern 7: Date formatting for payment_first context field

**What:** The `due_date` context field for the `payment_first` tool expects a human-readable date like "April 15", not an ISO string. The formatting uses:

```ts
new Date(payment_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
// "2026-04-15" → "April 15"
```

**Timezone caveat:** Since `payment_due_date` is "YYYY-MM-DD" and parses as UTC midnight, `toLocaleDateString` in a UTC+N timezone may display the correct date. In UTC-N timezones, it may display the previous day. This is acceptable per decision D-10 and the CONTEXT.md specifics ("April 15" style).

[VERIFIED: read 07-UI-SPEC.md interaction contract step 4; read 07-CONTEXT.md specifics]

### Anti-Patterns to Avoid

- **Server Action instead of PATCH fetch:** This codebase uses explicit fetch calls to Route Handlers, not Server Actions. Do not introduce `'use server'` or `action=` patterns — they are inconsistent with every prior phase.
- **Adding `payment_received_at` as a boolean column:** D-02 is explicit — the timestamp IS the flag. No separate boolean needed.
- **Placing pre-fill state in DefenseDashboard itself:** `DefenseDashboard` cannot hold payment prefill state directly because it receives it as a prop from the page-level sibling communication. The state lives in `ProjectDetailClient`.
- **Tailwind utility classes for layout:** Per CONVENTIONS.md, all layout uses inline `style={{}}` with CSS variables. Tailwind only for hover/transition states.
- **`NextResponse.json()`:** The PATCH route uses `Response.json()` (native Web API). Do not introduce `NextResponse`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom formatter | `Number(x).toLocaleString()` — already used in ProjectCard and ProjectHeader | Consistent with existing pattern at ProjectCard line 19 and ProjectHeader line 106 |
| Date formatting | Custom parser | `new Date(x).toLocaleDateString('en-US', {...})` | Standard Web API, no library needed |
| Toast on success | Custom notification | `sonner` is already installed and used in ProjectHeader (line 6) | Consistent; `toast('Payment saved')` |
| Smooth scroll | Manual scroll calculation | `element.scrollIntoView({ behavior: 'smooth' })` | Native browser API, matches D-13 decision |
| Loading state | Custom spinner | Disabled button + text change (e.g. "Saving…") | Established pattern throughout codebase (ProjectHeader line 236) |

**Key insight:** This phase is entirely in-codebase. Every pattern it needs already exists somewhere in the project.

---

## Common Pitfalls

### Pitfall 1: Sibling state sharing without a client wrapper

**What goes wrong:** `PaymentSection` calls `onHandleLatePayment` but `DefenseDashboard` never updates because the callback is defined in a Server Component (which can't hold state) or not threaded through properly.

**Why it happens:** The project detail page (`page.tsx`) is a Server Component. Server Components cannot use `useState`. If `PaymentSection` is added directly below `DefenseDashboard` in `page.tsx` without a client wrapper, there is no place to hold the shared `paymentPrefill` state.

**How to avoid:** Create `ProjectDetailClient.tsx` as a thin `'use client'` wrapper that renders `PaymentSection` and `DefenseDashboard` side-by-side and holds the `paymentPrefill` state between them. The server page passes all necessary data as props to this wrapper.

**Warning signs:** TypeScript error "useState can only be called in a Client Component" when trying to add state to `page.tsx`.

### Pitfall 2: `initialContextFields` not resetting when a new prefill fires

**What goes wrong:** User clicks "Handle Late Payment", context fields pre-fill. User modifies fields manually. User navigates away and comes back — or scrolls and clicks "Handle Late Payment" again — but the context fields show stale state because `useState` only reads the initial prop once.

**Why it happens:** `useState(initialContextFields ?? {})` only uses the prop value at mount time. If the parent re-renders with a new `initialPaymentPrefill`, the child's state does not update.

**How to avoid:** Use a `useEffect` in `SituationPanel` and `DefenseDashboard` to sync state when the prop changes:
```tsx
// In DefenseDashboard, when initialPaymentPrefill changes:
useEffect(() => {
  if (initialPaymentPrefill) {
    const matchedTool = DEFENSE_TOOLS.find(t => t.type === initialPaymentPrefill.tool)
    if (matchedTool) setSelectedTool(matchedTool)
  }
}, [initialPaymentPrefill])
```
And pass `initialContextFields` to `SituationPanel` as a prop that drives a `useEffect` there too.

**Warning signs:** Clicking "Handle Late Payment" a second time (or for a different project) doesn't update the pre-filled values.

### Pitfall 3: `database.types.ts` TypeScript cast failure after migration

**What goes wrong:** After writing the migration SQL but before updating `database.types.ts`, the PATCH route's TypeScript cast `updates as Database['public']['Tables']['projects']['Update']` will fail at compile time for the new fields.

**Why it happens:** `database.types.ts` is a snapshot. It doesn't auto-update when you add SQL migrations. The `projects.Update` type doesn't include the new columns, so TypeScript rejects them.

**How to avoid:** Update `database.types.ts` manually in the same wave as the migration, before touching the PATCH route. This is Wave 0 work.

**Warning signs:** `tsc --noEmit` fails with "Object literal may only specify known properties, and 'payment_due_date' does not exist in type 'Update'".

### Pitfall 4: `<input type="date">` value format mismatch

**What goes wrong:** Setting the date input's `value` with a raw ISO string (e.g. `"2026-04-15T00:00:00.000Z"`) causes the input to display as blank on some browsers.

**Why it happens:** `<input type="date">` requires `value` in `YYYY-MM-DD` format exactly. Supabase returns `date` columns as `"YYYY-MM-DD"` strings (already correct), but `timestamptz` columns return full ISO strings. `payment_due_date` is `date` type — so Supabase will return `"2026-04-15"` which is already the correct format for the input.

**How to avoid:** Set the date input value directly from `project.payment_due_date` without transformation. Do not call `.toISOString()` on it (that would produce the wrong format).

**Warning signs:** Date input appears blank or shows `Invalid Date` when pre-filling the edit form.

### Pitfall 5: `id="defense-dashboard"` missing from DefenseDashboard wrapper

**What goes wrong:** `scrollIntoView({ behavior: 'smooth' })` silently does nothing because `document.getElementById('defense-dashboard')` returns `null`.

**Why it happens:** The smooth scroll in `PaymentSection` targets `#defense-dashboard`. If the `DefenseDashboard` wrapper div doesn't have this `id`, the scroll target is missing and no error is thrown.

**How to avoid:** The `id="defense-dashboard"` must be on the outermost wrapper element of `DefenseDashboard` inside `ProjectDetailClient`. It should be on the containing div, not inside `DefenseDashboard.tsx` itself (to keep `DefenseDashboard` reusable without a hardcoded id).

**Warning signs:** Clicking "Handle Late Payment" pre-fills context fields correctly but page does not scroll.

### Pitfall 6: Overdue detection in `ProjectCard` (Server Component)

**What goes wrong:** The OVERDUE badge uses `new Date()` for current-time comparison. If `ProjectCard` is a Server Component, this comparison runs server-side — which is fine for the badge itself, but inconsistent with the D-18 decision to do it client-side.

**Why it happens:** `ProjectCard.tsx` currently has no `'use client'` directive — it is a Server Component. The `new Date()` check would run server-side.

**How to avoid:** This is actually acceptable because `ProjectCard` is stateless and does not trigger hydration mismatches with this comparison (the badge is either present or not; it doesn't change mid-render). The existing codebase already does similar "compute-from-props" logic server-side in ProjectCard. D-18 says "client-side" primarily to distinguish from a server-computed value stored in DB — the meaning is "compute at render time, not in the DB query". Implementing it server-side in ProjectCard is fine.

**Warning signs:** None — this is a clarification, not an error.

---

## Code Examples

### Migration SQL
```sql
-- Source: pattern from supabase/migrations/004_stripe_rename.sql (bare ALTER TABLE)
ALTER TABLE public.projects
  ADD COLUMN payment_due_date date,
  ADD COLUMN payment_amount numeric,
  ADD COLUMN payment_received_at timestamptz;
```

### PATCH route allowed list extension
```ts
// Source: app/api/projects/[id]/route.ts line 28
const allowed = [
  'title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id',
  'payment_due_date', 'payment_amount', 'payment_received_at'
]
```

### Project type extension (types/index.ts)
```ts
// Source: types/index.ts — add to Project type
export type Project = {
  // ...existing fields...
  payment_due_date: string | null
  payment_amount: number | null
  payment_received_at: string | null
  // ...existing optional join fields...
}
```

### OVERDUE badge JSX (same pill style as existing badges)
```tsx
// Source: ProjectCard.tsx lines 41-47, ProjectHeader.tsx lines 111-117 — reuse same pill pattern
{isOverdue && (
  <span style={{
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--urgency-high)',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.2rem 0.6rem',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  }}>
    OVERDUE
  </span>
)}
```

### SituationPanel initialContextFields extension
```tsx
// Source: SituationPanel.tsx line 17 — initialSituation pattern to extend
interface SituationPanelProps {
  // ...existing props...
  initialContextFields?: Record<string, string>
}

export default function SituationPanel({ ..., initialContextFields }: SituationPanelProps) {
  const [situation, setSituation] = useState(initialSituation ?? '')
  const [extra, setExtra] = useState<Record<string, string>>(initialContextFields ?? {})

  // Sync when initialContextFields changes (re-fire from payment CTA)
  useEffect(() => {
    if (initialContextFields) setExtra(initialContextFields)
  }, [initialContextFields])
  // ...
}
```

### Days overdue + tier selection
```ts
// Source: CONTEXT.md D-10, D-11, D-12 + UI-SPEC interaction contract
function buildPaymentPrefill(paymentDueDate: string, paymentAmount: number | null) {
  const daysOverdue = Math.floor((Date.now() - new Date(paymentDueDate).getTime()) / 86400000)
  const tool: DefenseTool =
    daysOverdue <= 7 ? 'payment_first' :
    daysOverdue <= 14 ? 'payment_second' :
    'payment_final'

  const invoiceAmount = String(paymentAmount ?? '')
  const contextFields: Record<string, string> =
    tool === 'payment_first'
      ? { invoice_amount: invoiceAmount, due_date: new Date(paymentDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }
      : { invoice_amount: invoiceAmount, days_overdue: String(daysOverdue) }

  return { tool, contextFields }
}
```

### Mark as Received handler (PaymentSection)
```tsx
// Source: CONTEXT.md D-09 + established router.refresh() pattern from ProjectHeader.tsx
async function handleMarkReceived() {
  setSaving(true)
  const res = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_received_at: new Date().toISOString() }),
  })
  const data = await res.json()
  setSaving(false)
  if (!res.ok) {
    setError(data.error ?? 'Failed to mark as received. Please try again.')
    return
  }
  router.refresh()
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `payment_received` boolean column | `payment_received_at timestamptz` IS the flag | D-02 decision | Eliminates redundant data; timestamp also provides audit trail |
| `initialSituation` only in SituationPanel | `initialSituation` + `initialContextFields` | Phase 7 | Enables full payment context pre-fill without re-typing |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase returns `date` column as `"YYYY-MM-DD"` string (not UTC ISO) | Pattern 4 / Pitfall 4 | Date input pre-fill would show blank; easy to fix but would need a slice/transform | 

**Note on A1:** This is standard Supabase/PostgreSQL behavior for `date` type columns. The `timestamptz` type returns full ISO. The distinction is confirmed by the existing `created_at timestamptz` pattern in `database.types.ts` which is typed as `string | null` — same representation. [VERIFIED: database.types.ts — `created_at: string | null` across all tables; `date` type follows same pattern per PostgreSQL spec]

---

## Open Questions

1. **Phase 5 (TYPES-01) dependency**
   - What we know: Phase 5 is not yet complete; it is planned but not started. Phase 5 would run `supabase gen types typescript` to regenerate `database.types.ts` from the live schema.
   - What's unclear: Whether Phase 7 should wait for Phase 5 or proceed with manual `database.types.ts` edits.
   - Recommendation: Proceed with Phase 7 using manual `database.types.ts` updates. The three new columns are simple scalar types (string | null, number | null). When Phase 5 eventually runs `gen:types`, it will regenerate the file and overwrite the manual additions — but the output should be identical to the manual additions if the migration was applied correctly. No risk of regression.

2. **`ProjectCard` remains a Server Component**
   - What we know: `ProjectCard.tsx` currently has no `'use client'` directive. The OVERDUE badge requires a `new Date()` comparison.
   - What's unclear: Whether to add `'use client'` to `ProjectCard` or keep it as-is.
   - Recommendation: Keep `ProjectCard` as a Server Component. The `new Date()` comparison runs at render time on the server, which is correct and consistent. Adding `'use client'` to `ProjectCard` would make the entire projects dashboard page interactive where it doesn't need to be.

3. **`ProjectHeader` already has `'use client'`**
   - What we know: `ProjectHeader.tsx` is already a Client Component (line 1: `'use client'`). The payment props need to be passed to it from the page.
   - What's unclear: Whether `ProjectHeader` needs the full payment fields or just the overdue badge fields.
   - Recommendation: Pass `payment_due_date`, `payment_amount`, and `payment_received_at` to `ProjectHeader` along with the existing project fields. The interface already accepts a subset of `Project` fields — extend it with the three new payment fields.

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all changes are in-codebase SQL + TypeScript)

The one external action required is pushing the migration to the live Supabase instance. This requires either:
- `supabase db push` (Supabase CLI)
- Pasting the SQL into the Supabase dashboard SQL editor

Both paths are available to the developer. No new env vars required.

---

## Validation Architecture

`nyquist_validation: false` in `.planning/config.json` — Validation Architecture section SKIPPED.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `supabase.auth.getUser()` in PATCH route — existing pattern |
| V3 Session Management | no | No session changes |
| V4 Access Control | yes | `.eq('user_id', user.id)` on all DB operations — existing IDOR protection pattern |
| V5 Input Validation | yes | `allowed` whitelist in PATCH route — three new fields added to existing list |
| V6 Cryptography | no | No new crypto; `payment_received_at` is a timestamp, not sensitive data |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — patching another user's payment fields | Tampering | `.eq('user_id', user.id)` already in PATCH route — confirmed at route.ts line 33 |
| Mass assignment via PATCH body | Tampering | `allowed` whitelist at route.ts line 28 — confirmed; three new fields explicitly added |
| Injection via payment_due_date | Tampering | Supabase parameterized queries prevent SQL injection — already in effect |
| XSS via formatted date in status line | Tampering | React escapes JSX string output — no `dangerouslySetInnerHTML` in this phase |

**No new security surface beyond adding three fields to an existing PATCH whitelist.** The existing auth + IDOR + allowlist controls cover all new attack vectors.

---

## Sources

### Primary (HIGH confidence)
- Read `app/api/projects/[id]/route.ts` — exact PATCH allowed list; auth pattern; Response.json() usage
- Read `components/defense/SituationPanel.tsx` — `initialSituation` prop pattern to extend for `initialContextFields`
- Read `components/defense/DefenseDashboard.tsx` — `selectTool`, `selectedTool` state, Phase 6 analyse integration
- Read `components/project/ProjectCard.tsx` — existing badge pill style; Project type usage
- Read `components/project/ProjectHeader.tsx` — existing OVERDUE badge placement; edit toggle pattern; `router.refresh()`
- Read `app/(dashboard)/projects/[id]/page.tsx` — Server Component structure; how DefenseDashboard is rendered
- Read `supabase/migrations/001_initial.sql` — confirmed projects table schema pre-migration
- Read `supabase/migrations/004_stripe_rename.sql` — migration file style (bare ALTER TABLE)
- Read `types/index.ts` — Project type; DefenseTool union
- Read `types/database.types.ts` — confirmed payment columns absent; projects.Row/Insert/Update structure
- Read `lib/ui.ts` — `btnStyles.primary`, `btnStyles.outline`, `btnStyles.ghost`, `inputStyle`, `labelStyle`
- Read `lib/defenseTools.ts` — confirmed `payment_first`/`payment_second`/`payment_final` contextFields keys
- Read `.planning/codebase/CONVENTIONS.md` — naming patterns, inline style rule, error handling, imports
- Read `.planning/codebase/STACK.md` — Next.js 16 async params, React 19
- Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` — Server/Client prop passing pattern
- Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — PATCH handler conventions
- Read `.planning/phases/07-payment-tracking/07-CONTEXT.md` — all decisions D-01 through D-18
- Read `.planning/phases/07-payment-tracking/07-UI-SPEC.md` — component specs, interaction contracts, copy

### Secondary (MEDIUM confidence)
- Read `package.json` — confirmed no new packages needed; `gen:types` script exists

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all patterns verified in existing files
- Architecture: HIGH — all decisions locked in CONTEXT.md; sibling state lift is a standard React pattern confirmed in Next.js docs
- Pitfalls: HIGH — all pitfalls derived from reading the actual code, not assumptions

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable stack; no fast-moving dependencies)
