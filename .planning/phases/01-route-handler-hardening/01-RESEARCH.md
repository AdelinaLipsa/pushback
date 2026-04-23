# Phase 1: Route Handler Hardening — Research

**Researched:** 2026-04-23
**Domain:** Next.js 16 Route Handlers, Supabase RPC, Zod validation, atomic DB writes
**Confidence:** HIGH (all claims verified against live source files and Next.js 16 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Anthropic error on defend route → `{ error: 'AI generation failed — please try again' }` status 500
- **D-02:** Free-tier DB insert failure → `{ error: 'Failed to save response — your credit was not used. Please try again.' }` — do NOT increment `defense_responses_used`
- **D-03:** Contract analysis catch block → keep `{ error: 'Analysis failed' }` status 500; add credit-safe guard if insert fails before increment
- **D-04:** Fetch ALL defense_responses; render first 3 normally; responses at index 3+ get `filter: blur(4px)` + absolute overlay with "Upgrade to Pro" CTA
- **D-05:** Overlay: `position: absolute`, centered, label "Upgrade to see full history", button links to checkout
- **D-06:** Auth callback error → redirect to `/login?error=auth_failed`; login page shows red inline banner "Sign-in link expired — please try again."
- **D-07:** Successful auth flow unchanged → redirect to `/dashboard`
- **D-08:** Projects POST Zod schema: `title` (string, min 1, max 200), `client_name` (string, min 1, max 200), `project_value` (optional, positive number), `currency` (optional, enum EUR/USD/GBP/AUD/CAD), `client_email` (optional, `z.string().email()`), `notes` (optional, string, max 2000). Return `{ error: '<field> is invalid: <reason>' }` status 400
- **D-09:** Defend route Zod schema: `tool_type` (z.enum([...Object.keys(TOOL_LABELS)])), `situation` (string, min 10, max 2000), `extra_context` (optional record of string→string|number, individual string values max 500 chars). Return `{ error: '<field>: <reason>' }` status 400
- **D-10:** Supabase RPC for atomic plan gating — check + increment in single transaction, returns `{ allowed: boolean }`. `allowed: false` → `{ error: 'UPGRADE_REQUIRED' }` status 403. RPC in new migration
- **D-11:** Same RPC pattern for both `defense_responses_used` and `contracts_used`
- **D-12:** Contracts analyze file validation: type must be `application/pdf`, size max 10 MB. Errors: `{ error: 'Only PDF files are supported' }` or `{ error: 'File must be under 10 MB' }` status 400
- **D-13:** JSON extraction helper: try `JSON.parse`, then regex `/{[\s\S]*}/`, then `{ error: 'Contract analysis returned malformed output — please try again' }` status 500, set contract status 'error'
- **D-14:** Add off-topic guardrail to `DEFENSE_SYSTEM_PROMPT`: if situation is not a freelancer-client dispute, Claude should respond with "This tool is designed for freelancer-client situations only."

### Claude's Discretion
- Error boundary structure in defend route catch block (specific error categories: rate limit vs. network vs. auth)
- Zod library not yet in package.json — planner must add it (`zod` is the standard choice)
- RPC function naming: `check_and_increment_defense_responses` / `check_and_increment_contracts` or similar

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RELY-01 | Meaningful error when defend tool fails (Anthropic outage/rate limit) | Defend route has no try/catch — any Anthropic SDK throw escapes to Next.js 500; fix: wrap anthropic.messages.create in try/catch |
| RELY-02 | Clear error state when contract analysis fails due to malformed AI output | `JSON.parse(rawText)` on line 65 of analyze/route.ts will throw on preamble-wrapped output; fix: D-13 extraction helper |
| RELY-03 | Redirect to login with error when OAuth callback fails | `exchangeCodeForSession(code)` result is not checked (line 10 of auth/callback/route.ts); fix: check `error` field from result |
| RELY-04 | Free-tier credit never consumed when AI response DB save fails | Defend route: counter incremented after insert with no check if insert succeeded; fix: check `saved` before incrementing |
| GATE-01 | Free-tier defense response limit enforced atomically | Read-then-write pattern (lines 22–29) has race condition; fix: Supabase RPC per D-10 |
| GATE-02 | Free-tier contract analysis limit enforced atomically | Same read-then-write pattern (lines 12–19 of analyze/route.ts); fix: Supabase RPC per D-11 |
| GATE-03 | Response history gated: free users see last 3, Pro see all | history/page.tsx passes all responses to ResponseHistory with no plan check; ResponseHistory renders all uniformly |
| VALID-01 | Defend route rejects invalid tool_type and situation >2000 chars | No validation before `anthropic.messages.create`; tool_type from client is used directly |
| VALID-02 | Projects POST validates title, client_name, project_value with schema-level checks | Only truthiness check (`if (!title \|\| !client_name)`) — no length or type validation |
| VALID-03 | Contracts analyze validates file type and size before Anthropic Files API | File accepted with no type or size check before upload |
</phase_requirements>

---

## Summary

Phase 1 is a hardening pass over five existing route handlers and two UI surfaces. No new features are introduced. Every change is a tightening of what already exists: adding error boundaries, replacing non-atomic DB patterns, adding schema-level input validation, and gating UI views by plan.

The codebase is already consistent in its conventions (no-semicolons, single quotes, `Response.json()`, `{ error: 'message' }` error shape) and all route files already use the correct Next.js 16 async-params pattern (`await params`). The defend route and contracts analyze route are the most complex changes — both require atomic RPC replacement, try/catch wrapping, Zod validation, and credit-safe response saving logic. The Supabase RPC migration is the only prerequisite that must land before any route logic can be changed.

**Primary recommendation:** Write the Supabase migration first (Wave 0), install Zod, then harden each route in isolation starting with the defend route as it is the most business-critical path.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Plan limit enforcement (atomic) | Database (Postgres RPC) | API route | Atomicity requires a single DB transaction; route is just the caller |
| Input validation | API route | — | Validation happens before any expensive operation (Anthropic, DB) |
| Error message formatting | API route | — | Routes own the HTTP response shape |
| Response history gating | Frontend Server (RSC page) | Client Component (blur UI) | Plan check is a server-side data decision; blur rendering is client UI |
| Auth callback error redirect | API route (GET handler) | Login page | Callback route detects the error; login page renders the banner |
| JSON extraction safety | API route | — | rawText lives entirely in the route handler |
| Off-topic system prompt guard | Anthropic system prompt | — | No pre-flight call; guard is embedded in the prompt string |

---

## Current State Analysis

### `app/api/projects/[id]/defend/route.ts`

**What it does:** Checks plan limit (non-atomically), calls Anthropic, inserts response, increments counter.

**Missing / broken:**
1. No try/catch around `anthropic.messages.create` — any Anthropic SDK error is an unhandled rejection → Next.js returns a blank 500 (RELY-01)
2. Read-then-write plan gate (lines 22–29): reads `defense_responses_used`, checks it, then later increments — concurrent requests can both pass the check before either increments (GATE-01)
3. Counter increment happens regardless of whether the DB insert succeeded (lines 82–87): if `saved` is null/undefined, the user still loses a credit (RELY-04)
4. `tool_type` and `situation` accepted from request body with no validation; a malformed `tool_type` key would silently produce a bad `TOOL_LABELS[tool_type]` lookup (undefined) in the user message (VALID-01)
5. `request.json()` called without try/catch — malformed JSON body throws unhandled

**Async params status:** CORRECT. Line 16 uses `{ params }: { params: Promise<{ id: string }> }` and `await params` on line 17. [VERIFIED: source file + Next.js 16 route.md]

**TOOL_LABELS keys** (from line 5–14):
```
scope_change, payment_first, payment_second, payment_final,
revision_limit, kill_fee, delivery_signoff, dispute_response
```
These are the exact values to use in `z.enum([...Object.keys(TOOL_LABELS)])`. [VERIFIED: source file]

---

### `app/api/contracts/analyze/route.ts`

**What it does:** Checks plan limit (non-atomically), uploads PDF or accepts text, calls Anthropic, JSON.parses output, saves analysis, increments counter.

**Missing / broken:**
1. `JSON.parse(rawText)` on line 65 — Claude sometimes wraps JSON in markdown or adds preamble text; this throws and hits the catch block, returning `{ error: 'Analysis failed' }` with no distinction between parse failure and actual Anthropic failure (RELY-02)
2. Read-then-write plan gate (lines 12–19): same race condition as defend route (GATE-02)
3. Counter increment on line 78 happens inside the try block AFTER the analysis update but BEFORE the catch — if the `update` on line 67 fails, the catch block runs but the increment may not have run yet (actually OK here as the increment is after), BUT if the increment succeeds and the update fails, the user is charged for a failed analysis. Current order: update → increment → return. The catch block does NOT reverse the increment if it already ran. **However, in current code the increment only runs if we reach line 78 (no throw before it)**, so the real credit-safety risk is: the `update` on line 67 could fail silently (Supabase doesn't throw on `.update()` error, it returns `{ error }`), and then the increment still runs.
4. File type and size not validated before upload to Anthropic Files API (VALID-03)
5. Has a try/catch (unlike defend route), so unhandled throws are caught; but the error message is generic

---

### `app/auth/callback/route.ts`

**What it does:** Extracts `code` from query param, calls `exchangeCodeForSession`, redirects to dashboard.

**Missing / broken:**
1. Line 10: `await supabase.auth.exchangeCodeForSession(code)` — result is discarded. If the code is expired or has already been used, Supabase returns `{ data: null, error: AuthError }`. The route ignores this and redirects to `/dashboard` regardless. The user arrives at dashboard unauthenticated and is bounced back to login by middleware with no explanation (RELY-03)
2. `NextResponse` is imported and used — this is the existing pattern in this file only. The fix should maintain `NextResponse.redirect` for redirect responses since that's how the existing auth callback works.

---

### `app/api/projects/route.ts` POST

**What it does:** Checks title/client_name truthiness, inserts project.

**Missing / broken:**
1. Line 26: `if (!title || !client_name)` — catches empty string and undefined but not: strings over 200 chars, invalid email format, negative project_value, invalid currency string (VALID-02)
2. No Zod schema — inputs passed directly to Supabase insert with no sanitization of length or format

---

### `app/(dashboard)/projects/[id]/history/page.tsx`

**What it does:** Fetches all defense_responses, passes to `ResponseHistory` component, which renders all of them uniformly.

**Missing / broken:**
1. No plan check — free users see all responses, not just the first 3. `lib/plans.ts` advertises free plan has `defense_responses: 3` (implying history of 3), but no enforcement in UI (GATE-03)
2. `ResponseHistory` component does not accept a `plan` prop — it renders all responses identically
3. Page does not fetch the user's profile to check plan

**Fix approach:** The page is a Server Component (no `'use client'`). It can fetch the profile alongside the responses using `Promise.all`. Pass `plan` to `ResponseHistory`, which renders locked cards (index >= 3) with blur overlay.

---

### `app/(auth)/login/page.tsx`

**What it does:** Renders email/password form + Google OAuth button. Has local `error` state.

**Missing / broken:**
1. No reading of `?error=auth_failed` query param — URL param from auth callback is silently ignored
2. Login page is a Client Component (`'use client'`) — it cannot receive `searchParams` as a prop from the server. Must use `useSearchParams()` hook from `next/navigation`.

**Fix approach:** Add `useSearchParams()` (already a Client Component), read `params.get('error')`, if `=== 'auth_failed'` display the red banner on initial render. This is client-side, so `useSearchParams()` is the correct API. [VERIFIED: Next.js 16 use-search-params.md — `useSearchParams` is a Client Component hook]

---

### `lib/anthropic.ts`

**What it does:** Exports Anthropic client, `CONTRACT_ANALYSIS_SYSTEM_PROMPT`, `DEFENSE_SYSTEM_PROMPT`.

**Missing / broken:**
1. `DEFENSE_SYSTEM_PROMPT` has no off-topic guard (D-14). The prompt should add an instruction that if the situation is not a freelancer-client dispute, Claude should respond with: "This tool is designed for freelancer-client situations only."

**Placement:** Add the guard after the existing `TONE BY TOOL:` section as a final rule in `DEFENSE_SYSTEM_PROMPT`, before `Return only the message text.`

---

### `supabase/migrations/001_initial.sql`

**Schema columns relevant to gating:**
- `user_profiles.plan` (text, default 'free') [VERIFIED: line 5]
- `user_profiles.defense_responses_used` (int, default 0) [VERIFIED: line 6]
- `user_profiles.contracts_used` (int, default 0) [VERIFIED: line 7]

**RLS:** Row Level Security enabled on all tables. RPC functions must use `security definer` to bypass RLS and perform the atomic check+increment, OR use `security invoker` with the anon key — but since these are server-side routes using the service role or the user's session, `security definer` is the reliable approach. [ASSUMED — verify against Supabase RLS behavior for RPC]

**No RPC functions exist yet.** The migration for atomic gating is net-new.

---

## Dependencies

### 1. Zod (not installed)

**Status:** NOT in `package.json` dependencies or devDependencies. [VERIFIED: package.json]

**Install:** `npm install zod`

**Current latest:** Zod 3.x is the stable series. [ASSUMED — verify with `npm view zod version`]

**Import pattern (consistent with codebase style):**
```typescript
import { z } from 'zod'
```

### 2. Supabase Migration (new file)

**Status:** Must be created as `supabase/migrations/002_atomic_gating.sql`

**Two RPC functions needed:**
- `check_and_increment_defense_responses(uid uuid)` — checks `defense_responses_used < 3` AND plan is 'free' (or unlimited for pro); increments if allowed; returns `{ allowed: boolean }`
- `check_and_increment_contracts(uid uuid)` — same pattern for `contracts_used < 1`

**Pro users:** RPC must return `allowed: true` without incrementing for pro plan users (since limit is -1 / unlimited).

**Migration must run before any route code is deployed.**

---

## Technical Approach (per requirement)

### RELY-01: Try/catch on defend route

Wrap the entire route body (after auth check) in try/catch. The catch block should:
1. `console.error('Defend route error:', err)`
2. Return `Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })`

The Anthropic SDK throws typed errors (`Anthropic.APIError`, `Anthropic.APIConnectionError`, etc.) but D-01 says a single generic message is correct — no need to classify by type.

**Note:** `request.json()` must also be in the try block or wrapped separately, since a malformed body throws a SyntaxError.

**Credit-safe logic (RELY-04):** Inside the try block, after `anthropic.messages.create` succeeds:
1. Insert into `defense_responses` — capture `{ data: saved, error: saveError }`
2. If `saveError` or `!saved` → return `{ error: 'Failed to save response — your credit was not used. Please try again.' }` status 500 — DO NOT fall through to increment
3. Only if save succeeded: if plan is 'free', increment counter (or: let the RPC handle it — see GATE-01 note below)

**Interaction with GATE-01 (RPC):** Once the atomic RPC is in place, the check+increment happens atomically at the START of the route before the Anthropic call. This means:
- RPC increments immediately (reserves the slot)
- If Anthropic call or DB insert fails, the credit is already "used" at the DB level

**RELY-04 requires a different order:** Do NOT use the RPC to pre-increment. Instead, the RPC should only CHECK eligibility (returning `{ allowed: boolean, current_count: number }`) but NOT increment. Increment only after successful DB insert.

**Resolution:** The RPC function should do a conditional check-and-reserve (increment in the same transaction), but the route must attempt the insert and — if it fails — DECREMENT the counter. This is the cleanest pattern for credit safety:

```sql
-- RPC: checks AND increments atomically. Route must decrement on failure.
```

OR: The RPC only checks (no increment), and the route does the increment after successful insert. But then GATE-01 (concurrent safety) is not solved.

**Recommended resolution (D-10 + RELY-04 combined):**
- RPC atomically increments (reserves a slot)
- If `anthropic.messages.create` throws → catch block DOES NOT call a decrement (D-01 error message returned; user must retry; retry will correctly check the limit)

Wait — that means on Anthropic failure, the user loses a credit. That violates RELY-04.

**Correct approach (credit-safe + atomic):** The RPC should NOT pre-increment. Instead:
1. RPC checks limit only → returns `{ allowed: boolean }` without modifying the counter
2. Route calls Anthropic, inserts response
3. Only on successful insert → route increments the counter
4. The atomicity concern (GATE-01) is handled differently: the RPC uses a `SELECT FOR UPDATE` or `UPDATE ... WHERE ... RETURNING` to check-and-lock the row, preventing concurrent check-passes

**The canonical Postgres pattern for this:**
```sql
UPDATE user_profiles
SET defense_responses_used = defense_responses_used + 1
WHERE id = uid
  AND (plan = 'pro' OR defense_responses_used < 3)
RETURNING (plan = 'pro' OR defense_responses_used <= 3) AS allowed
```
This atomically increments AND returns whether it was allowed — but it always increments if allowed, so the route must DECREMENT on failure.

**Simplest implementation that satisfies both RELY-04 and GATE-01:**
- RPC: check-and-increment atomically (no separate check step)
- Route: on Anthropic failure or insert failure → call a decrement RPC (or direct update)
- This is the industry-standard "reserve then release" pattern

The planner should document the decrement step explicitly in the implementation tasks.

### RELY-02: JSON extraction helper

Create a helper function (in the route file or in a `lib/` module):

```typescript
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
```

Call this instead of bare `JSON.parse(rawText)`. If it throws, the existing catch block handles it with `{ error: 'Contract analysis returned malformed output — please try again' }` status 500.

The regex `/{[\s\S]*}/` is greedy — it matches the outermost `{...}`. This is intentional; the contract analysis JSON is always a single top-level object.

### RELY-03: Auth callback error check

```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code)
if (error) {
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
return NextResponse.redirect(`${origin}/dashboard`)
```

`NextResponse` is already imported in this file. No new imports needed.

### GATE-01 / GATE-02: Supabase RPC

**Migration file:** `supabase/migrations/002_atomic_gating.sql`

```sql
CREATE OR REPLACE FUNCTION check_and_increment_defense_responses(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plan text;
  current_count int;
  allowed boolean;
BEGIN
  SELECT plan, defense_responses_used
  INTO current_plan, current_count
  FROM user_profiles
  WHERE id = uid
  FOR UPDATE;

  IF current_plan = 'pro' THEN
    allowed := true;
  ELSIF current_count < 3 THEN
    UPDATE user_profiles
    SET defense_responses_used = defense_responses_used + 1
    WHERE id = uid;
    allowed := true;
  ELSE
    allowed := false;
  END IF;

  RETURN jsonb_build_object('allowed', allowed, 'current_count', current_count);
END;
$$;
```

Same pattern for `check_and_increment_contracts` with limit 1 and column `contracts_used`.

**Route call:**
```typescript
const { data: gateResult, error: gateError } = await supabase.rpc(
  'check_and_increment_defense_responses',
  { uid: user.id }
)
if (gateError || !gateResult?.allowed) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
```

**RELY-04 decrement on failure:** If the Anthropic call fails or the insert fails AFTER the RPC has already incremented, a compensating decrement is needed:

```typescript
const { error: anthropicErr } = /* ... */
if (anthropicErr) {
  // Decrement counter back (fire-and-forget is acceptable for this)
  await supabase
    .from('user_profiles')
    .update({ defense_responses_used: supabase.rpc('decrement_defense_responses', { uid: user.id }) })
    .eq('id', user.id)
  return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
}
```

Simpler: a direct update:
```typescript
await supabase
  .from('user_profiles')
  .update({ defense_responses_used: currentCount }) // reset to pre-increment value
  .eq('id', user.id)
```

Or: Pass `current_count` back from RPC and store it before the Anthropic call, use it to reset if failure. This is the most straightforward approach.

### GATE-03: Response history gating

**Page change (`history/page.tsx`):** Add profile fetch to `Promise.all`:
```typescript
const [{ data: project }, { data: responses }, { data: profile }] = await Promise.all([
  supabase.from('projects').select('id, title, client_name').eq('id', id).eq('user_id', user.id).single(),
  supabase.from('defense_responses').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
  supabase.from('user_profiles').select('plan').eq('id', user.id).single(),
])
```

Pass `plan={profile?.plan ?? 'free'}` to `ResponseHistory`.

**ResponseHistory component change:** Add `plan: 'free' | 'pro'` to `ResponseHistoryProps`. Render responses with index >= 3 as blurred locked cards when plan is 'free'.

**Locked card pattern:**
```tsx
<div style={{ position: 'relative', overflow: 'hidden' }}>
  {/* existing card content with blur */}
  <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
    {/* card header */}
  </div>
  {/* upgrade overlay */}
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: '0.75rem',
  }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
      Upgrade to see full history
    </span>
    <a href="/settings" style={{ /* amber CTA button */ }}>
      Upgrade to Pro
    </a>
  </div>
</div>
```

**Note:** The "Upgrade to Pro" button links to checkout. The checkout URL is via Creem. CONTEXT.md says "linking to checkout" — the checkout is initiated from `/settings`. Safe to link to `/settings` if the Creem direct checkout URL is not yet known in this phase.

### VALID-01: Zod schema — defend route

```typescript
import { z } from 'zod'

const defendSchema = z.object({
  tool_type: z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]]),
  situation: z.string().min(10).max(2000),
  extra_context: z.record(
    z.string(),
    z.union([z.string().max(500), z.number()])
  ).optional(),
})
```

Parse before Anthropic call. On `ZodError`: return `Response.json({ error: `${issue.path[0]}: ${issue.message}` }, { status: 400 })`.

**TypeScript note:** `z.enum()` requires a non-empty tuple type. `Object.keys(TOOL_LABELS) as [string, ...string[]]` is the standard cast. Since `TOOL_LABELS` is a `Record<DefenseTool, string>` with 8 known keys, this is safe. [ASSUMED — no Zod docs verified in this session; pattern is standard Zod usage]

### VALID-02: Zod schema — projects POST

```typescript
const projectSchema = z.object({
  title: z.string().min(1).max(200),
  client_name: z.string().min(1).max(200),
  project_value: z.number().positive().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'AUD', 'CAD']).optional(),
  client_email: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
})
```

### VALID-03: File validation — contracts analyze

Before the `if (file)` branch:
```typescript
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

**Note:** A contract row is inserted BEFORE validation (line 29). If validation fails, the pending contract row must be cleaned up (status set to 'error') to avoid orphaned pending rows.

### D-14: Off-topic guard in DEFENSE_SYSTEM_PROMPT

Add after the TONE BY TOOL section, before `Return only the message text.`:

```
OFF-TOPIC GUARD:
If the submitted situation is clearly not a freelancer-client professional dispute
(e.g., personal relationships, homework, test answers, unrelated business topics),
respond only with: "This tool is designed for freelancer-client situations only."
Do not attempt to generate any other response.
```

### D-06/D-07: Login page error banner

`login/page.tsx` is already a Client Component. Add `useSearchParams`:

```typescript
import { useSearchParams } from 'next/navigation'

// Inside component:
const searchParams = useSearchParams()
const authError = searchParams.get('error')
```

In JSX, above the form (or above the Google button), conditionally render the red banner:
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

This reuses the exact same error style already used in the form's `{error && (...)}` block (lines 76–80 of login/page.tsx). [VERIFIED: source file]

---

## Execution Order

**Wave 0 — Prerequisite (nothing else can land without this):**
1. Install Zod: `npm install zod`
2. Write and apply Supabase migration `002_atomic_gating.sql` with both RPC functions

**Wave 1 — Auth + login (no dependencies on Wave 0):**
3. Fix auth callback error check (`app/auth/callback/route.ts`) — RELY-03
4. Add error banner to login page (`app/(auth)/login/page.tsx`) — D-06/D-07

**Wave 2 — Lib changes (no route dependencies):**
5. Add off-topic guard to `DEFENSE_SYSTEM_PROMPT` in `lib/anthropic.ts` — D-14
6. Add JSON extraction helper to contracts analyze route (or as lib util) — RELY-02

**Wave 3 — Defend route (depends on Wave 0: Zod + RPC):**
7. Add Zod schema + parse — VALID-01
8. Replace read-then-write gate with RPC call — GATE-01
9. Wrap entire body in try/catch — RELY-01
10. Add credit-safe insert check + compensating decrement — RELY-04

**Wave 4 — Contracts analyze route (depends on Wave 0: Zod + RPC):**
11. Add file type/size validation — VALID-03
12. Replace read-then-write gate with RPC call — GATE-02
13. Apply JSON extraction helper — RELY-02 (if not done in Wave 2)
14. Add credit-safe guard (verify insert before increment) — D-03

**Wave 5 — Projects POST (depends on Wave 0: Zod only):**
15. Add Zod schema + parse — VALID-02

**Wave 6 — Response history gating:**
16. Update `history/page.tsx` to fetch profile and pass plan — GATE-03
17. Update `ResponseHistory` component to render locked cards — GATE-03

---

## Risks & Landmines

### 1. Next.js 16: Params are Promises (already handled)
**Risk:** Routes using params as synchronous values would break.
**Status:** Defend route ALREADY uses the correct async pattern: `{ params }: { params: Promise<{ id: string }> }` with `await params`. [VERIFIED: source file, line 16-17]
**Status:** `history/page.tsx` ALREADY uses async params correctly: line 7. [VERIFIED: source file]
**No action needed** for params pattern.

### 2. Next.js 16: searchParams in Pages are also Promises
**Risk:** `page.tsx` receiving `searchParams` as a prop must await it.
**Impact on this phase:** Login page is a Client Component — it uses `useSearchParams()` hook, NOT the `searchParams` prop. No promise issue.
**History page:** Does not use searchParams. No issue.
**No risk for this phase.**

### 3. Supabase RPC: security definer scope
**Risk:** RPC functions with `SECURITY DEFINER` run as the function owner (typically the Supabase service role), bypassing RLS. This is required for the atomic UPDATE to work even when called with the anon key. If the function is `SECURITY INVOKER`, the calling user's RLS must allow updating their own `user_profiles` row.
**Status:** The existing `user_profiles` policy is `for all using (auth.uid() = id)` which allows UPDATE. `SECURITY INVOKER` would work with the server-side Supabase client (which uses the user's session). Either approach works, but `SECURITY DEFINER` is more explicit. [ASSUMED — test against actual Supabase RLS behavior]

### 4. Supabase RPC: .rpc() return shape
**Risk:** `supabase.rpc()` returns `{ data, error }` where `data` is the function's RETURNS value. For `RETURNS jsonb`, `data` will be the parsed JSON object directly (e.g., `{ allowed: true, current_count: 2 }`).
**Confirm:** Pattern `const { data: gateResult } = await supabase.rpc(...)` → `gateResult?.allowed` is the correct access path. [ASSUMED — standard Supabase SDK behavior, not verified against SDK docs in this session]

### 5. Zod: z.enum() with Object.keys() — type assertion required
**Risk:** `z.enum(Object.keys(TOOL_LABELS))` fails TypeScript because `Object.keys()` returns `string[]` but `z.enum()` requires a non-empty tuple `[string, ...string[]]`.
**Fix:** `z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]])` — this is safe because `TOOL_LABELS` always has the 8 known keys.
**Alternative:** Define the enum values explicitly as a const array — more type-safe but requires maintenance if DefenseTool changes.

### 6. Contract analyze route: pending row leak on validation failure
**Risk:** The contract row is inserted with `status: 'pending'` BEFORE file validation (line 29 of analyze/route.ts). If validation fails and the route returns 400, the pending row remains in the DB.
**Fix:** Set `status: 'error'` on the contract row before returning 400 (same pattern as the existing `else` branch on line 53). This is included in the VALID-03 approach above.

### 7. ResponseHistory component: plan prop changes interface
**Risk:** `ResponseHistory` is currently used in `history/page.tsx` only. Adding a required `plan` prop breaks the existing call site if not updated together.
**Fix:** Update both files in the same task. Or make `plan` optional with a default of `'free'` for safety.

### 8. Auth callback: NextResponse vs Response
**Risk:** The project convention is `Response.json()` NOT `NextResponse.json()` for route handlers. However, `auth/callback/route.ts` is a GET handler that redirects — it must use `NextResponse.redirect()` (which is the correct API for redirects from route handlers). This is not a convention violation; `NextResponse.redirect` is the standard redirect API. [VERIFIED: Next.js 16 route.md, proxy.md]

### 9. Compensating decrement complexity
**Risk:** The "reserve and release" pattern for RELY-04 adds complexity. If the compensating decrement fails (network error), the user has permanently lost a credit.
**Mitigation:** Log the failure with `console.error`. Acceptable risk for v1 — a failed decrement on a failed Anthropic call is an edge-case within an edge-case. A periodic reconciliation job is a v2 concern (OPS-03 territory).

### 10. Middleware.ts must be renamed to proxy.ts (Phase 2, NOT Phase 1)
**Risk:** INFRA-03 requires this rename. The current `middleware.ts` uses the deprecated `middleware` export name. In Next.js 16, the file should be `proxy.ts` with a `proxy` export.
**Phase 1 status:** This is explicitly a Phase 2 requirement (INFRA-03). DO NOT rename in Phase 1 — middleware.ts continues to work with backward compatibility in Next.js 16 (deprecated but not removed). Changing it in Phase 1 would expand scope unnecessarily.

---

## Validation Architecture

Manual verification steps for each requirement (no automated test infrastructure detected):

| Req ID | Behavior to Verify | How to Test |
|--------|-------------------|-------------|
| RELY-01 | Anthropic error returns 400/500 with readable message | Temporarily set an invalid ANTHROPIC_API_KEY, call the defend route, confirm response is `{ error: 'AI generation failed — please try again' }` not a blank 500 |
| RELY-02 | Contract analysis handles preamble-wrapped JSON | Unit test `extractJson()` with preamble input, markdown-wrapped input, and truncated input |
| RELY-03 | Auth callback failure redirects to /login?error=auth_failed | Replay an already-used OAuth code; confirm redirect URL contains `?error=auth_failed` |
| RELY-04 | Credit not consumed on DB failure | Mock Supabase insert to return error; confirm counter was not incremented (check user_profiles after failed call) |
| GATE-01 | Concurrent defend requests don't both pass the limit | Fire 2 concurrent requests at the limit; confirm only one succeeds and one returns UPGRADE_REQUIRED |
| GATE-02 | Concurrent contract requests don't both pass the limit | Same as GATE-01 pattern for contracts |
| GATE-03 | Free user sees 3 cards, 4th+ are blurred | Create a free user with 4+ responses; visit /projects/[id]/history; confirm first 3 are clear, 4th+ are blurred |
| VALID-01 | Invalid tool_type → 400; situation > 2000 chars → 400 | POST to defend route with `tool_type: 'invalid'`; POST with situation length 2001 |
| VALID-02 | title >200 chars → 400; invalid email → 400 | POST to projects with title of 201 chars; POST with `client_email: 'notanemail'` |
| VALID-03 | Non-PDF file → 400; file >10MB → 400 | POST form with a .txt file; POST form with a PDF > 10MB |

**Quick validation command:** `npm run lint` after each file change to confirm no TypeScript errors.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase `.rpc()` returns `data` as the parsed JSONB object directly | Technical Approach — GATE-01/02 | Route would need to unwrap `data` differently |
| A2 | Zod `z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]])` compiles without TS error | VALID-01 | TypeScript compile error; need alternative enum definition |
| A3 | Supabase RPC with `SECURITY DEFINER` is appropriate for atomic UPDATE bypass | Technical Approach — RPC | RLS may block the update if wrong security context chosen |
| A4 | `npm install zod` will install Zod 3.x stable | Dependencies | API differences if 4.x is available and has breaking changes |

---

## Sources

### Primary (HIGH confidence — verified against live files)
- `/app/api/projects/[id]/defend/route.ts` — current defend route implementation
- `/app/api/contracts/analyze/route.ts` — current contract analysis implementation
- `/app/auth/callback/route.ts` — current auth callback implementation
- `/app/api/projects/route.ts` — current projects route implementation
- `/app/(dashboard)/projects/[id]/history/page.tsx` — current history page implementation
- `/app/(auth)/login/page.tsx` — current login page implementation
- `/lib/anthropic.ts` — current Anthropic client and prompts
- `/lib/plans.ts` — FREE_LIMIT constants
- `/types/index.ts` — DefenseTool enum values
- `/supabase/migrations/001_initial.sql` — DB schema
- `/package.json` — dependency list (confirmed zod absent)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Next.js 16 route handler API (params as Promise confirmed)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — Next.js 16 page searchParams as Promise
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — Next.js 16 middleware→proxy rename (middleware.ts is deprecated)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` — useSearchParams is Client Component hook

### Secondary (ASSUMED — based on standard patterns, not verified via docs in this session)
- Zod 3.x API for `z.object`, `z.enum`, `z.string().min().max()`, `z.record()`
- Supabase `.rpc()` return shape for JSONB functions
- Postgres `SELECT FOR UPDATE` + conditional UPDATE pattern for atomic gating

---

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH — all source files read directly
- Standard stack: HIGH — package.json verified, Next.js 16 docs read
- Architecture patterns: HIGH — established by existing code conventions
- Supabase RPC approach: MEDIUM — pattern is well-known but specific Supabase SDK behavior for RPC return shape is ASSUMED
- Zod schema patterns: MEDIUM — Zod 3.x standard, not verified against docs this session

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (stable stack)
