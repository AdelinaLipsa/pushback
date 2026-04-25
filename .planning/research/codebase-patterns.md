# Codebase Patterns — Pushback

**Date:** 2026-04-25
**Purpose:** Exact patterns for implementing new features in this Next.js 16 / Supabase / Tailwind v4 / Claude API codebase.

---

## 1. Defense Tool Pattern — End-to-End

Adding a new tool requires touching exactly four files, in this order:

### Step 1 — `types/index.ts`

Add the new string literal to the `DefenseTool` union:

```typescript
export type DefenseTool =
  | 'scope_change'
  | 'payment_first'
  // ...
  | 'YOUR_NEW_TOOL'   // ← add here
```

### Step 2 — `lib/defenseTools.ts`

Append to the `DEFENSE_TOOLS` array. Every entry must conform to `DefenseToolMeta`:

```typescript
{
  type: 'YOUR_NEW_TOOL',           // must match DefenseTool union
  label: 'Human-Readable Label',
  description: 'One-line description shown on the card',
  icon: 'LucideIconName',          // must exist in DefenseToolCard's ICON_MAP
  urgency: 'low' | 'medium' | 'high',
  contextFields: [
    {
      key: 'field_key',            // sent as extra_context to API
      label: 'UI label',
      placeholder: 'hint text',
      type: 'text' | 'number' | 'date',
      required: false              // all existing tools set this false
    }
  ]
}
```

Icons currently mapped in `DefenseToolCard.tsx`: `Layers`, `Clock`, `AlertTriangle`, `Ban`, `RefreshCw`, `XCircle`, `CheckCircle2`, `ShieldAlert`. New icons must be added to the `ICON_MAP` in that file and imported from `lucide-react`.

### Step 3 — `lib/anthropic.ts`

The `DEFENSE_SYSTEM_PROMPT` constant includes a `TONE BY TOOL:` block. Add a section:

```
YOUR_NEW_TOOL:
<Tone and structure instructions for the Claude message>
```

The prompt is consumed directly by `app/api/projects/[id]/defend/route.ts`. No other file needs to change for prompt logic.

### Step 4 — `app/api/projects/[id]/defend/route.ts`

Add the new tool type string to `TOOL_LABELS`:

```typescript
const TOOL_LABELS: Record<DefenseTool, string> = {
  // ...
  your_new_tool: 'YOUR NEW TOOL — DISPLAY NAME',
}
```

The Zod schema (`defendSchema`) uses `Object.keys(TOOL_LABELS)` so it automatically validates the new type without changes.

**That's it.** `DefenseDashboard.tsx` maps over `DEFENSE_TOOLS` dynamically — no changes needed there.

---

## 2. API Route Patterns

### `POST /api/projects/[id]/defend`

**Request body (validated with Zod):**
```typescript
{
  tool_type: DefenseTool,                          // required
  situation: string,                               // min 10, max 2000 chars
  extra_context?: Record<string, string | number>  // optional key/value pairs
}
```

**Response (success 200):**
```typescript
{ response: string, id: string }  // id = defense_responses UUID
```

**Response (upgrade required 403):**
```typescript
{ error: 'UPGRADE_REQUIRED' }
```

**Response (validation/other error 400/500):**
```typescript
{ error: string }
```

**Auth pattern:** `supabase.auth.getUser()` — returns 401 if no session. Always `.eq('user_id', user.id)` on DB queries (RLS + explicit filter).

**Credit pattern:** Atomic `check_and_increment_defense_responses` RPC fires BEFORE Anthropic call. On any failure (validation, not found, AI error, save error), compensating decrement restores `defense_responses_used` to `preIncrementCount`.

**Claude call pattern:**
```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: DEFENSE_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }]
})
const response = message.content[0].type === 'text' ? message.content[0].text : ''
```

**User message assembled in defend route:**
```
PROJECT: {title}
CLIENT: {client_name}
VALUE: {project_value} {currency}         ← omitted if null
NOTES: {notes}                             ← omitted if null

CONTRACT DATA:
{contractAnalysis JSON}                    ← or "(No contract — do not reference or invent contract terms)"

ADDITIONAL CONTEXT:
field_key: value                           ← each entry in extra_context

TOOL: {TOOL_LABELS[tool_type]}

SITUATION:
{situation}

Write the message now.
```

