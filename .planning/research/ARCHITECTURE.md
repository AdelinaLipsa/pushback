# Architecture Patterns

**Project:** Pushback (Next.js 16 SaaS hardening)
**Researched:** 2026-04-23
**Mode:** Architecture — five specific hardening questions

---

## Q1: Atomic Supabase Usage Counters

**Verdict:** The current implementation is a confirmed race condition. The fix is a PostgreSQL function called via `supabase.rpc()`.

**The bug (current code in both route handlers):**

```typescript
// Step 1 — read
const { data: profile } = await supabase.from('user_profiles')
  .select('plan, defense_responses_used').eq('id', user.id).single()

// Step 2 — check
if (profile?.plan === 'free' && profile.defense_responses_used >= 3) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}

// ... many async operations (Anthropic call, DB write) ...

// Step 3 — write (non-atomic with Step 1)
await supabase.from('user_profiles')
  .update({ defense_responses_used: (profile.defense_responses_used ?? 0) + 1 })
  .eq('id', user.id)
```

Two concurrent requests can both pass Step 2 reading `2`, both call Anthropic, both write `3`. The free user gets two responses for the price of one.

**Correct pattern: PostgreSQL RPC with row-level locking**

Create a SQL function that checks and increments atomically inside a single transaction:

```sql
-- supabase/migrations/002_atomic_counters.sql

CREATE OR REPLACE FUNCTION increment_defense_usage(p_user_id uuid, p_limit int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current int;
  v_plan text;
BEGIN
  -- Lock the row for the duration of this transaction
  SELECT plan, defense_responses_used
  INTO v_plan, v_current
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check limit
  IF v_plan = 'free' AND v_current >= p_limit THEN
    RETURN json_build_object('allowed', false, 'reason', 'UPGRADE_REQUIRED');
  END IF;

  -- Increment (only for free tier; pro has no cap)
  IF v_plan = 'free' THEN
    UPDATE user_profiles
    SET defense_responses_used = defense_responses_used + 1
    WHERE id = p_user_id;
  END IF;

  RETURN json_build_object('allowed', true, 'plan', v_plan);
END;
$$;

-- Identical function for contracts:
CREATE OR REPLACE FUNCTION increment_contracts_usage(p_user_id uuid, p_limit int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current int;
  v_plan text;
BEGIN
  SELECT plan, contracts_used
  INTO v_plan, v_current
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_plan = 'free' AND v_current >= p_limit THEN
    RETURN json_build_object('allowed', false, 'reason', 'UPGRADE_REQUIRED');
  END IF;

  IF v_plan = 'free' THEN
    UPDATE user_profiles
    SET contracts_used = contracts_used + 1
    WHERE id = p_user_id;
  END IF;

  RETURN json_build_object('allowed', true, 'plan', v_plan);
END;
$$;
```

Call from the Route Handler — replace the read-then-check-then-write pattern with a single RPC call *before* calling Anthropic:

```typescript
const { data: gate, error: gateError } = await supabase
  .rpc('increment_defense_usage', { p_user_id: user.id, p_limit: 3 })

if (gateError || !gate?.allowed) {
  return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
}
// plan is now in gate.plan — no separate profile fetch needed for gating
```

**Critical note on placement:** The RPC must run *before* the Anthropic call, not after. The current `contracts/analyze/route.ts` correctly has the check before the AI call, but it's not atomic. The defend route also checks before calling Anthropic. The RPC replaces the check AND the post-AI counter increment in one operation — just call it once at the top.

**SECURITY DEFINER caveat:** The function runs with the role that created it (typically `postgres`/`service_role`). This is correct here because `user_profiles` has RLS and the anon key client can't update arbitrary rows. The function's own WHERE clause enforces per-user scoping. This is the standard Supabase pattern for privileged atomic operations called from client-facing contexts.

