# Phase 7: Payment Tracking - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 11 (2 new, 9 modified)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/005_payment_tracking.sql` | migration | batch | `supabase/migrations/004_stripe_rename.sql` | exact |
| `types/database.types.ts` | config | transform | self (manual addition to projects Row/Insert/Update) | exact |
| `types/index.ts` | model | transform | self (add 3 fields to Project type) | exact |
| `app/api/projects/[id]/route.ts` | route | request-response | self (extend allowed list at line 28) | exact |
| `components/project/ProjectDetailClient.tsx` | component | event-driven | `components/defense/DefenseDashboard.tsx` (use client + useState wrapper pattern) | role-match |
| `app/(dashboard)/projects/[id]/page.tsx` | component | request-response | self (extract ProjectDetailClient, pass payment props) | exact |
| `components/project/PaymentSection.tsx` | component | CRUD | `components/project/ProjectHeader.tsx` (inline edit toggle, PATCH fetch, router.refresh) | exact |
| `components/project/ProjectCard.tsx` | component | request-response | self (add badge alongside existing badge cluster lines 40-57) | exact |
| `components/project/ProjectHeader.tsx` | component | request-response | self (add badge alongside status badge lines 110-117) | exact |
| `components/defense/DefenseDashboard.tsx` | component | event-driven | self (extend: add initialPaymentPrefill prop + useEffect, mirror selectTool pattern lines 43-55 and 117-120) | exact |
| `components/defense/SituationPanel.tsx` | component | event-driven | self (extend: add initialContextFields prop, mirror initialSituation pattern lines 12-17) | exact |

---

## Pattern Assignments

### `supabase/migrations/005_payment_tracking.sql` (migration, batch)

**Analog:** `supabase/migrations/004_stripe_rename.sql`

**Migration style pattern** (full file — 4 lines):
```sql
-- Rename Creem payment columns to Stripe equivalents
ALTER TABLE public.user_profiles
  RENAME COLUMN creem_customer_id TO stripe_customer_id;

ALTER TABLE public.user_profiles
  RENAME COLUMN creem_subscription_id TO stripe_subscription_id;
```

**Instruction:** Follow the same bare `ALTER TABLE` style — no transaction wrapper, no `BEGIN/COMMIT`, no `DO $$` block. DDL-only migrations do not need them. New file contains a single `ALTER TABLE public.projects ADD COLUMN` statement for all three columns. The existing `projects` table definition is in `supabase/migrations/001_initial.sql` lines 27-39.

**What to write:**
```sql
ALTER TABLE public.projects
  ADD COLUMN payment_due_date date,
  ADD COLUMN payment_amount numeric,
  ADD COLUMN payment_received_at timestamptz;
```

---

### `types/database.types.ts` (config, transform)

**Analog:** Self — manually add to existing `projects` Row/Insert/Update shapes.

**Existing projects.Row shape** (lines 107-119 of `types/database.types.ts`):
```ts
projects: {
  Row: {
    client_email: string | null
    client_name: string
    contract_id: string | null
    created_at: string | null
    currency: string | null
    id: string
    notes: string | null
    project_value: number | null
    status: string | null
    title: string
    user_id: string
  }
```

**Existing projects.Insert shape** (lines 120-132):
```ts
  Insert: {
    client_email?: string | null
    client_name: string
    contract_id?: string | null
    created_at?: string | null
    currency?: string | null
    id?: string
    notes?: string | null
    project_value?: number | null
    status?: string | null
    title: string
    user_id: string
  }
```

**Existing projects.Update shape** (lines 133-145):
```ts
  Update: {
    client_email?: string | null
    client_name?: string
    contract_id?: string | null
    created_at?: string | null
    currency?: string | null
    id?: string
    notes?: string | null
    project_value?: number | null
    status?: string | null
    title?: string
    user_id?: string
  }
```

**What to add** — append alphabetically in each shape (p comes before s):

- `projects.Row`: `payment_amount: number | null`, `payment_due_date: string | null`, `payment_received_at: string | null`
- `projects.Insert`: `payment_amount?: number | null`, `payment_due_date?: string | null`, `payment_received_at?: string | null`
- `projects.Update`: `payment_amount?: number | null`, `payment_due_date?: string | null`, `payment_received_at?: string | null`

