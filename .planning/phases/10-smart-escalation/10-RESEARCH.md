# Phase 10: Smart Escalation - Research

**Researched:** 2026-04-25
**Domain:** React component prop extension, Next.js App Router searchParams, Supabase joined query extension, pure derived state computation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Surface ALL THREE alert types: overdue payments, ghost clients, and stalled projects.

**D-02:** Detection logic:
- **Overdue payment:** `payment_due_date < today` AND `payment_received_at IS NULL`
- **Payment due soon:** `payment_due_date` within 3 days AND `payment_received_at IS NULL`
- **Ghost client:** most recent defense_response with `tool_type = 'ghost_client'` AND `was_sent = true` AND `created_at` > 5 business days ago
- **Stalled:** most recent defense_response with `tool_type IN ('payment_first', 'payment_second')` AND `was_sent = true` AND `created_at` > 7 days AND `payment_received_at IS NULL`

**D-03:** Dashboard Supabase query must add `was_sent` to the `defense_responses` join: `defense_responses(id, tool_type, created_at, was_sent)`.

**D-04:** Show section only when items exist. Each row: project name, client name, description, days overdue/remaining, "Handle now →" link. UI: compact alert row, lime left border for due-soon, red left border for overdue, amber/muted border for ghost/stalled.

**D-05:** "Handle now →" links to `/projects/[id]?tool=<DefenseTool>`. Tool selection logic:
- Payment overdue → `?tool=payment_first` or `payment_second` if `payment_first` already sent
- Ghost client → `?tool=ghost_client`
- Stalled (payment_first sent) → `?tool=payment_second`
- Stalled (payment_second sent) → `?tool=payment_final`

**D-06:** `DefenseDashboard` reads a new `autoSelectTool?: DefenseTool` prop. Project page passes from URL search param. On mount, `useEffect` calls `selectTool()` with matching `DefenseToolMeta`.

**D-07:** Project page query extended server-side: `select('*, contracts(id, risk_score, risk_level, title), defense_responses(id, tool_type, created_at, was_sent)')`.

**D-08:** Escalation nudge in `ProjectDetailClient` when: most recent `payment_first` or `payment_second` where `was_sent = true` was created >7 days ago AND `payment_received_at IS NULL`.

**D-09:** Nudge button: `payment_first` → selects `payment_second`, `payment_second` → selects `payment_final`. Uses `autoSelectTool` prop on `DefenseDashboard`.

**D-10:** Single card style for all 20 tool types. No visual distinction between action/non-action tools.

**D-11:** Card below action buttons row in `ResponseOutput`. Dark surface (`var(--bg-surface)`), thin border (`var(--bg-border)`), small text in `text-[#52525b]`. No lime accent.

**D-12:** No dismiss button.

**D-13:** No button inside card for non-action tools — text-only guidance.

**D-14:** `NextStepCard` is a new extracted component `components/defense/NextStepCard.tsx` accepting `toolType: DefenseTool`.

### Claude's Discretion
- Exact wording/refinement of next-step strings (use plan strings verbatim unless grammatical cleanup needed)
- "Handle now →" as link vs button (keep as link)
- Fade-in animation timing for Needs Attention section (match existing dashboard fade-up pattern)
- `AttentionAlert` co-location: local in dashboard if only used there

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 10 is a pure UI/data-wiring phase — no new API routes, no schema changes, no new server-side state. Everything the phase needs is already in the data model (`was_sent`, `payment_due_date`, `payment_received_at`, `tool_type`, `created_at`) and the component architecture (prop-drilling pattern established in Phase 07 with `initialPaymentPrefill`).

The work is: (1) extend two Supabase selects to include `was_sent`; (2) add `autoSelectTool` prop to `DefenseDashboard` following the `initialPaymentPrefill` `useEffect` pattern exactly; (3) add `toolType` prop to `ResponseOutput` and render `NextStepCard`; (4) compute "Needs Attention" derived state from already-fetched project data in the dashboard Server Component; (5) compute escalation nudge from `project.defense_responses` in `ProjectDetailClient`.

The single non-trivial algorithmic piece is the "5 business days" ghost client detection, which requires computing business days manually — no `date-fns` is installed. A simple inline function (skip Sat/Sun) is the correct pattern here.