**Confidence:** HIGH — `supabase.rpc()` is documented in `@supabase/postgrest-js` source, `FOR UPDATE` is standard PostgreSQL. The race condition in the current code is verifiable by reading both route handlers.

---

## Q2: Error Handling Pattern for Route Handlers Calling External AI APIs

**Verdict:** Wrap the entire Anthropic call and downstream DB writes in one try/catch. Structure errors as typed JSON objects. Log with request context.

**The problem in current code:**

`app/api/projects/[id]/defend/route.ts` has *no* try/catch. If `anthropic.messages.create()` throws (rate limit, timeout, API down), the route crashes with an unhandled rejection, Next.js returns a generic 500 with no body, and the client sees an opaque network error.

`app/api/contracts/analyze/route.ts` has a try/catch but only around the AI section — auth and profile checks are outside and will also crash ungracefully.

**Recommended pattern:**

```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. Parse params outside try/catch — these can't fail in ways worth catching
  const { id } = await params

  // 2. Wrap ALL fallible operations (auth check through response write)
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // 3. Atomic gate (RPC from Q1)
    const { data: gate, error: gateError } = await supabase
      .rpc('increment_defense_usage', { p_user_id: user.id, p_limit: 3 })
    if (gateError) throw new Error(`Gate RPC failed: ${gateError.message}`)
    if (!gate?.allowed) {
      return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
    }

    // 4. Input parsing — throw gives structured error via catch
    const body = await request.json()
    // (Zod validation here per Q scope)

    // 5. Anthropic call
    const message = await anthropic.messages.create({ ... })

    // 6. DB write
    const { data: saved, error: saveError } = await supabase
      .from('defense_responses').insert({ ... }).select().single()
    if (saveError) throw new Error(`DB write failed: ${saveError.message}`)

    return Response.json({ response: extractText(message), id: saved.id })

  } catch (err) {
    // 7. Classify error for correct HTTP status and client message
    const isAnthropicError = err instanceof Error && 'status' in err
    const isRateLimit = isAnthropicError && (err as any).status === 429
    const isTimeout = err instanceof Error && err.message.includes('timeout')

    console.error('[defend] route error', {
      route: `/api/projects/${id}/defend`,
      error: err instanceof Error ? err.message : String(err),
      type: isRateLimit ? 'rate_limit' : isTimeout ? 'timeout' : 'unknown',
    })

    if (isRateLimit) {
      return Response.json(
        { error: 'AI_RATE_LIMITED', message: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      )
    }

    return Response.json(
      { error: 'GENERATION_FAILED', message: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
}
```

**Error shape contract** — all route handlers return one of:

```typescript
// Success
{ response: string, id: string }

// Known client errors (never throw, always early-return)
{ error: 'Unauthorized' }                 // 401
{ error: 'UPGRADE_REQUIRED' }             // 403
{ error: 'Not found' }                    // 404

// Anthropic-specific (catchable)
{ error: 'AI_RATE_LIMITED', message: string }   // 429
{ error: 'GENERATION_FAILED', message: string } // 500
{ error: 'AI_TIMEOUT', message: string }        // 504 (if you want to distinguish)
```

**Anthropic SDK error types** (from `@anthropic-ai/sdk/src/core/error.ts`, confirmed HIGH confidence):
- `RateLimitError` — status 429
- `APIConnectionTimeoutError` — network timeout
- `APIConnectionError` — DNS/connection failure
- `InternalServerError` — status 500+ from Anthropic
- `AuthenticationError` — status 401 (bad API key — a misconfiguration)

Import and use them specifically:

```typescript
import Anthropic from '@anthropic-ai/sdk'

} catch (err) {
  if (err instanceof Anthropic.RateLimitError) { ... return 429 }
  if (err instanceof Anthropic.APIConnectionTimeoutError) { ... return 504 }
  if (err instanceof Anthropic.APIConnectionError) { ... return 503 }
  // fallthrough to 500
}
```