### `POST /api/projects/[id]/analyze-message`

**Request body:**
```typescript
{ message: string }  // min 10, max 5000 chars
```

**Response (success 200):**
```typescript
{
  tool_type: DefenseTool,
  explanation: string,      // one sentence
  situation_context: string // first-person freelancer summary
}
```

**Key difference from defend:** No DB row is saved. The classification result is ephemeral. Still consumes one defense credit via the same `check_and_increment_defense_responses` RPC.

**Claude call:**
```typescript
{
  model: 'claude-sonnet-4-6',
  max_tokens: 256,
  system: CLASSIFY_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: clientMessage }]
}
```

Claude's JSON response is extracted with a fallback regex (`rawText.match(/\{[\s\S]*\}/)`) and then validated against a Zod schema before returning.

### `PATCH /api/projects/[id]`

**Request body:** any subset of the allowed field list:
```
title, client_name, client_email, project_value, currency,
status, notes, contract_id, payment_due_date, payment_amount, payment_received_at
```

Unknown keys are stripped. No Zod schema — uses `Object.entries(body).filter(([k]) => allowed.includes(k))`.

**Response:** `{ project: <updated row> }`

---

## 3. Database Schema

### `user_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → auth.users |
| `email` | text | |
| `full_name` | text | nullable |
| `plan` | text | `'free'` or `'pro'` |
| `defense_responses_used` | int | free limit: 1 |
| `contracts_used` | int | free limit: 1 |
| `stripe_customer_id` | text | nullable |
| `stripe_subscription_id` | text | nullable |
| `created_at` | timestamptz | |

### `projects`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → auth.users |
| `contract_id` | uuid | nullable, FK → contracts |
| `title` | text | |
| `client_name` | text | |
| `client_email` | text | nullable |
| `project_value` | numeric | nullable |
| `currency` | text | default `'EUR'` |
| `status` | text | default `'active'` |
| `notes` | text | nullable |
| `payment_due_date` | date | nullable (added migration 005) |
| `payment_amount` | numeric | nullable (added migration 005) |
| `payment_received_at` | timestamptz | nullable (added migration 005) |
| `created_at` | timestamptz | |

### `contracts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → auth.users |
| `title` | text | |
| `original_filename` | text | nullable |
| `contract_text` | text | nullable |
| `anthropic_file_id` | text | nullable |
| `risk_score` | int | 1–10 |
| `risk_level` | text | `'low'/'medium'/'high'/'critical'` |
| `analysis` | jsonb | full `ContractAnalysis` object |
| `status` | text | default `'pending'` |
| `created_at` | timestamptz | |

### `defense_responses`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid | FK → projects (cascade delete) |
| `user_id` | uuid | FK → auth.users (cascade delete) |
| `tool_type` | text | matches `DefenseTool` union |
| `situation` | text | |
| `extra_context` | jsonb | default `'{}'` |
| `response` | text | the generated message |
| `was_copied` | boolean | default false |
| `was_sent` | boolean | default false |
| `created_at` | timestamptz | |

### Key Postgres functions

`check_and_increment_defense_responses(uid uuid) → jsonb`
Returns `{ allowed: boolean, current_count: number }`. Pro plan always allowed. Free: allowed only if `defense_responses_used < 1`. Increments atomically with `FOR UPDATE` row lock. Current count returned is **pre-increment**.

`check_and_increment_contracts(uid uuid) → jsonb`
Same shape. Free limit: `contracts_used < 1`.

RLS policies: all tables have `"Own data only"` — `auth.uid() = user_id` (or `id` for user_profiles).

---

## 4. Claude Prompt Pattern

