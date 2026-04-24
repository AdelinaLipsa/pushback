---
phase: 02-infrastructure-security
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - lib/supabase/server.ts
  - app/api/webhooks/creem/route.ts
  - proxy.ts
  - next.config.ts
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 2 adds a webhook signature guard, a synchronous admin Supabase client, the `/settings` route to proxy auth protection, and a set of HTTP security headers. The direction is sound and the signature verification approach is correct in structure, but there are two critical issues: a timing attack vulnerability in the HMAC comparison and unguarded Supabase write operations that silently swallow failures. There are also three warnings around the dead `createServiceSupabaseClient`, an unreachable URL error case, and a missing `X-Content-Type-Options` security header.

---

## Critical Issues

### CR-01: HMAC signature compared with `!==` — timing attack vulnerability

**File:** `app/api/webhooks/creem/route.ts:17`

**Issue:** The webhook signature is compared with a plain string inequality check (`expected !== signature`). String comparison in JavaScript short-circuits on the first mismatched character, leaking timing information to a remote attacker. An attacker can observe response-time variance to incrementally forge valid signatures, bypassing the webhook authentication entirely.

**Fix:** Use `crypto.timingSafeEqual` on `Buffer` values, which compares in constant time:

```typescript
const expectedBuf = Buffer.from(expected, 'hex')
const signatureBuf = Buffer.from(signature, 'hex')

if (
  expectedBuf.length !== signatureBuf.length ||
  !crypto.timingSafeEqual(expectedBuf, signatureBuf)
) {
  return Response.json({ error: 'Invalid signature' }, { status: 401 })
}
```

The length check guards against `timingSafeEqual` throwing when buffers have different lengths (which itself would be a timing leak via exception path).

---

### CR-02: Supabase write operations have no error handling — silent data loss

**File:** `app/api/webhooks/creem/route.ts:31-46`

**Issue:** Both `supabase.from('user_profiles').update(...)` calls are `await`-ed but their return values are fully discarded. The Supabase JS client never throws on a query error — it returns `{ error }`. If the update fails (row not found, RLS violation, network error, constraint violation), the webhook handler returns `{ received: true }` anyway, and the billing event is silently dropped. Creem will consider delivery successful and will not retry.

```typescript
// Current — error is silently discarded
await supabase
  .from('user_profiles')
  .update({ plan: 'pro', ... })
  .eq('id', userId)
```

**Fix:** Destructure and check `error` on every query; return a 5xx on failure so Creem retries the event:

```typescript
const { error } = await supabase
  .from('user_profiles')
  .update({
    plan: 'pro',
    creem_customer_id: object.customer?.id,
    creem_subscription_id: object.id,
  })
  .eq('id', userId)

if (error) {
  console.error('Failed to update user plan:', error.message)
  return Response.json({ error: 'Database update failed' }, { status: 500 })
}
```

Apply the same pattern to the cancellation/expiration branch (line 42-45).

---

## Warnings

### WR-01: `createServiceSupabaseClient` is dead code — service role key exposed unnecessarily

**File:** `lib/supabase/server.ts:25-43`

**Issue:** `createServiceSupabaseClient` is defined but has zero call sites anywhere in the codebase (confirmed by grep). It uses the service role key and the SSR cookie layer, which is an unusual combination — the service role key bypasses Row Level Security, so threading cookies through it provides no meaningful auth boundary and creates confusion about what the client is intended to do. Keeping an unused service-role-keyed factory increases the blast radius if this file is audited or if someone mistakenly reaches for it instead of `createAdminSupabaseClient`.

**Fix:** Remove `createServiceSupabaseClient` entirely. It has no callers; `createAdminSupabaseClient` now covers the service-role use case, and `createServerSupabaseClient` covers the user-scoped use case.

---

### WR-02: JSON.parse on unvalidated webhook body can throw and produce unhandled 500

**File:** `app/api/webhooks/creem/route.ts:21`

**Issue:** `JSON.parse(body)` is called after signature verification but with no try/catch. If Creem ever sends a malformed body that passes signature verification (e.g., a future format change), the route throws an uncaught exception, which Next.js renders as a generic 500 with a stack trace potentially exposed in non-production error handling. This is also a reliability concern because Creem will retry, potentially flooding logs.

**Fix:**

```typescript
let payload: unknown
try {
  payload = JSON.parse(body)
} catch {
  return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
}
```

---

### WR-03: Missing `X-Content-Type-Options` security header

**File:** `next.config.ts:22-41`

**Issue:** The security header block sets CSP, HSTS, `X-Frame-Options`, and `Referrer-Policy`, but omits `X-Content-Type-Options: nosniff`. This header prevents browsers from MIME-sniffing responses away from the declared `Content-Type`, which can enable content-injection attacks when user-uploaded content is served from the same origin. It is universally recommended alongside the other headers present and is trivially low cost.

**Fix:** Add to the headers array:

```typescript
{
  key: 'X-Content-Type-Options',
  value: 'nosniff',
},
```

---

## Info

### IN-01: CSP uses `'unsafe-inline'` for scripts — weakens XSS protection

**File:** `next.config.ts:5`

**Issue:** `script-src 'self' 'unsafe-inline'` allows any inline script to execute, which largely negates the XSS benefit of having a CSP at all. The Next.js CSP guide (present in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) recommends nonce-based CSP via the proxy layer instead, using `'nonce-${nonce}' 'strict-dynamic'` to allow only framework-injected scripts.

The static header approach is a known limitation when not using nonces — the guide explicitly shows moving CSP generation into `proxy.ts` so a fresh nonce is generated per request. This is a meaningful improvement for production hardening, but requires more refactoring than the current phase scope.

**Suggestion:** Note this as a follow-up task. For now, at minimum consider removing `'unsafe-inline'` from `script-src` if the app can function without it (test in staging). If inline scripts are required by Next.js internals, migrate to nonce-based CSP in proxy.ts using the pattern in the Next.js guide.

---

### IN-02: `createAdminSupabaseClient` uses non-null assertion on env vars without runtime check

**File:** `lib/supabase/server.ts:46-49`

**Issue:** `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.SUPABASE_SERVICE_ROLE_KEY!` use TypeScript non-null assertions that are erased at runtime. If either variable is missing in a deployment environment, `createClient` will be called with `undefined`, which may produce a client that silently fails or throws obscure errors at query time rather than at startup. The webhook route already has a guard for `CREEM_WEBHOOK_SECRET` (lines 5-10) — the same pattern should apply here.

**Suggestion:** Add a startup guard or assertion:

```typescript
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials in environment')
  }
  return createClient(url, key)
}
```

This fails loudly at the call site rather than producing a broken client that surfaces as a cryptic downstream error.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
