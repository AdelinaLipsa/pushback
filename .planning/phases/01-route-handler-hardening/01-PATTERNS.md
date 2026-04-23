# Phase 1: Route Handler Hardening — Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 9 (7 modified, 1 created, 1 new migration)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/api/projects/[id]/defend/route.ts` | route-handler | request-response | `app/api/contracts/analyze/route.ts` | exact (same AI + plan-gate pattern) |
| `app/api/contracts/analyze/route.ts` | route-handler | request-response + file-I/O | `app/api/projects/[id]/defend/route.ts` | exact (same AI + plan-gate pattern) |
| `app/auth/callback/route.ts` | route-handler | request-response | `app/api/projects/[id]/route.ts` | role-match (GET + redirect) |
| `app/api/projects/route.ts` | route-handler | CRUD | `app/api/projects/[id]/route.ts` | exact (same file, PATCH handler) |
| `app/(dashboard)/projects/[id]/history/page.tsx` | page (RSC) | CRUD read | `app/(dashboard)/projects/[id]/history/page.tsx` | self (modification, extend Promise.all) |
| `app/(auth)/login/page.tsx` | page (Client Component) | request-response | `app/(auth)/signup/page.tsx` | role-match (Client Component with error state) |
| `components/defense/ResponseHistory.tsx` | component (Client) | transform/render | `components/shared/UpgradePrompt.tsx` | partial (plan-gated CTA button pattern) |
| `lib/anthropic.ts` | utility/config | — | `lib/anthropic.ts` | self (string append) |
| `supabase/migrations/002_atomic_gating.sql` | migration | — | `supabase/migrations/001_initial.sql` | role-match (same PL/pgSQL style + security definer) |

---

## Pattern Assignments

### `app/api/projects/[id]/defend/route.ts` (route-handler, request-response)

**Analog:** `app/api/contracts/analyze/route.ts` (the closest existing pattern with try/catch + plan gate + AI call)

**Imports pattern** (defend/route.ts lines 1–3):
```typescript
import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DefenseTool } from '@/types'
```

Add Zod import (new, not yet in file):
```typescript
import { z } from 'zod'
```

**Auth check pattern** (defend/route.ts line 19–20 — keep as-is):
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

**Current (broken) plan gate pattern to REPLACE** (defend/route.ts lines 22–30):
```typescript
// BEFORE — non-atomic read-then-write, replace entirely with RPC call
const { data: profile } = await supabase
  .from('user_profiles')
  .select('plan, defense_responses_used')
  .eq('id', user.id)
  .single()

if (profile?.plan === 'free' && (profile?.defense_responses_used ?? 0) >= 3) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
```

**New atomic RPC gate pattern (from RESEARCH.md GATE-01):**
```typescript
const { data: gateResult, error: gateError } = await supabase.rpc(
  'check_and_increment_defense_responses',
  { uid: user.id }
)
if (gateError || !gateResult?.allowed) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
// gateResult.current_count holds the pre-increment count — store it for compensating decrement
const preIncrementCount = gateResult.current_count as number
```

**Zod validation pattern — add before body parse** (model from RESEARCH.md VALID-01, TOOL_LABELS is already in file lines 5–14):
```typescript
const defendSchema = z.object({
  tool_type: z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]]),
  situation: z.string().min(10).max(2000),
  extra_context: z.record(
    z.string(),
    z.union([z.string().max(500), z.number()])
  ).optional(),
})

const body = await request.json()
const parsed = defendSchema.safeParse(body)
if (!parsed.success) {
  const issue = parsed.error.issues[0]
  return Response.json({ error: `${issue.path[0]}: ${issue.message}` }, { status: 400 })
}
const { tool_type, situation, extra_context } = parsed.data
```