**Primary recommendation:** Follow the `initialPaymentPrefill` prop-flow pattern exactly. Every new pattern in this phase is a structural parallel to already-working Phase 07 code. Read those patterns before writing any new code.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Needs Attention computation | Frontend Server (SSR) | — | Pure derived state from already-fetched Supabase data; no client JS needed |
| "Handle now →" deep-link | Browser / Client | — | `<Link>` component; navigation only |
| URL param → tool pre-selection | Frontend Server (SSR) + Browser | — | Server reads `searchParams`, passes `autoSelectTool` prop to Client Component |
| `autoSelectTool` prop wiring | Browser / Client | — | `useEffect` in `DefenseDashboard` calls `selectTool()` on mount |
| NextStepCard render | Browser / Client | — | Rendered inside `ResponseOutput` (already `'use client'`) |
| Escalation nudge computation | Browser / Client | — | In `ProjectDetailClient` which already holds client-side state |
| Dashboard query extension | Frontend Server (SSR) | — | Add `was_sent` to existing Supabase join select |
| Project page query extension | Frontend Server (SSR) | — | Add `defense_responses` to existing Supabase join |

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.4 | Server Components, searchParams, routing | Already in use |
| React | 19.2.4 | Client Component state and effects | Already in use |
| TypeScript | 5.9.3 | Type safety for new props | Already in use |
| `@supabase/ssr` | 0.10.2 | Server-side Supabase queries | Already in use |
| `lucide-react` | 1.9.0 | Icons for AttentionAlert | Already in use |

[VERIFIED: package.json]

### No New Libraries Needed

All capabilities in this phase are implemented with existing dependencies. The ghost-client "5 business days" calculation is a simple inline utility — no `date-fns` required (and it is not installed).

[VERIFIED: node_modules inspection]

---

## Architecture Patterns

### System Architecture Diagram

```
URL: /projects/[id]?tool=payment_second
       |
       v
[Server: projects/[id]/page.tsx]
  - await params (id)
  - await searchParams (tool=payment_second)
  - Supabase: select('*, contracts(...), defense_responses(id,tool_type,created_at,was_sent)')
  - validate tool against DEFENSE_TOOL_VALUES
  - pass autoSelectTool={tool} to ProjectDetailClient
       |
       v
[ProjectDetailClient — 'use client']
  - compute escalation nudge from project.defense_responses
  - state: autoSelectTool (from nudge button OR from prop)
  - pass autoSelectTool to DefenseDashboard
       |
       v
[DefenseDashboard — 'use client']
  - useEffect: if autoSelectTool → find matching meta → selectTool(meta)
  - on generate success: setResponse({text, id, contractClausesUsed})
  - pass selectedTool.type to ResponseOutput as toolType
       |
       v
[ResponseOutput — 'use client']
  - renders response text, Copy, Mark as Sent buttons
  - renders <NextStepCard toolType={toolType} /> below buttons


Dashboard page:
[Server: dashboard/page.tsx]
  - Supabase: select('*, contracts(...), defense_responses(id,tool_type,created_at,was_sent)')
  - compute overdueProjects, dueSoonProjects, ghostProjects, stalledProjects (pure derived)
  - if any: render "Needs attention" section
  - each row: <AttentionAlert project={...} alertType={...} tool={...} />
       |
       v
[AttentionAlert — pure presentational, no client state]
  - compact row with colored left border
  - <Link href={/projects/[id]?tool=...}>Handle now →</Link>
```

### Recommended Project Structure (additions only)

```
components/defense/
├── NextStepCard.tsx        # NEW: toolType: DefenseTool → next-step guidance text
├── ResponseOutput.tsx      # MODIFIED: add toolType prop, render NextStepCard
└── DefenseDashboard.tsx    # MODIFIED: add autoSelectTool prop, pass toolType

components/shared/
└── AttentionAlert.tsx      # NEW (or local): compact alert row for dashboard

app/(dashboard)/dashboard/
└── page.tsx                # MODIFIED: add was_sent to join, add Needs Attention section

app/(dashboard)/projects/[id]/
└── page.tsx                # MODIFIED: add defense_responses join + searchParams

components/project/
└── ProjectDetailClient.tsx # MODIFIED: add escalation nudge + autoSelectTool state
```

### Pattern 1: `autoSelectTool` prop — useEffect on mount

Directly parallels `initialPaymentPrefill` in `DefenseDashboard`. The existing useEffect pattern:

```typescript
// Source: components/defense/DefenseDashboard.tsx (verified in codebase)
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

The `autoSelectTool` implementation follows this pattern exactly:

```typescript
// Source: pattern derived from initialPaymentPrefill above [VERIFIED: codebase]
useEffect(() => {
  if (autoSelectTool) {
    const matchedTool = DEFENSE_TOOLS.find(t => t.type === autoSelectTool)
    if (matchedTool) {
      selectTool(matchedTool)  // use selectTool() not setSelectedTool() to respect isAtLimit gate
    }
  }
}, [autoSelectTool])
```

**Critical detail from STATE.md:** Phase 07 D-07 used `setSelectedTool` directly (not `selectTool()`) to bypass the isAtLimit gate for payment prefill because the user explicitly triggered it. For `autoSelectTool` from a URL param or nudge button, the same bypass reasoning applies — the user explicitly clicked "Handle now". Use `setSelectedTool(matchedTool); setResponse(null)` directly to bypass the gate, matching the existing pattern.

[VERIFIED: components/defense/DefenseDashboard.tsx, .planning/STATE.md Phase 07 D-07]

### Pattern 2: searchParams in Server Component page (Next.js 16)

`searchParams` is a `Promise` in Next.js 15+ (including 16). Must be awaited:

```typescript
// Source: Next.js node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md [VERIFIED]
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const toolParam = typeof sp.tool === 'string' ? sp.tool : undefined
  // validate against DEFENSE_TOOL_VALUES before passing to client
  const autoSelectTool = toolParam && DEFENSE_TOOL_VALUES.includes(toolParam)
    ? toolParam as DefenseTool
    : undefined
  ...
}
```

**Key: `searchParams` opts a page into dynamic rendering** — this is correct behavior for project pages which already fetch user-specific data and use auth. No additional configuration needed.

[VERIFIED: Next.js docs in node_modules]

### Pattern 3: Needs Attention computation — pure derived state in Server Component

No `useState`, no `useEffect`. Compute synchronously from the `projects` array returned by Supabase:

```typescript
// Source: derived from existing pattern in ProjectCard.tsx and PaymentSection.tsx [VERIFIED: codebase]
const today = new Date()
today.setHours(0, 0, 0, 0)

const overdueProjects = (projects ?? []).filter(p =>
  p.payment_due_date &&
  !p.payment_received_at &&
  new Date(p.payment_due_date) < today
)

const dueSoonProjects = (projects ?? []).filter(p => {
  if (!p.payment_due_date || p.payment_received_at) return false
  const due = new Date(p.payment_due_date)
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
  return diff >= 0 && diff <= 3
})

// Ghost client: most recent ghost_client response was_sent=true AND > 5 business days ago
const ghostProjects = (projects ?? []).filter(p => {
  const responses = (p.defense_responses ?? []) as Array<{tool_type: string; was_sent: boolean; created_at: string}>
  const mostRecent = responses
    .filter(r => r.tool_type === 'ghost_client' && r.was_sent)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  if (!mostRecent) return false
  return businessDaysSince(new Date(mostRecent.created_at)) > 5
})

// Stalled: most recent payment_first or payment_second was_sent=true AND > 7 calendar days AND payment not received
const stalledProjects = (projects ?? []).filter(p => {
  if (p.payment_received_at) return false
  const responses = (p.defense_responses ?? []) as Array<{tool_type: string; was_sent: boolean; created_at: string}>
  const mostRecent = responses
    .filter(r => ['payment_first', 'payment_second'].includes(r.tool_type) && r.was_sent)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  if (!mostRecent) return false
  const daysSince = Math.floor((today.getTime() - new Date(mostRecent.created_at).getTime()) / 86400000)
  return daysSince > 7
})
```

[VERIFIED: logic derived from existing patterns in PaymentSection.tsx and ProjectCard.tsx]

### Pattern 4: Business day calculation (no date-fns)

`date-fns` is not installed. Implement inline:

```typescript
// Source: plain arithmetic, no library needed [VERIFIED: date-fns absent from node_modules]
function businessDaysSince(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let count = 0
  const cursor = new Date(date)
  cursor.setHours(0, 0, 0, 0)
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count++ // skip Sunday (0) and Saturday (6)
  }
  return count
}
```

Place this function either at the top of `dashboard/page.tsx` (if Server Component, no import needed) or in `lib/utils.ts` alongside `timeAgo`.

[VERIFIED: date-fns not in node_modules; existing timeAgo pattern in lib/utils.ts]

### Pattern 5: "Handle now →" deep-link tool selection logic

The tool chosen for the link depends on what payment responses have already been sent:

```typescript
// Source: D-05 from CONTEXT.md [VERIFIED: 10-CONTEXT.md]
function getHandleNowTool(project: Project & { defense_responses?: Array<{tool_type: string; was_sent: boolean}> }): DefenseTool {
  const responses = project.defense_responses ?? []
  const sentTypes = new Set(responses.filter(r => r.was_sent).map(r => r.tool_type))
  if (sentTypes.has('payment_first')) return 'payment_second'
  return 'payment_first'
}