**Client singleton:** `lib/anthropic.ts` exports a single `anthropic` instance:
```typescript
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

**Model used everywhere:** `claude-sonnet-4-6`

**Three system prompts, all in `lib/anthropic.ts`:**

| Export | Used by | Max tokens | Returns |
|---|---|---|---|
| `DEFENSE_SYSTEM_PROMPT` | `/defend` route | 1024 | Plain text message |
| `CLASSIFY_SYSTEM_PROMPT` | `/analyze-message` route | 256 | JSON `{tool_type, explanation, situation_context}` |
| `CONTRACT_ANALYSIS_SYSTEM_PROMPT` | `/contracts/analyze` route | (not checked) | JSON `ContractAnalysis` |

**JSON extraction pattern** (used when Claude returns JSON):
```typescript
function extractJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('No valid JSON found in response')
  }
}
```

Always validate Claude's JSON output against a Zod schema before returning it to the client.

---

## 5. Server Page → Client Component Data Flow

Pattern used in `app/(dashboard)/projects/[id]/page.tsx` → `ProjectDetailClient.tsx`:

```typescript
// SERVER component (async, no 'use client')
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params                          // params is a Promise in Next.js 16
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetches
  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('*, contracts(id, risk_score, risk_level, title)')
      .eq('id', id).eq('user_id', user.id).single(),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  ])

  if (!project) notFound()

  return (
    <ProjectDetailClient
      project={project as unknown as Project & { contracts?: ... }}
      plan={profile?.plan ?? 'free'}
      responsesUsed={profile?.defense_responses_used ?? 0}
    />
  )
}
```

**Rules observed:**
- Server component does all auth, data fetching, and redirects.
- Client component receives fully-typed props (no raw Supabase types — cast with `as unknown as`).
- `plan` and `responsesUsed` are always passed separately (not buried in a profile object) so client components can gate features without touching profile data directly.
- `router.refresh()` is called after mutations that change server-fetched data (Next.js invalidates RSC cache).

---

## 6. Escalation Logic — payment_first → payment_second → payment_final

**There is no automatic escalation.** The three payment tools are entirely independent entries in `DEFENSE_TOOLS`. The only logic that selects between them is in `PaymentSection.tsx`'s `buildPaymentPrefill` function:

```typescript
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

**Trigger:** User clicks "Get a late payment message" in `PaymentSection`. The component calls `onHandleLatePayment(prefill)` which sets state in `ProjectDetailClient`, which passes `initialPaymentPrefill` to `DefenseDashboard`. A `useEffect` in `DefenseDashboard` watches this prop and auto-selects the correct tool and pre-fills `SituationPanel` context fields.

**The `daysOverdue` value is computed client-side at click time** from `project.payment_due_date`. There is no cron job, webhook, or server-side escalation trigger. The database stores raw dates; escalation logic lives entirely in the component.

**`payment_received_at`** is set via `PATCH /api/projects/[id]` with `{ payment_received_at: new Date().toISOString() }`. Once set, `PaymentSection` shows "Received" state and hides late payment controls.

---

## Quick Reference — Key File Paths

| Purpose | Path |
|---|---|
| Defense tool registry | `lib/defenseTools.ts` |
| All types | `types/index.ts` |
| All Claude prompts + client | `lib/anthropic.ts` |
| Defend API route | `app/api/projects/[id]/defend/route.ts` |
| Analyze-message API route | `app/api/projects/[id]/analyze-message/route.ts` |
| Project CRUD API route | `app/api/projects/[id]/route.ts` |
| Project server page | `app/(dashboard)/projects/[id]/page.tsx` |
| Project client shell | `components/project/ProjectDetailClient.tsx` |
| Defense tool grid + orchestration | `components/defense/DefenseDashboard.tsx` |
| Individual tool card | `components/defense/DefenseToolCard.tsx` |
| Situation/context form | `components/defense/SituationPanel.tsx` |
| Generated message display | `components/defense/ResponseOutput.tsx` |
| Payment tracking UI | `components/project/PaymentSection.tsx` |
| Plan limits | `lib/plans.ts` |
| DB migrations | `supabase/migrations/` |
| Atomic gating RPCs | `supabase/migrations/002_atomic_gating.sql` |
| Payment columns migration | `supabase/migrations/005_payment_tracking.sql` |
