---
phase: 01-route-handler-hardening
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - app/auth/callback/route.ts
  - app/(auth)/login/page.tsx
  - lib/anthropic.ts
  - app/api/projects/[id]/defend/route.ts
  - app/api/contracts/analyze/route.ts
  - app/(dashboard)/projects/[id]/history/page.tsx
  - components/defense/ResponseHistory.tsx
  - app/api/projects/route.ts
  - supabase/migrations/002_atomic_gating.sql
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Nine files were reviewed across the auth callback, login page, AI integration layer, two API route handlers, a history page, a response-history component, the projects CRUD route, and the atomic gating migration.

Two critical issues were found: an open-redirect vulnerability in the OAuth callback route, and a client-side-only content gate in `ResponseHistory.tsx` that allows free-plan users to read locked content via DOM inspection. Four warnings cover missing input-length validation on contract text, a silent OAuth error swallow, a `NULL`-plan edge case in the gating SQL, and an orphan DB row created before input validation. Two info items address a redundant import and a type-cast that silences type errors.

---

## Critical Issues

### CR-01: Open Redirect in OAuth Callback

**File:** `app/auth/callback/route.ts:5,12,16`

**Issue:** `origin` is extracted from `request.url` without any validation and used directly as the redirect destination. An attacker can craft a link such as `https://evil.com/auth/callback?code=VALID_CODE` and, once the user follows it, they are redirected to `https://evil.com/dashboard` after a valid session exchange. The route also redirects to `origin/dashboard` unconditionally even when no `code` is present, which could be used to bounce users to an attacker-controlled site.

**Fix:** Pin the redirect target to the application's own origin using an environment variable, never the request origin.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${APP_URL}/dashboard`)
}
```

---

### CR-02: Client-Side-Only Content Gate Allows Free-Plan Users to Read Locked History

**File:** `components/defense/ResponseHistory.tsx:47,61,89`

**Issue:** The "locked" blur applied to history cards beyond index 2 is a CSS `filter: blur(4px)` on the wrapping `<div>`. The full response text is still rendered into the DOM inside `<pre>{r.response}</pre>` (line 89). Any free-plan user can open DevTools, remove or disable the `filter` style on the blur wrapper, and read all historical responses — defeating the upgrade paywall entirely.

The server page at `app/(dashboard)/projects/[id]/history/page.tsx:15` fetches all responses regardless of plan, so the data is already on the page.

**Fix:** Gate the data at the server level. Slice the responses array to 3 items for free-plan users before passing to the component, and send only a count for the remainder.

```typescript
// In app/(dashboard)/projects/[id]/history/page.tsx — after fetching responses and profile:
const plan = (profile?.plan ?? 'free') as Plan
const visibleResponses = plan === 'free'
  ? (responses ?? []).slice(0, 3)
  : (responses ?? [])
const lockedCount = plan === 'free'
  ? Math.max(0, (responses ?? []).length - 3)
  : 0

// Pass to component:
<ResponseHistory
  responses={visibleResponses as DefenseResponse[]}
  lockedCount={lockedCount}
  plan={plan}
/>
```

Then update `ResponseHistory.tsx` to render a non-data placeholder card for `lockedCount` items instead of blurring real content.

---

## Warnings

### WR-01: No Length Limit on Contract `text` Input Allows Unbounded API Cost

**File:** `app/api/contracts/analyze/route.ts:36,84`

**Issue:** When a contract is submitted as raw text (not PDF), `text` is taken from `formData` without any size check and injected directly into the Anthropic API message. A malicious or mistaken user can send megabytes of text, generating an extremely large API call, high token costs, and slow response times. `title` is also unchecked (no `max` constraint). There is a 10 MB guard for PDF uploads (line 66) but no equivalent for text.

**Fix:** Add an explicit byte/character limit before the Anthropic call.

```typescript
const text = formData.get('text') as string | null
const title = (formData.get('title') as string) || 'Untitled contract'