**Convention note:** Supabase returns `date` columns as `"YYYY-MM-DD"` string and `timestamptz` as full ISO string — both typed as `string | null`, matching the existing `created_at: string | null` pattern at line 63.

---

### `types/index.ts` (model, transform)

**Analog:** Self — extend existing `Project` type.

**Existing Project type** (lines 70-84):
```ts
export type Project = {
  id: string
  user_id: string
  contract_id: string | null
  title: string
  client_name: string
  client_email: string | null
  project_value: number | null
  currency: string
  status: string
  notes: string | null
  created_at: string
  contracts?: { risk_score: number | null; risk_level: RiskLevel | null; analysis: ContractAnalysis | null } | null
  defense_responses?: DefenseResponse[]
}
```

**What to add** — insert after `notes: string | null` (line 80), before `created_at`:
```ts
  payment_due_date: string | null
  payment_amount: number | null
  payment_received_at: string | null
```

---

### `app/api/projects/[id]/route.ts` (route, request-response)

**Analog:** Self — extend the `allowed` array at line 28.

**Full PATCH handler** (lines 21-41):
```ts
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('projects')
    .update(updates as Database['public']['Tables']['projects']['Update'])
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ project: data })
}
```

**Auth pattern** (lines 22-25): `createServerSupabaseClient` + `supabase.auth.getUser()` + `Response.json({ error: 'Unauthorized' }, { status: 401 })` — copy exactly.

**IDOR protection** (lines 35-36): `.eq('id', id).eq('user_id', user.id)` — must remain on all DB operations.

**What to change:** Line 28 only — append three new fields:
```ts
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id', 'payment_due_date', 'payment_amount', 'payment_received_at']
```

**Response format:** Uses native `Response.json()` (not `NextResponse.json()`). Do not change this.

---

### `components/project/ProjectDetailClient.tsx` (component, event-driven) — NEW

**Analog:** `components/defense/DefenseDashboard.tsx` (use client + useState pattern, lines 1-28)

**Imports pattern from DefenseDashboard** (lines 1-14):
```ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DefenseTool, DefenseToolMeta, DefenseResponse } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { btnStyles, inputStyle } from '@/lib/ui'
```

**Pattern to copy:** Thin `'use client'` wrapper that holds shared state and passes it down to sibling client components via props.