**Logging structure:** The current `console.error('Contract analysis error:', err)` loses request context. Log the route path and a stable error type at minimum so Vercel logs are queryable. No structured logging library needed — just consistent object shape.

**Confidence:** HIGH — error classes verified from SDK source. Route Handler wrapping pattern verified from Next.js 16 docs (`route.md`, webhook example).

---

## Q3: Service-Role Supabase Client in Webhook Handlers

**Problem in current code (`app/api/webhooks/creem/route.ts`):**

```typescript
export async function createServiceSupabaseClient() {
  const cookieStore = await cookies()   // THIS IS WRONG for webhooks
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },  // no cookies in webhook
        setAll(...) { ... }
      }
    }
  )
}
```

Webhook POST requests from Creem have no session cookies. Calling `cookies()` in a webhook context either throws (in Next.js dynamic rendering restrictions) or returns an empty cookie store. Worse, the service-role client backed by `@supabase/ssr`'s `createServerClient` is designed for session-aware contexts — it initializes auth storage, tries to detect sessions, hooks `onAuthStateChange`. None of this is appropriate for a backend-to-backend webhook.

**Correct pattern: use `@supabase/supabase-js` `createClient` directly**

The service-role client for webhooks does not need `@supabase/ssr` at all. It bypasses RLS entirely by virtue of the service role key, and requires no cookie plumbing:

```typescript
// lib/supabase/server.ts — replace createServiceSupabaseClient

import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free Supabase client using the service role key.
 * Use ONLY in webhook handlers and server-side scripts.
 * Never expose this client to browser contexts.
 * RLS is bypassed — all operations run with full DB privileges.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })
}
```

Note this is now synchronous (no `await cookies()`). The webhook handler updates accordingly:

```typescript
// app/api/webhooks/creem/route.ts

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('creem-signature') ?? ''
  const secret = process.env.CREEM_WEBHOOK_SECRET

  // Current bug: secret can be undefined if env var missing, HMAC runs with 'undefined' string
  if (!secret) {
    console.error('[webhook] CREEM_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (expected !== signature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(body)
    const supabase = createServiceSupabaseClient()  // synchronous now
    // ... rest of handler
  } catch (err) {
    console.error('[webhook] creem processing error', err)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

**Secondary bug caught:** `process.env.CREEM_WEBHOOK_SECRET!` with the non-null assertion still evaluates to the string `'undefined'` if the env var is missing. The explicit null check prevents HMAC comparison silently passing on misconfigured deployments.

**Component boundary implication:** `createServerSupabaseClient` (from `@supabase/ssr`) is for auth-aware route handlers and server components that need to read the session cookie. `createServiceSupabaseClient` (from `@supabase/supabase-js` directly) is for webhook handlers, background jobs, and any server context with no user session. These are two distinct client patterns — the abstraction in `lib/supabase/server.ts` should make this explicit.

**Confidence:** HIGH — verified by reading `@supabase/ssr/dist/main/createServerClient.js` (it calls `cookies_1.createStorageFromOptions` and hooks `onAuthStateChange`). The direct `createClient` pattern is documented in `@supabase/supabase-js` README and is the standard service-role pattern.

---

## Q4: Next.js Middleware Route Matching — Critical Deprecation

**Verdict:** This project is running Next.js 16.2.4, but `middleware.ts` is deprecated in Next.js 16. Migration to `proxy.ts` is required. The matcher pattern also has a gap: `/settings` is not protected.

**The deprecation (from `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`):**

> The `middleware` filename is deprecated, and has been renamed to `proxy` to clarify network boundary and routing focus.

> The named export `middleware` is also deprecated. Rename your function to `proxy`.

The `edge` runtime is NOT supported in `proxy`. The proxy runtime is `nodejs`.

**Migration steps (mechanical):**

```bash
mv middleware.ts proxy.ts
```

Then rename the export:
```typescript
// proxy.ts — was middleware.ts
export async function proxy(request: NextRequest) {  // was: middleware
  // ... same body
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

A codemod is available: `npx @next/codemod@latest middleware-to-proxy .`

**The matcher gap (current code):**

```typescript
const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
  request.nextUrl.pathname.startsWith('/projects') ||
  request.nextUrl.pathname.startsWith('/contracts')
  // MISSING: /settings
```

`/settings` is referenced in the dashboard layout and navbar, but is not in `isDashboardRoute`. An unauthenticated user who navigates directly to `/settings` will not be redirected by the proxy — they'll hit the dashboard layout's `getUser()` guard (the second auth layer) and get redirected, but that's relying on the fallback layer rather than the primary one.

**Recommended matcher and route logic:**

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/contracts') ||
    request.nextUrl.pathname.startsWith('/settings')  // ADD THIS

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Exclude: static assets, image optimization, favicon, API routes
  // Keep: all page routes including /settings, /privacy, /terms
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

**Why the existing matcher pattern is correct for page routes:** The pattern `/((?!_next/static|_next/image|favicon.ico|api).*)` already excludes API routes, which is correct — API routes do their own auth via `getUser()` in each handler. The proxy only needs to protect page routes. The current matcher is fine; only the route logic body needs `/settings` added.

**Supabase SSR and the proxy pattern:** The `createServerClient` call in the proxy is still correct for Next.js 16. The `@supabase/ssr` package's `createServerClient` works with the request/response cookie passing pattern. `@supabase/ssr` 0.10.2 (the installed version) supports this pattern.

**Confidence:** HIGH — migration requirement verified from `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` line 625-650. Matcher gap verified by reading `middleware.ts` directly.

---

## Q5: Safe Anthropic Response Parsing When Model May Return Non-JSON

**The problem in current code (`contracts/analyze/route.ts`):**

```typescript
const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
const analysis: ContractAnalysis = JSON.parse(rawText)  // throws if model returns prose
```

If Claude returns preamble before the JSON (`"Here is the analysis:\n\n{...}"`), or wraps it in markdown fences (` ```json\n{...}\n``` `), `JSON.parse` throws. The contract row gets set to `status: 'error'` via the outer catch, but the user doesn't know if it's a parse failure or an API failure.

**Pattern 1: JSON extraction (robust, current system prompt dependent)**

```typescript
function extractJSON(raw: string): unknown {
  // 1. Try direct parse first (happy path)
  try {
    return JSON.parse(raw)
  } catch {}

  // 2. Strip markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch {}
  }

  // 3. Find first { and last } (handles preamble/postamble)
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {}
  }

  return null
}
```

**Pattern 2: Validate shape after extraction**

The `ContractAnalysis` type currently relies on a TypeScript cast. After extraction, validate the shape before using it:

```typescript
function isValidContractAnalysis(obj: unknown): obj is ContractAnalysis {
  if (!obj || typeof obj !== 'object') return false
  const a = obj as Record<string, unknown>
  return (
    typeof a.risk_score === 'number' &&
    typeof a.risk_level === 'string' &&
    Array.isArray(a.red_flags) &&
    Array.isArray(a.recommendations)
    // add all required fields from ContractAnalysis type
  )
}
```

**Combined usage:**

```typescript
const rawText = message.content[0].type === 'text' ? message.content[0].text : null

if (!rawText) {
  throw new Error('No text content in Anthropic response')
}

const parsed = extractJSON(rawText)

if (!isValidContractAnalysis(parsed)) {
  console.error('[contracts/analyze] Invalid analysis shape', {
    rawTextSnippet: rawText.slice(0, 200),
    parsed,
  })
  throw new Error('Contract analysis returned invalid structure')
}

const analysis = parsed  // type-narrowed to ContractAnalysis
```

**Pattern 3: System prompt hardening (most reliable prevention)**

The `CONTRACT_ANALYSIS_SYSTEM_PROMPT` should include an explicit instruction like:

```
Respond with ONLY valid JSON. No preamble, no explanation, no markdown code fences.
Your entire response must be parseable by JSON.parse().
```

This eliminates the need for extraction in the common case. The extraction fallback is still worthwhile for defense-in-depth.

**Handling `stop_reason`:** The SDK types show `stop_reason` can be `'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | 'pause_turn' | 'refusal' | null`. If `stop_reason === 'max_tokens'`, the JSON is truncated and will fail to parse. Check it:

```typescript
if (message.stop_reason === 'max_tokens') {
  throw new Error('Contract analysis was truncated — increase max_tokens or reduce contract length')
}
```

The current `max_tokens: 4096` for contract analysis may be insufficient for large contracts. For the defend route `max_tokens: 1024` is fine (prose output), but contract analysis returning structured JSON of many clauses may need 6000-8000.

**Confidence:** HIGH — `ContentBlock` union type, `TextBlock` interface, and `stop_reason` values verified from `@anthropic-ai/sdk/src/resources/messages/messages.ts` directly.

---

## Component Boundaries and Data Flow (Updated for Hardening)

The existing architecture document is sound. The hardening work modifies these component boundaries:

**`lib/supabase/server.ts` — two distinct client types**

```
createServerSupabaseClient()   — @supabase/ssr, cookie-based, for authed route handlers and server components
createServiceSupabaseClient()  — @supabase/supabase-js direct, cookie-free, for webhooks only
```

Currently both use `@supabase/ssr`. After hardening, only the first does.

**Route Handler internal flow (hardened)**

```
POST /api/projects/[id]/defend
  └─ try {
       auth check (createServerSupabaseClient)
       supabase.rpc('increment_defense_usage')  ← atomic gate replaces read+check+write
       Zod parse request body
       fetch project context
       anthropic.messages.create()
       save to defense_responses
       return { response, id }
     } catch (err) {
       classify: RateLimitError | TimeoutError | unknown
       console.error with route context
       return typed error response
     }
```

**`middleware.ts` → `proxy.ts` (file rename + /settings addition)**

```
proxy.ts matcher: all page routes except static/image/favicon/api
protected routes: /dashboard/* /projects/* /contracts/* /settings/*   ← /settings added
```

**Build order implications for the milestone:**

1. Write SQL migration (atomic RPC functions) — no code changes, just DB
2. Fix `createServiceSupabaseClient` — affects only `lib/supabase/server.ts` and webhook handler
3. Add CREEM_WEBHOOK_SECRET null check — one line in webhook handler
4. Wrap defend route in try/catch — currently has zero error handling
5. Replace defend route counter logic with RPC call
6. Fix contracts analyze route counter logic with RPC call
7. Add JSON extraction + shape validation to contracts analyze
8. Rename `middleware.ts` → `proxy.ts`, add `/settings` to protected routes

Steps 1-3 are isolated infrastructure changes with no client impact. Steps 4-7 are co-located changes in two route handlers. Step 8 is a file rename with a codemod available.

---

## Sources

- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — middleware-to-proxy deprecation (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler patterns (HIGH confidence)
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — proxy matcher pattern (HIGH confidence)
- `node_modules/@anthropic-ai/sdk/src/core/error.ts` — error class hierarchy (HIGH confidence)
- `node_modules/@anthropic-ai/sdk/src/resources/messages/messages.ts` — ContentBlock union, TextBlock, stop_reason values (HIGH confidence)
- `node_modules/@supabase/postgrest-js/src/PostgrestClient.ts` — `.rpc()` call signature (HIGH confidence)
- `node_modules/@supabase/ssr/dist/main/createServerClient.js` — cookie dependency of createServerClient (HIGH confidence)
- Direct code analysis of: `app/api/projects/[id]/defend/route.ts`, `app/api/contracts/analyze/route.ts`, `app/api/webhooks/creem/route.ts`, `middleware.ts`, `lib/supabase/server.ts`