if (text && text.length > 100_000) {
  // compensate and return early
  await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
  return Response.json({ error: 'Contract text must be under 100,000 characters' }, { status: 400 })
}
if (title.length > 200) {
  // compensate and return early
  await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
  return Response.json({ error: 'Title must be under 200 characters' }, { status: 400 })
}
```

---

### WR-02: OAuth Sign-In Errors Silently Discarded

**File:** `app/(auth)/login/page.tsx:32-38`

**Issue:** `handleGoogle()` calls `supabase.auth.signInWithOAuth` without `await` and without handling the returned `{ error }`. If the OAuth flow fails to initiate (e.g., provider misconfiguration, network error), the error is silently dropped and the user sees no feedback. The loading spinner is also never set, so the button appears responsive when nothing happened.

**Fix:**

```typescript
async function handleGoogle() {
  setError('')
  setLoading(true)
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) {
    setError(error.message)
    setLoading(false)
  }
  // On success, browser navigates away — no need to setLoading(false)
}
```

---

### WR-03: NULL Plan in `user_profiles` Blocks All AI Features Silently

**File:** `supabase/migrations/002_atomic_gating.sql:17-27` and `42-52`

**Issue:** Both `check_and_increment_defense_responses` and `check_and_increment_contracts` branch on `current_plan = 'pro'` and `current_count < N`. If a user row has `plan IS NULL` (possible for users created before the column was added, or by a missing default), neither branch matches and `allowed` falls through to `false`. The caller receives `UPGRADE_REQUIRED` with no explanation, making the feature appear broken rather than gated.

**Fix:** Add a `COALESCE` to treat NULL plan as `'free'`, and add a comment documenting the assumption:

```sql
-- Treat NULL plan as 'free' so new/migrated users are never silently blocked
select COALESCE(plan, 'free'), defense_responses_used
into current_plan, current_count
from public.user_profiles
where id = uid
for update;
```

Apply the same change to `check_and_increment_contracts`.

---

### WR-04: Contract DB Row Created Before Input Validation Produces Orphan `error` Rows

**File:** `app/api/contracts/analyze/route.ts:43-88`

**Issue:** The contract row is inserted into the database at line 43 (status `'pending'`) before the code checks whether `file` or `text` were actually provided (line 86). For any request that omits both fields, the handler inserts a row, then immediately sets it to `'error'` status and returns a 400. Over time this produces a growing set of `error`-status orphan rows for every bad request.

**Fix:** Validate inputs before inserting the DB row:

```typescript
// Before the supabase.from('contracts').insert(...) call:
if (!file && !text) {
  await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
  return Response.json({ error: 'No file or text provided' }, { status: 400 })
}
if (file && file.type !== 'application/pdf') {
  await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
  return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
}
if (file && file.size > 10 * 1024 * 1024) {
  await supabase.from('user_profiles').update({ contracts_used: preIncrementCount }).eq('id', user.id)
  return Response.json({ error: 'File must be under 10 MB' }, { status: 400 })
}
// Now safe to insert the contract row
```

---

## Info

### IN-01: Redundant `Anthropic` Import in `contracts/analyze/route.ts`

**File:** `app/api/contracts/analyze/route.ts:1`

**Issue:** Line 1 imports the `Anthropic` default export directly from `@anthropic-ai/sdk`, while line 2 imports the pre-configured singleton `anthropic` from `@/lib/anthropic`. The line-1 import is only used for the `Anthropic.MessageParam` type annotation at line 57. This creates two import sources for the same package.

**Fix:** Use the type-only import form to make intent explicit:

```typescript
import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, CONTRACT_ANALYSIS_SYSTEM_PROMPT } from '@/lib/anthropic'
```

---

### IN-02: `(project.contracts as any)` Cast Silences Type Errors on Join Shape

**File:** `app/api/projects/[id]/defend/route.ts:80`

**Issue:** The Supabase join result `project.contracts` is cast to `any` before accessing `.analysis`. If the join is ever changed (e.g., the column is renamed or the select string is updated), this cast will silently return `undefined` rather than producing a compile-time error. The contract context would then be missing from every AI prompt with no indication of why.

**Fix:** Define an inline type for the project select shape or use optional chaining with a typed assertion:

```typescript
// Declare a type matching the select shape:
type ProjectWithContract = {
  contracts: { analysis: ContractAnalysis | null } | null
}
// Then cast to that type instead of `any`:
const contractAnalysis = (project as unknown as ProjectWithContract).contracts?.analysis
const contractContext = contractAnalysis
  ? `\n\nCONTRACT DATA:\n${JSON.stringify(contractAnalysis, null, 2)}`
  : '\n\n(No contract — do not reference or invent contract terms)'
```

---

_Reviewed: 2026-04-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