// Ghost → always ghost_client
// Stalled: check which payment tool was most recently sent
function getStalledNextTool(mostRecentSentType: string): DefenseTool {
  if (mostRecentSentType === 'payment_first') return 'payment_second'
  return 'payment_final'
}
```

[VERIFIED: 10-CONTEXT.md D-05]

### Pattern 6: `toolType` prop on ResponseOutput + NextStepCard

```typescript
// Source: 10-PLAN.md and 10-CONTEXT.md [VERIFIED]
// NextStepCard.tsx — pure presentational, no state
interface NextStepCardProps {
  toolType: DefenseTool
}

const NEXT_STEP_TEXT: Record<DefenseTool, string> = {
  payment_first: "If no payment in 7 days: send the firm follow-up. Come back and use 'Payment Follow-Up'.",
  payment_second: "If still no payment in 7 more days: send the final notice. Come back and use 'Final Payment Notice'.",
  payment_final: "If still unpaid: consider small claims or a collections agency. Keep all records.",
  ghost_client: "If no response in 5 business days: project is formally paused. Document the silence.",
  scope_change: "If they push back: stand firm or offer to quote the addition. Don't start the work.",
  moving_goalposts: "If they insist: this is new scope. Do not continue without a revised agreement.",
  chargeback_threat: "Immediately: gather and save all evidence of delivery — files sent, approvals received, communications.",
  review_threat: "Do not negotiate under threat. Document everything. Your response is on record.",
  // all others:
  revision_limit: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  kill_fee: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  delivery_signoff: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  dispute_response: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  feedback_stall: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  discount_pressure: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  retroactive_discount: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  rate_increase_pushback: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  rush_fee_demand: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  ip_dispute: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  spec_work_pressure: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
  post_handoff_request: "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'.",
}
```

Card style (D-11): `var(--bg-surface)` background, `var(--bg-border)` border, `text-[#52525b]` text color (which is `var(--text-muted)` = `#52525b` per globals.css). No lime accent. Render below the action buttons row (`<div className="flex items-center gap-3 mt-5">`).

[VERIFIED: 10-CONTEXT.md D-10–D-14; globals.css --text-muted: #52525b]

### Pattern 7: Escalation nudge in ProjectDetailClient

State-lift pattern: `ProjectDetailClient` already holds `paymentPrefill` state and passes it to `DefenseDashboard`. `autoSelectTool` follows the same shape:

```typescript
// Source: derived from existing paymentPrefill pattern [VERIFIED: ProjectDetailClient.tsx]
const [autoSelectTool, setAutoSelectTool] = useState<DefenseTool | undefined>(
  initialAutoSelectTool  // passed from page.tsx searchParams
)

// Escalation nudge computation (read from project.defense_responses):
const paymentResponses = (project.defense_responses ?? [])
  .filter(r => ['payment_first', 'payment_second'].includes(r.tool_type) && r.was_sent)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
const mostRecentPayment = paymentResponses[0]
const daysSinceMostRecent = mostRecentPayment
  ? Math.floor((Date.now() - new Date(mostRecentPayment.created_at).getTime()) / 86400000)
  : 0
const showEscalationNudge =
  !!mostRecentPayment &&
  daysSinceMostRecent > 7 &&
  !project.payment_received_at

const escalationNextTool: DefenseTool = mostRecentPayment?.tool_type === 'payment_first'
  ? 'payment_second'
  : 'payment_final'
```

[VERIFIED: 10-CONTEXT.md D-07–D-09; ProjectDetailClient.tsx]

### Anti-Patterns to Avoid

- **Don't fetch defense_responses separately in client**: The page query extension (D-07) provides all needed data server-side. No `useEffect` + `fetch` in ProjectDetailClient.
- **Don't use `date-fns`**: Not installed. Implement business day calculation inline.
- **Don't call `selectTool()` for `autoSelectTool`**: Use `setSelectedTool(matchedTool); setResponse(null)` directly (matching Phase 07 D-07 `initialPaymentPrefill` pattern) to bypass the isAtLimit gate. The user explicitly navigated to this URL or clicked the nudge.
- **Don't add a `useEffect` dependency on `autoSelectTool` that fires repeatedly**: The `useEffect` for autoSelectTool should only fire once (on mount or when the prop changes). Use the same dependency array pattern as `initialPaymentPrefill`.
- **Don't add `was_sent` to the projects list page** (`app/(dashboard)/projects/page.tsx`): Only the dashboard page (`app/(dashboard)/dashboard/page.tsx`) and project detail page need `was_sent`. The projects list page has a separate select that only needs `id, tool_type, created_at` for `timeAgo` display.
- **Don't put Needs Attention logic in a Client Component**: Compute entirely in the Server Component. The derived state is plain JS array filtering — no reactivity needed.
- **Don't show ghost/stalled projects that are also "overdue"**: A project could match multiple categories. Deduplicate by showing each project once, using the most urgent alert type. Priority: overdue > due-soon > stalled > ghost.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Business day counting | Custom calendar library | Inline `businessDaysSince()` function | Simple skip-Sat/Sun loop; no holidays needed per spec |
| Tool label display | Custom label map | `DEFENSE_TOOLS.find(t => t.type === ...).label` | Already maintained in `lib/defenseTools.ts` |
| Date math | Install `date-fns` | Native `Date` arithmetic | Already used throughout codebase (PaymentSection.tsx, ProjectCard.tsx) |
| Navigation with tool param | `router.push()` | `<Link href={...}>` | Server-rendered links don't require client JS; consistent with dashboard CTA style |

**Key insight:** Every hard problem in this phase was solved in prior phases. The pattern library in the existing codebase covers everything. Match existing patterns; don't invent new ones.

---

## Common Pitfalls

### Pitfall 1: `selectTool()` vs `setSelectedTool()` for auto-selection

**What goes wrong:** Calling `selectTool()` for `autoSelectTool` triggers the `isAtLimit` check and shows the upgrade wall instead of auto-selecting the tool.

**Why it happens:** `selectTool()` has the gate check: `if (isAtLimit) { setShowUpgrade(true); return }`. The `initialPaymentPrefill` useEffect in Phase 07 was deliberately changed to `setSelectedTool(matchedTool)` directly to bypass this (STATE.md Phase 07 D-07).

**How to avoid:** In the `autoSelectTool` useEffect, call `setSelectedTool(matchedTool); setResponse(null)` directly, NOT `selectTool(matchedTool)`.

**Warning signs:** Free-tier users with `isAtLimit=true` see the upgrade wall when navigating to a project via "Handle now →".

[VERIFIED: DefenseDashboard.tsx, STATE.md Phase 07 D-07]

### Pitfall 2: Duplicate projects in Needs Attention

**What goes wrong:** A project with an overdue payment AND a sent ghost_client response appears twice in the section.

**Why it happens:** Computing separate arrays for each alert type then rendering all of them without deduplication.

**How to avoid:** Either deduplicate by project ID before rendering, or collect items in a single pass with priority ordering (overdue > due-soon > stalled > ghost). Each project appears once, with the highest-priority alert type.

**Warning signs:** A project listed twice in the Needs Attention section during manual testing.

### Pitfall 3: `searchParams` typing — `string | string[] | undefined`

**What goes wrong:** `sp.tool` may be `string[]` if someone appends `?tool=x&tool=y`. Passing an array as `DefenseTool` causes a TypeScript error or incorrect behavior.

**Why it happens:** Next.js `searchParams` types each param as `string | string[] | undefined`.

**How to avoid:** Always guard: `typeof sp.tool === 'string' ? sp.tool : undefined` before using the value.

[VERIFIED: Next.js docs page.md in node_modules]

### Pitfall 4: Dashboard section rendered when all arrays are empty

**What goes wrong:** "Needs attention" header renders with no rows — visual noise.

**Why it happens:** Wrapping guard checks individual arrays but misses the case where all arrays happen to be empty at render time.

**How to avoid:** Compute a single `hasAttentionItems` boolean: `overdueProjects.length + dueSoonProjects.length + ghostProjects.length + stalledProjects.length > 0`. Only render the section when this is true.

**Warning signs:** "Needs attention" header with empty space below it on the dashboard.

### Pitfall 5: Ghost/stalled detection uses wrong `defense_responses` ordering

**What goes wrong:** Using `responses[0]` as the most recent — but Supabase join order is not guaranteed unless an explicit order is set.

**Why it happens:** The join select `defense_responses(id, tool_type, created_at, was_sent)` does not specify an order. The first element of the array is not necessarily the most recent.

**How to avoid:** Always sort the filtered responses by `created_at` descending before taking `[0]`: `.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]`.

**Warning signs:** Ghost/stalled detection fires for old responses, not the most recent one.

### Pitfall 6: `autoSelectTool` state initialization conflict

**What goes wrong:** `ProjectDetailClient` initializes `autoSelectTool` from the URL param prop, but the escalation nudge button also sets `autoSelectTool`. If the state is initialized once and not updated, clicking the nudge button has no effect when the URL param is already set.

**Why it happens:** `useState` initial value runs once. If `autoSelectTool` is already set to a URL-param tool and the user clicks a nudge for a different tool, the state doesn't re-trigger the `useEffect` in `DefenseDashboard` because the value hasn't changed.

**How to avoid:** Design the state so nudge button always produces a tool value change. The URL param sets the initial state; the nudge button always overrides it. This works naturally if the URL param and nudge lead to different tools (e.g., URL param = `payment_second`, nudge also = `payment_second` — no conflict since they agree).

---

## Code Examples

### DefenseDashboard: full prop interface additions

```typescript
// Source: components/defense/DefenseDashboard.tsx (current) + Phase 10 additions [VERIFIED: codebase]
interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
  initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }
  hasContract?: boolean
  contractRiskLevel?: RiskLevel
  autoSelectTool?: DefenseTool  // NEW: Phase 10
}
```

### ResponseOutput: full prop interface additions

```typescript
// Source: components/defense/ResponseOutput.tsx (current) + Phase 10 additions [VERIFIED: codebase]
interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
  contractClausesUsed?: string[]
  toolType: DefenseTool  // NEW: Phase 10 — not optional, always available when response exists
}
```

Note: `toolType` is non-optional in `ResponseOutput` because `ResponseOutput` is only rendered when `response && selectedTool` are both set in `DefenseDashboard`. `selectedTool.type` is always a valid `DefenseTool` at that point.

[VERIFIED: DefenseDashboard.tsx render block `{response && (<ResponseOutput .../>)}`]

### AttentionAlert: component shape

```typescript
// Source: derived from 10-CONTEXT.md D-04 [VERIFIED]
interface AttentionAlertProps {
  projectId: string
  projectTitle: string
  clientName: string
  alertType: 'overdue' | 'due-soon' | 'ghost' | 'stalled'
  description: string      // "Payment 12 days overdue"
  tool: DefenseTool        // for constructing the href
}
// renders <Link href={`/projects/${projectId}?tool=${tool}`}>Handle now →</Link>
// border color: lime for due-soon, red (urgency-high) for overdue, amber (#f59e0b) for ghost/stalled
```

### Dashboard page: animation for Needs Attention section

The existing dashboard uses `fade-up` + `animationDelay` on project cards. Use the same class for the Needs Attention section:

```tsx
// Source: app/(dashboard)/dashboard/page.tsx existing pattern [VERIFIED]
<div className="fade-up" style={{ animationDelay: '0.05s' }}>
  {/* Needs Attention section */}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` is synchronous | `params` and `searchParams` are Promises — must be awaited | Next.js 15.0.0-RC | Project page must `await searchParams` |
| `initialPaymentPrefill` only pre-selects one specific tool | `autoSelectTool: DefenseTool` generalizes to all 20 tools | Phase 10 | Any tool can be URL-deep-linked |

**Deprecated/outdated:**
- Synchronous `params`/`searchParams` access: deprecated in Next.js 15+; codebase already uses async pattern (confirmed in `dashboard/page.tsx`).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `autoSelectTool` useEffect should bypass `isAtLimit` gate (use `setSelectedTool` not `selectTool`) | Pattern 1 | Free-limit users see upgrade wall when clicking "Handle now →" |
| A2 | Projects list page (`app/(dashboard)/projects/page.tsx`) does NOT need `was_sent` extended | Anti-Patterns | Missing data if projects page is later expected to show attention badges |
| A3 | Deduplication priority: overdue > due-soon > stalled > ghost | Common Pitfalls | Projects appear with lower-priority alert type; lower business impact |

A1 is cross-referenced with STATE.md Phase 07 D-07 (HIGH confidence). A2 and A3 are design decisions stated in CONTEXT.md (HIGH confidence).

---

## Open Questions

1. **Ghost client detection: projects list page vs dashboard only**
   - What we know: D-01 and CONTEXT.md "Out of scope" explicitly state ghost/stalled detection appears only on the dashboard, not the projects list page.
   - What's unclear: Nothing — this is locked.
   - Recommendation: Do not add ghost/stalled detection to the projects list page.

2. **Needs Attention: empty section when ALL projects need attention**
   - What we know: Section shows "only when items exist" (D-04). No edge case for "no projects at all" — that case shows the existing empty state for the projects list.
   - What's unclear: Nothing — standard conditional render.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v25.4.0 | — |
| TypeScript | Type checking | Yes | 5.9.3 | — |
| Next.js | App Router searchParams | Yes | 16.2.4 | — |
| Supabase SSR | DB queries | Yes | 0.10.2 | — |
| `date-fns` | Business day calculation | No | — | Inline function (no library needed) |

[VERIFIED: node --version, npx tsc --version, package.json]

**Missing dependencies with no fallback:** None — all needed capabilities are available or implementable inline.

---

## Validation Architecture

`nyquist_validation` is set to `false` in `.planning/config.json` — this section is skipped.

---

## Security Domain

This phase adds no new API routes, no new auth flows, no new data persistence paths. All new UI is derived state from already-authenticated server queries. No ASVS categories newly applicable.

The `searchParams.tool` validation (checking against `DEFENSE_TOOL_VALUES` before using as `DefenseTool`) is important to prevent unexpected behavior if a user manually edits the URL — but the risk is limited to incorrect tool pre-selection, not a security vulnerability (no data is written based on the param value).

---

## Sources

### Primary (HIGH confidence)
- `components/defense/DefenseDashboard.tsx` — existing prop patterns, initialPaymentPrefill useEffect, selectTool/setSelectedTool distinction
- `components/defense/ResponseOutput.tsx` — current props, action buttons layout, contractClausesUsed pattern
- `app/(dashboard)/dashboard/page.tsx` — existing Supabase query, fade-up animation pattern
- `app/(dashboard)/projects/[id]/page.tsx` — current select, searchParams as Promise<> (already typed in dashboard/page.tsx)
- `components/project/ProjectDetailClient.tsx` — paymentPrefill state pattern, DefenseDashboard prop passing
- `components/project/PaymentSection.tsx` — isOverdue logic, days arithmetic, buildPaymentPrefill pattern
- `types/index.ts` — DefenseTool union (20 values verified), DefenseResponse (was_sent confirmed)
- `lib/defenseTools.ts` — DEFENSE_TOOLS (20 tools confirmed), DEFENSE_TOOL_VALUES
- `lib/utils.ts` — timeAgo helper, businessDaysSince placement candidate
- `app/globals.css` — fade-up, response-enter, CSS custom properties (--text-muted: #52525b confirmed)
- `lib/ui.ts` — btnStyles, RISK_COLORS, color constants
- `.planning/STATE.md` — Phase 07 D-07: setSelectedTool directly (not selectTool) for payment prefill
- `.planning/phases/10-smart-escalation/10-CONTEXT.md` — all decisions D-01 through D-14
- `.planning/phases/10-smart-escalation/10-PLAN.md` — next-step strings, file change list
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — searchParams as Promise, type: `string | string[] | undefined`

### Secondary (MEDIUM confidence)
- Node.js Date arithmetic patterns for business day calculation — standard JS, no library reference needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via package.json and node_modules
- Architecture: HIGH — patterns directly read from existing working codebase
- Pitfalls: HIGH — most pitfalls verified against actual code (selectTool vs setSelectedTool confirmed via STATE.md + codebase)
- Business day calculation: HIGH — date-fns absence confirmed, inline approach matches existing codebase date math style

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable stack — no fast-moving dependencies introduced)