**Try/catch wrapper — model from analyze/route.ts lines 35 + 82–86:**
```typescript
// analyze/route.ts — existing catch block to copy shape from:
try {
  // ... all AI + DB work ...
} catch (err) {
  await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
  console.error('Contract analysis error:', err)
  return Response.json({ error: 'Analysis failed' }, { status: 500 })
}
```

For defend route, the catch block shape (D-01):
```typescript
} catch (err) {
  console.error('Defend route error:', err)
  // Compensating decrement (RELY-04): RPC already incremented; undo it on failure
  await supabase
    .from('user_profiles')
    .update({ defense_responses_used: preIncrementCount })
    .eq('id', user.id)
  return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
}
```

**Credit-safe insert pattern — model from analyze/route.ts lines 67–79 (existing update + increment sequence):**
```typescript
// BEFORE in analyze/route.ts (update then increment — no error check on update):
await supabase
  .from('contracts')
  .update({ analysis, risk_score: analysis.risk_score, ... })
  .eq('id', contract.id)
// ... then increment runs regardless

// NEW pattern for defend route (credit-safe — check saveError before returning):
const { data: saved, error: saveError } = await supabase
  .from('defense_responses')
  .insert({ project_id: id, user_id: user.id, tool_type, situation, extra_context: extra_context ?? {}, response })
  .select()
  .single()

if (saveError || !saved) {
  // Compensating decrement — RPC already incremented, undo it
  await supabase
    .from('user_profiles')
    .update({ defense_responses_used: preIncrementCount })
    .eq('id', user.id)
  return Response.json({ error: 'Failed to save response — your credit was not used. Please try again.' }, { status: 500 })
}
```

**Supabase update pattern** (from projects/[id]/route.ts PATCH handler lines 31–38):
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({ defense_responses_used: preIncrementCount })
  .eq('id', user.id)
// Note: no .select() needed for compensating decrement
```

**Error response shape** (established across all route files):
```typescript
Response.json({ error: 'message string' }, { status: 400 })  // validation
Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })  // plan gate
Response.json({ error: 'Not found' }, { status: 404 })        // missing resource
Response.json({ error: 'message string' }, { status: 500 })  // server error
```

---

### `app/api/contracts/analyze/route.ts` (route-handler, request-response + file-I/O)

**Analog:** `app/api/projects/[id]/defend/route.ts` (symmetric changes — same plan gate replacement, same Zod pattern)

**Existing try/catch** (lines 35 + 82–86) — already present, keep structure, extend with credit-safe guard.

**Current (broken) plan gate to REPLACE** (analyze/route.ts lines 11–19):
```typescript
// BEFORE — replace with RPC, same pattern as defend route
const { data: profile } = await supabase
  .from('user_profiles')
  .select('plan, contracts_used')
  .eq('id', user.id)
  .single()

if (profile?.plan === 'free' && (profile?.contracts_used ?? 0) >= 1) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
```

**New atomic RPC gate (GATE-02):**
```typescript
const { data: gateResult, error: gateError } = await supabase.rpc(
  'check_and_increment_contracts',
  { uid: user.id }
)
if (gateError || !gateResult?.allowed) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
const preIncrementCount = gateResult.current_count as number
```

**File validation (VALID-03) — insert BEFORE the `if (file)` branch (analyze/route.ts line 38):**
```typescript
// Add after formData parse, before the if (file) branch:
if (file) {
  if (file.type !== 'application/pdf') {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
    return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
    return Response.json({ error: 'File must be under 10 MB' }, { status: 400 })
  }
}
```

Note the `status: 'error'` update pattern is already used at analyze/route.ts line 53:
```typescript
// Existing pattern to copy for cleanup:
await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
return Response.json({ error: 'No file or text provided' }, { status: 400 })
```

**JSON extraction helper (RELY-02) — replaces bare JSON.parse at analyze/route.ts line 65:**
```typescript
// BEFORE (line 65):
const analysis: ContractAnalysis = JSON.parse(rawText)