**Core pattern for new component:**
```tsx
'use client'

import { useState } from 'react'
import { DefenseTool } from '@/types'
import PaymentSection from './PaymentSection'
import ProjectHeader from './ProjectHeader'
import DefenseDashboard from '@/components/defense/DefenseDashboard'

interface PaymentPrefill {
  tool: DefenseTool
  contextFields: Record<string, string>
}

interface ProjectDetailClientProps {
  project: /* full Project type with payment fields */
  plan: 'free' | 'pro'
  responsesUsed: number
  contract: /* contract shape from page.tsx */
}

export default function ProjectDetailClient({ project, plan, responsesUsed, contract }: ProjectDetailClientProps) {
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)

  return (
    <>
      <ProjectHeader project={project} />
      {/* ... contract strip (moved from page.tsx) ... */}
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

**Critical:** The `id="defense-dashboard"` goes on the wrapper div around `DefenseDashboard`, not inside the component itself. This is the scroll target for `PaymentSection`'s smooth-scroll.

---

### `app/(dashboard)/projects/[id]/page.tsx` (component, request-response)

**Analog:** Self — extract the JSX body into `ProjectDetailClient`, pass all data as props.

**Current structure** (lines 11-87): Server Component that fetches `project` + `profile`, then renders `ProjectHeader` + contract strip + `DefenseDashboard` directly.

**Server fetch pattern to preserve** (lines 17-25):
```ts
const [{ data: project }, { data: profile }] = await Promise.all([
  supabase
    .from('projects')
    .select('*, contracts(id, risk_score, risk_level, title)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single(),
  supabase.from('user_profiles').select('*').eq('id', user.id).single(),
])
```

**What to change:** After the fetch, render `<ProjectDetailClient project={project} plan={p?.plan ?? 'free'} responsesUsed={p?.defense_responses_used ?? 0} />` instead of the full JSX. All the existing UI (ProjectHeader, contract strip, DefenseDashboard) moves into `ProjectDetailClient`. The outer `<div style={{ padding: '2rem', maxWidth: '960px' }}>` wrapper stays in `page.tsx`.

**Import pattern** (lines 1-8):
```ts
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectDetailClient from '@/components/project/ProjectDetailClient'
import { UserProfile } from '@/types'
```

---

### `components/project/PaymentSection.tsx` (component, CRUD) — NEW

**Analog:** `components/project/ProjectHeader.tsx` (inline edit toggle, PATCH fetch, router.refresh, toast)

**Imports pattern** (copy from `ProjectHeader.tsx` lines 1-8):
```ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { btnStyles, inputStyle, labelStyle } from '@/lib/ui'
import { Project } from '@/types'
import { DefenseTool } from '@/types'
```

**Edit toggle pattern** from `ProjectHeader.tsx` (lines 28-43, 88-127):
```tsx
const [editing, setEditing] = useState(false)
const [loading, setLoading] = useState(false)

// Read view shows data + Edit button
{!editing && (
  <div>
    {/* display values */}
    <button onClick={() => setEditing(true)} style={btnStyles.outline}>Edit</button>
  </div>
)}

// Edit form toggled inline
{editing && (
  <form onSubmit={handleSave}>
    {/* inputs */}
    <button type="submit" disabled={loading} style={btnStyles.primary}>
      {loading ? 'Saving…' : 'Save Changes'}
    </button>
    <button type="button" onClick={() => setEditing(false)} style={btnStyles.ghost}>Cancel</button>
  </form>
)}
```

**PATCH fetch pattern** from `ProjectHeader.tsx` (lines 48-69):
```ts
async function handleSave(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  const res = await fetch(`/api/projects/${project.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* fields */ }),
  })
  const data = await res.json()
  setLoading(false)
  if (!res.ok) {
    setErrorMessage(data.error ?? 'Could not save changes. Please try again.')
    setErrorDialogOpen(true)
    return
  }
  setEditing(false)
  router.refresh()
  toast('Project updated')
}
```

**Badge/status pill pattern** from `ProjectHeader.tsx` (lines 111-117) and `ProjectCard.tsx` (lines 41-47):
```tsx
<span style={{
  backgroundColor: 'rgba(34,197,94,0.1)',
  color: 'var(--brand-green)',
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '0.25rem 0.75rem',
  borderRadius: '9999px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}}>
  {project.status}
</span>
```

**OVERDUE variant** (same pill, different color — derived from above):
```tsx
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

**Card container pattern** from `DefenseDashboard.tsx` (lines 140-147):
```tsx
<div style={{
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.875rem',
  padding: '1.5rem',
  marginBottom: '1rem',
}}>
```

**Currency format pattern** from `ProjectCard.tsx` (line 19):
```ts
`${project.currency} ${Number(project.project_value).toLocaleString()}`
```

**"Mark as Received" handler** — copy the PATCH fetch pattern above, with body `{ payment_received_at: new Date().toISOString() }`. On success: `router.refresh()` + `toast('Payment marked as received')`.

**"Handle Late Payment" tier + prefill logic** (no existing analog — use CONTEXT.md D-10 through D-12):
```ts
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

**Scroll pattern** (native, no library):
```ts
document.getElementById('defense-dashboard')?.scrollIntoView({ behavior: 'smooth' })
```

**Input date value pattern** (from RESEARCH.md Pitfall 4): Use `project.payment_due_date` directly as `<input type="date">` value — Supabase returns `date` columns as `"YYYY-MM-DD"` which is exactly the format the date input requires. No transformation needed.

---

### `components/project/ProjectCard.tsx` (component, request-response)

**Analog:** Self — add OVERDUE badge into the existing chip cluster.

**Existing chip cluster** (lines 40-57):
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
  <span style={{
    backgroundColor: project.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
    color: project.status === 'active' ? 'var(--brand-green)' : 'var(--text-muted)',
    fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px',
    letterSpacing: '0.05em', textTransform: 'uppercase',
  }}>
    {project.status}
  </span>
  {riskLevel && (
    <span style={{
      backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${RISK_COLORS[riskLevel]}`,
      color: RISK_COLORS[riskLevel], fontSize: '0.7rem', fontWeight: 600,
      padding: '0.2rem 0.6rem', borderRadius: '9999px',
    }}>
      Risk {riskScore}/10
    </span>
  )}
</div>
```

**What to add** — insert a third conditional `<span>` inside that same `<div>`, after the riskLevel badge:
```tsx
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

**Overdue variable** — add before the `return` statement:
```ts
const isOverdue =
  project.payment_due_date !== null &&
  project.payment_received_at === null &&
  new Date(project.payment_due_date) < new Date()
```

**Note:** `ProjectCard` has no `'use client'` directive (Server Component). The `new Date()` comparison runs server-side — this is acceptable (see RESEARCH.md Pitfall 6). Do NOT add `'use client'` to `ProjectCard`.

---

### `components/project/ProjectHeader.tsx` (component, request-response)

**Analog:** Self — add OVERDUE badge alongside the existing status badge.

**Existing read-view badge row** (lines 110-124):
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <span style={{
    backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--brand-green)',
    fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.75rem',
    borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em',
  }}>
    {project.status}
  </span>
  <button onClick={() => setEditing(true)} style={btnStyles.outline}>Edit</button>
  <button onClick={() => setDeleteDialogOpen(true)} style={btnStyles.outline}>Delete project</button>
</div>
```

**What to add** — insert the OVERDUE `<span>` directly after the status `<span>`, before the Edit button, using the same pill style with `--urgency-high` color.

**Interface extension** — `ProjectHeaderProps` (lines 13-24) needs three new optional fields:
```ts
interface ProjectHeaderProps {
  project: {
    // ... existing fields ...
    payment_due_date?: string | null
    payment_amount?: number | null
    payment_received_at?: string | null
  }
}
```

**Overdue variable** — add after the existing `useState` declarations (after line 43):
```ts
const isOverdue =
  (project.payment_due_date ?? null) !== null &&
  (project.payment_received_at ?? null) === null &&
  new Date(project.payment_due_date!) < new Date()
```

`ProjectHeader` already has `'use client'` (line 1) and `useRouter` (line 4) — no new imports needed beyond the type.

---

### `components/defense/DefenseDashboard.tsx` (component, event-driven)

**Analog:** Self — extend with `initialPaymentPrefill` prop and `useEffect` sync.

**Existing interface** (lines 15-19):
```ts
interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
}
```

**Existing selectTool pattern** (lines 43-55) — the tool-selection logic to mirror when `initialPaymentPrefill` fires:
```ts
function selectTool(tool: DefenseToolMeta) {
  if (isAtLimit) {
    setShowUpgrade(true)
    return
  }
  if (selectedTool?.type === tool.type) {
    setSelectedTool(null)
    setResponse(null)
  } else {
    setSelectedTool(tool)
    setResponse(null)
  }
}
```

**Existing tool-match pattern** (lines 117-120) — exact pattern to copy for payment prefill:
```ts
const matchedTool = DEFENSE_TOOLS.find(t => t.type === data.tool_type)
if (matchedTool) {
  selectTool(matchedTool)
}
```

**Existing `initialSituation` prop usage** (lines 274-282) — how props are threaded into SituationPanel:
```tsx
{selectedTool && !response && (
  <SituationPanel
    tool={selectedTool}
    onGenerate={handleGenerate}
    onClose={() => { setSelectedTool(null); setResponse(null) }}
    loading={loading}
    initialSituation={analysisResult?.situation_context}
  />
)}
```

**What to add:**

1. Extend `DefenseDashboardProps` interface:
```ts
interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
  initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }
}
```

2. Add `useEffect` import (already has `useState` — add `useEffect` to the React import at line 3):
```ts
import { useState, useEffect } from 'react'
```

3. Add `useEffect` inside the component body (after existing `useState` declarations):
```ts
useEffect(() => {
  if (initialPaymentPrefill) {
    const matchedTool = DEFENSE_TOOLS.find(t => t.type === initialPaymentPrefill.tool)
    if (matchedTool) {
      setSelectedTool(matchedTool)
      setResponse(null)
    }
  }
}, [initialPaymentPrefill])
```

4. Thread `initialContextFields` into `SituationPanel` call (line 275 — extend the existing JSX):
```tsx
<SituationPanel
  tool={selectedTool}
  onGenerate={handleGenerate}
  onClose={() => { setSelectedTool(null); setResponse(null) }}
  loading={loading}
  initialSituation={analysisResult?.situation_context}
  initialContextFields={initialPaymentPrefill?.contextFields}
/>
```

---

### `components/defense/SituationPanel.tsx` (component, event-driven)

**Analog:** Self — extend `initialSituation` prop pattern (lines 12-17) to `initialContextFields`.

**Existing interface and init pattern** (lines 7-17):
```ts
interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
  initialSituation?: string
}

export default function SituationPanel({ tool, onGenerate, onClose, loading, initialSituation }: SituationPanelProps) {
  const [situation, setSituation] = useState(initialSituation ?? '')
  const [extra, setExtra] = useState<Record<string, string>>({})
```

**What to add:**

1. Add `useEffect` to React import (currently only `useState` imported at line 3):
```ts
import { useState, useEffect } from 'react'
```

2. Extend interface — add after `initialSituation?`:
```ts
initialContextFields?: Record<string, string>
```

3. Add to destructure params (line 15) — add `initialContextFields`:
```ts
export default function SituationPanel({ tool, onGenerate, onClose, loading, initialSituation, initialContextFields }: SituationPanelProps) {
```

4. Change the `extra` useState initializer (line 17) and add `useEffect` to sync on prop changes:
```ts
const [extra, setExtra] = useState<Record<string, string>>(initialContextFields ?? {})

useEffect(() => {
  if (initialContextFields) setExtra(initialContextFields)
}, [initialContextFields])
```

**No other changes needed** — the existing `extra` state is already used in `handleSubmit` (lines 21-27) and the context field inputs (lines 69-85) without modification.

---

## Shared Patterns

### Auth check
**Source:** `app/api/projects/[id]/route.ts` lines 6-8
**Apply to:** All route handlers (no new routes in this phase — PATCH is existing)
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### IDOR protection
**Source:** `app/api/projects/[id]/route.ts` lines 35-36
**Apply to:** All DB mutations
```ts
.eq('id', id)
.eq('user_id', user.id)
```

### Inline style conventions
**Source:** `lib/ui.ts` (full file), `components/project/ProjectHeader.tsx`
**Apply to:** All new components (`PaymentSection`, `ProjectDetailClient`)
- Layout: `style={{}}` with CSS custom properties only
- Hover/transition states: Tailwind utility classes (e.g. `className="hover:text-white transition-colors"`)
- No Tailwind for layout, spacing, or color
- Button styles: import from `btnStyles` in `lib/ui.ts`
- Input styles: import from `inputStyle` / `labelStyle` in `lib/ui.ts`

### PATCH fetch + router.refresh + toast
**Source:** `components/project/ProjectHeader.tsx` lines 48-69
**Apply to:** `PaymentSection.tsx` (all mutation handlers)
```ts
const res = await fetch(`/api/projects/${project.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* fields */ }),
})
const data = await res.json()
setLoading(false)
if (!res.ok) {
  // show error message
  return
}
router.refresh()
toast('...')
```

### Loading state on buttons
**Source:** `components/project/ProjectHeader.tsx` lines 232-238
**Apply to:** `PaymentSection.tsx` all async-triggered buttons
```tsx
<button
  type="submit"
  disabled={loading}
  style={{ ...btnStyles.primary, ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
>
  {loading ? 'Saving…' : 'Save Changes'}
</button>
```

### CSS color variables
**Source:** `components/project/ProjectHeader.tsx` (inline styles throughout), `lib/ui.ts`
**Apply to:** All new/modified components
- Overdue red: `var(--urgency-high)` with `rgba(239, 68, 68, 0.1)` background
- Received green: `var(--brand-green)` with `rgba(34,197,94,0.1)` background
- Primary CTA (lime): `var(--brand-lime)` via `btnStyles.primary`
- Secondary text: `var(--text-secondary)`
- Muted text: `var(--text-muted)`
- Card surface: `var(--bg-surface)` with `1px solid var(--bg-border)` border

### Next.js 16 async params
**Source:** `app/api/projects/[id]/route.ts` lines 4, 21, 43 and `app/(dashboard)/projects/[id]/page.tsx` line 11
**Apply to:** Any route or page touching `params`
```ts
// Route handler
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
// Page
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
```

---

## No Analog Found

All files have analogs. No entries.

---

## Metadata

**Analog search scope:** `app/`, `components/`, `supabase/migrations/`, `types/`, `lib/`
**Files read:** 12
**Pattern extraction date:** 2026-04-24