// AFTER — add helper function at top of file (after imports):
function extractJson(rawText: string): ContractAnalysis {
  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('No valid JSON found in response')
  }
}

// Then in route body:
const analysis: ContractAnalysis = extractJson(rawText)
// If extractJson throws, the existing catch block handles it
```

**Credit-safe guard (D-03) — check update result before counter increment:**

Current broken sequence (analyze/route.ts lines 67–79):
```typescript
// BEFORE — update result unchecked, increment always runs:
await supabase
  .from('contracts')
  .update({ analysis, risk_score: analysis.risk_score, risk_level: analysis.risk_level, status: 'analyzed' })
  .eq('id', contract.id)

// ... project_id link ...

await supabase
  .from('user_profiles')
  .update({ contracts_used: (profile?.contracts_used ?? 0) + 1 })
  .eq('id', user.id)
```

New credit-safe sequence:
```typescript
const { error: updateError } = await supabase
  .from('contracts')
  .update({ analysis, risk_score: analysis.risk_score, risk_level: analysis.risk_level, status: 'analyzed' })
  .eq('id', contract.id)

if (updateError) {
  // Compensating decrement — RPC already incremented
  await supabase
    .from('user_profiles')
    .update({ contracts_used: preIncrementCount })
    .eq('id', user.id)
  return Response.json({ error: 'Failed to save analysis — your credit was not used. Please try again.' }, { status: 500 })
}

if (project_id) {
  await supabase.from('projects').update({ contract_id: contract.id }).eq('id', project_id).eq('user_id', user.id)
}
// No manual increment needed — RPC already handled it atomically
```

**Catch block — existing pattern (lines 82–86), update error message for malformed JSON case:**
```typescript
// Existing catch block shape — keep, update D-03 message if needed
} catch (err) {
  await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
  console.error('Contract analysis error:', err)
  // D-13: if err.message === 'No valid JSON found in response', use specific message
  const isParseError = err instanceof Error && err.message === 'No valid JSON found in response'
  return Response.json(
    { error: isParseError ? 'Contract analysis returned malformed output — please try again' : 'Analysis failed' },
    { status: 500 }
  )
}
```

---

### `app/auth/callback/route.ts` (route-handler, GET + redirect)

**Analog:** `app/api/projects/[id]/route.ts` GET handler (same auth + error check shape)

**Full current file** (callback/route.ts lines 1–14) — minimal, full replacement:
```typescript
// BEFORE:
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)  // result discarded — bug
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

**RELY-03 fix — check exchangeCodeForSession result:**
```typescript
// AFTER:
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

Note: `NextResponse.redirect` is the correct API here (not `Response.json`). This is a GET redirect handler, not a JSON API — `NextResponse` is already imported and is the correct pattern for redirects. See RESEARCH.md Risk #8.

---

### `app/api/projects/route.ts` POST handler (route-handler, CRUD)

**Analog:** `app/api/projects/[id]/route.ts` PATCH handler (lines 20–40 — same body parse + Supabase update + error shape)

**Existing PATCH pattern from projects/[id]/route.ts lines 26–39:**
```typescript
const body = await request.json()
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 'status', 'notes', 'contract_id']
const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

const { data, error } = await supabase
  .from('projects')
  .update(updates)
  .eq('id', id)
  .eq('user_id', user.id)
  .select()
  .single()

if (error) return Response.json({ error: error.message }, { status: 500 })
return Response.json({ project: data })
```

**Current POST body parse in projects/route.ts lines 23–28:**
```typescript
const body = await request.json()
const { title, client_name, client_email, project_value, currency, notes } = body

if (!title || !client_name) {
  return Response.json({ error: 'title and client_name are required' }, { status: 400 })
}
```

**New Zod schema (VALID-02) — replace lines 23–28:**
```typescript
import { z } from 'zod'

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  client_name: z.string().min(1).max(200),
  project_value: z.number().positive().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'AUD', 'CAD']).optional(),
  client_email: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
})

const body = await request.json()
const parsed = projectSchema.safeParse(body)
if (!parsed.success) {
  const issue = parsed.error.issues[0]
  const field = String(issue.path[0])
  return Response.json({ error: `${field} is invalid: ${issue.message}` }, { status: 400 })
}
const { title, client_name, client_email, project_value, currency, notes } = parsed.data
```

**Insert pattern to keep** (projects/route.ts lines 30–34 — unchanged):
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({ user_id: user.id, title, client_name, client_email, project_value, currency: currency ?? 'EUR', notes })
  .select()
  .single()

if (error) return Response.json({ error: error.message }, { status: 500 })
return Response.json({ project: data })
```

---

### `app/(dashboard)/projects/[id]/history/page.tsx` (page, RSC, CRUD read)

**Analog:** Self — extends the existing `Promise.all` pattern already in the file.

**Existing Promise.all pattern** (history/page.tsx lines 13–16):
```typescript
const [{ data: project }, { data: responses }] = await Promise.all([
  supabase.from('projects').select('id, title, client_name').eq('id', id).eq('user_id', user.id).single(),
  supabase.from('defense_responses').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
])
```

**Extended pattern — add profile fetch (GATE-03):**
```typescript
const [{ data: project }, { data: responses }, { data: profile }] = await Promise.all([
  supabase.from('projects').select('id, title, client_name').eq('id', id).eq('user_id', user.id).single(),
  supabase.from('defense_responses').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
  supabase.from('user_profiles').select('plan').eq('id', user.id).single(),
])
```

**Profile select pattern** — copy from defend/route.ts lines 22–26 (same `.from('user_profiles').select(...).eq('id', user.id).single()` shape):
```typescript
// Reference:
const { data: profile } = await supabase
  .from('user_profiles')
  .select('plan, defense_responses_used')
  .eq('id', user.id)
  .single()
// For history page, only need 'plan':
supabase.from('user_profiles').select('plan').eq('id', user.id).single()
```

**Updated ResponseHistory call** (history/page.tsx line 29):
```typescript
// BEFORE:
<ResponseHistory responses={(responses ?? []) as DefenseResponse[]} />

// AFTER:
<ResponseHistory responses={(responses ?? []) as DefenseResponse[]} plan={profile?.plan ?? 'free'} />
```

**Import to add** (Plan type from types/index.ts line 56 — `export type Plan = 'free' | 'pro'`):
```typescript
import { DefenseResponse, Plan } from '@/types'
```

---

### `app/(auth)/login/page.tsx` (Client Component, request-response)

**Analog:** Self — already a Client Component with `useState` and error display. The useSearchParams hook is additive.

**Existing imports** (login/page.tsx lines 1–6):
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
```

**Add useSearchParams** (D-06):
```typescript
import { useSearchParams } from 'next/navigation'
```

**Hook usage inside component** (add after existing hook declarations, login/page.tsx line 13):
```typescript
const router = useRouter()
const searchParams = useSearchParams()         // add this line
const authError = searchParams.get('error')   // add this line
const [email, setEmail] = useState('')
```

**Error banner pattern to copy** (login/page.tsx lines 76–80 — existing `{error && ...}` block):
```typescript
// Existing error banner — copy exact style for authError banner:
{error && (
  <div style={{ backgroundColor: 'var(--urgency-high-dim)', border: '1px solid var(--urgency-high)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--urgency-high)', fontSize: '0.875rem' }}>
    {error}
  </div>
)}
```

**New auth error banner — render above the Google button (before line 50):**
```tsx
{authError === 'auth_failed' && (
  <div style={{
    backgroundColor: 'var(--urgency-high-dim)',
    border: '1px solid var(--urgency-high)',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    color: 'var(--urgency-high)',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  }}>
    Sign-in link expired — please try again.
  </div>
)}
```

Placement: inside the `<div style={{ backgroundColor: 'var(--bg-surface)', ... }}>` wrapper (line 49), as the first child, before the Google button.

---

### `components/defense/ResponseHistory.tsx` (Client Component, transform/render)

**Analog:** `components/shared/UpgradePrompt.tsx` (upgrade CTA button pattern — amber button linking to checkout via `handleUpgrade` → `/api/checkout`)

**Existing component props** (ResponseHistory.tsx lines 7–9):
```typescript
interface ResponseHistoryProps {
  responses: DefenseResponse[]
}
```

**Extended props (GATE-03):**
```typescript
import { Plan } from '@/types'

interface ResponseHistoryProps {
  responses: DefenseResponse[]
  plan: Plan
}
```

**Existing map loop structure** (ResponseHistory.tsx lines 33–71) — becomes the base to wrap with conditional:
```typescript
{responses.map(r => (
  <div
    key={r.id}
    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.75rem', overflow: 'hidden' }}
  >
    {/* card header button */}
    {/* expanded content */}
  </div>
))}
```

**Locked card overlay pattern** — model from UpgradePrompt.tsx lines 26–59 for amber CTA button, compose with blur wrapper:
```tsx
{responses.map((r, index) => {
  const isLocked = plan === 'free' && index >= 3

  return (
    <div
      key={r.id}
      style={{ position: 'relative', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.75rem', overflow: 'hidden' }}
    >
      {/* Existing card content — blurred when locked */}
      <div style={isLocked ? { filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' } : undefined}>
        {/* ... existing header button ... */}
        {/* ... existing expanded content ... */}
      </div>

      {/* Upgrade overlay — only shown when locked */}
      {isLocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          gap: '0.75rem',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Upgrade to see full history
          </span>
          {/* Amber CTA button — copy style from UpgradePrompt.tsx line 43–48 */}
          <button
            onClick={handleUpgrade}
            disabled={upgradeLoading}
            style={{
              backgroundColor: 'var(--brand-amber)',
              color: '#0a0a0a',
              fontWeight: 700,
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: upgradeLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: upgradeLoading ? 0.7 : 1,
            }}
          >
            {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
          </button>
        </div>
      )}
    </div>
  )
})}
```

**handleUpgrade pattern** — copy from UpgradePrompt.tsx lines 14–23:
```typescript
const [upgradeLoading, setUpgradeLoading] = useState(false)

async function handleUpgrade() {
  setUpgradeLoading(true)
  const res = await fetch('/api/checkout', { method: 'POST' })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    setUpgradeLoading(false)
  }
}
```

---

### `lib/anthropic.ts` (utility/config — string append)

**Analog:** Self — append text to `DEFENSE_SYSTEM_PROMPT` string.

**Current DEFENSE_SYSTEM_PROMPT ending** (lib/anthropic.ts lines 130–131):
```typescript
Return only the message text. Start with the salutation.
`
```

**D-14 — append off-topic guard before the closing backtick:**
```typescript
OFF-TOPIC GUARD:
If the submitted situation is clearly not a freelancer-client professional dispute
(e.g., personal relationships, homework, test answers, unrelated business topics),
respond only with: "This tool is designed for freelancer-client situations only."
Do not attempt to generate any other response.

Return only the message text. Start with the salutation.
`
```

No import changes needed. No structural changes to the file.

---

### `supabase/migrations/002_atomic_gating.sql` (migration — new file)

**Analog:** `supabase/migrations/001_initial.sql` (PL/pgSQL style: `create or replace function`, `security definer`, `language plpgsql`)

**Existing function pattern from 001_initial.sql lines 64–71:**
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
```

**New migration — full content:**
```sql
create or replace function public.check_and_increment_defense_responses(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  allowed boolean;
begin
  select plan, defense_responses_used
  into current_plan, current_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    allowed := true;
  elsif current_count < 3 then
    update public.user_profiles
    set defense_responses_used = defense_responses_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object('allowed', allowed, 'current_count', current_count);
end;
$$;

create or replace function public.check_and_increment_contracts(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  allowed boolean;
begin
  select plan, contracts_used
  into current_plan, current_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    allowed := true;
  elsif current_count < 1 then
    update public.user_profiles
    set contracts_used = contracts_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object('allowed', allowed, 'current_count', current_count);
end;
$$;
```

**Style conventions from 001_initial.sql:**
- Lowercase keywords (`create`, `select`, `update`, `where`, `returns`)
- `public.` schema prefix on all table references
- `security definer` at function level (same as handle_new_user)
- `jsonb_build_object` for structured return values
- `for update` row lock to prevent concurrent check-passes

---

## Shared Patterns

### Auth Check
**Source:** All route files (e.g., `app/api/projects/[id]/defend/route.ts` line 19–20)
**Apply to:** All modified route handlers — already present in all files, keep as-is
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### Error Response Shape
**Source:** `app/api/projects/route.ts` lines 14, 27, 36; `app/api/projects/[id]/route.ts` lines 16, 27, 38
**Apply to:** All route handlers
```typescript
Response.json({ error: 'message' }, { status: 400 })   // validation failure
Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })  // plan gate
Response.json({ error: error.message }, { status: 500 })  // Supabase error (uses error.message directly)
Response.json({ error: 'human message' }, { status: 500 })  // AI/custom error (use literal string)
```

### Supabase Client Instantiation
**Source:** Every route file (e.g., `app/api/projects/[id]/defend/route.ts` line 18)
**Apply to:** All route handlers and RSC pages
```typescript
const supabase = await createServerSupabaseClient()
```

### Supabase Query Error Pattern
**Source:** `app/api/projects/route.ts` lines 8–14; `app/api/projects/[id]/route.ts` lines 9–17
**Apply to:** Any new `.select()` calls with `{ data, error }` destructuring
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', user.id)

if (error) return Response.json({ error: error.message }, { status: 500 })
```

### No-Semicolons + Single Quotes Style
**Source:** Every file in the codebase (consistent across all .ts and .tsx files)
**Apply to:** All new code
```typescript
// Correct:
import { z } from 'zod'
const parsed = schema.safeParse(body)

// Wrong:
import { z } from "zod";
const parsed = schema.safeParse(body);
```

### Plan Type
**Source:** `types/index.ts` line 56
**Apply to:** `ResponseHistory.tsx` props, `history/page.tsx` prop pass
```typescript
export type Plan = 'free' | 'pro'
```

### Amber CTA Button Style
**Source:** `components/shared/UpgradePrompt.tsx` lines 43–48; `app/(auth)/login/page.tsx` lines 119–125
**Apply to:** Upgrade overlay button in `ResponseHistory.tsx`
```typescript
{
  backgroundColor: 'var(--brand-amber)',
  color: '#0a0a0a',
  fontWeight: 700,
  padding: '0.7rem 1.5rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
}
```

### CSS Variable Palette (used throughout)
**Source:** All component and page files
```
var(--bg-base)           — page background
var(--bg-surface)        — card background
var(--bg-elevated)       — button/input background
var(--bg-border)         — border color
var(--text-primary)      — main text
var(--text-secondary)    — secondary text
var(--text-muted)        — muted/disabled text
var(--brand-amber)       — primary CTA color
var(--urgency-high)      — error/danger border + text
var(--urgency-high-dim)  — error/danger background
```

---

## No Analog Found

No files in this phase are entirely without analog. All patterns have been sourced from existing codebase files.

---

## Metadata

**Analog search scope:** `app/api/**`, `app/(auth)/**`, `app/(dashboard)/**`, `components/**`, `lib/**`, `supabase/migrations/**`, `types/`
**Files read:** 18 (all 9 target files + 9 analog/reference files)
**Pattern extraction date:** 2026-04-23
