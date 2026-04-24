---
phase: 03-legal-email
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - app/privacy/page.tsx
  - app/terms/page.tsx
  - app/(auth)/signup/page.tsx
  - lib/email.ts
  - app/auth/callback/route.ts
  - app/api/webhooks/stripe/route.ts
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files were reviewed covering legal pages, signup flow, transactional email, the auth callback, and the Stripe webhook handler. The legal pages and terms are clean static content with no code issues. The Stripe webhook handler is well-structured with signature verification and proper fire-and-forget email dispatch.

Two areas require attention before launch:

1. **Critical:** `billing.amount` and `billing.nextBillingDate` are interpolated directly into an HTML email template without any escaping. The values originate from Stripe's API and are therefore attacker-controlled in a scenario where Stripe metadata is tampered with or a confused-deputy attack occurs. This is an HTML injection sink.

2. **Warnings:** The Google OAuth handler silently swallows errors, the auth callback always redirects to `/dashboard` even when no code is present, `session.subscription` is cast as `string` without a null guard before being stored in the database, and the module-level non-null assertions on `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL` crash the process at import time if the env vars are absent.

---

## Critical Issues

### CR-01: Unsanitized billing data interpolated into HTML email template

**File:** `lib/email.ts:46-47`
**Issue:** `billing.amount` and `billing.nextBillingDate` are string values sourced from Stripe's API and interpolated directly into an HTML template via template literals. If either value contains angle brackets or other HTML metacharacters — through unexpected Stripe API responses or a confused-deputy scenario — the rendered email could execute HTML in the recipient's mail client. The values bypass all encoding.

The specific sink is:
```
Amount charged: <strong ...>${billing.amount}</strong>
Next billing date: <strong ...>${billing.nextBillingDate}</strong>
```

**Fix:** Escape HTML metacharacters before interpolation. Add a minimal escape helper and apply it to both values:

```typescript
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// In upgradeHtml(), replace the interpolations:
Amount charged: <strong style="color:#fafafa;">${escapeHtml(billing.amount)}</strong><br>
Next billing date: <strong style="color:#fafafa;">${escapeHtml(billing.nextBillingDate)}</strong>
```

---

## Warnings

### WR-01: Google OAuth errors silently swallowed — user sees no feedback

**File:** `app/(auth)/signup/page.tsx:34-40`
**Issue:** `handleGoogle` does not handle the error returned by `signInWithOAuth`. If the OAuth call fails (network error, provider misconfiguration, popup blocked), the function returns silently and the user sees no feedback. The `error` state is never set.

```typescript
async function handleGoogle() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({   // error return ignored
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
}
```

**Fix:** Destructure the error and surface it:

```typescript
async function handleGoogle() {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) setError(error.message)
}
```

---

### WR-02: Auth callback redirects to /dashboard even when no code is present

**File:** `app/auth/callback/route.ts:8-31`
**Issue:** When the `code` query parameter is absent (e.g., a direct hit, a bot crawl, or a malformed link), the handler skips the `if (code)` block entirely and falls through to an unconditional `NextResponse.redirect` to `/dashboard`. This silently redirects unauthenticated requests to the protected dashboard, which either exposes the dashboard or triggers a confusing redirect loop depending on middleware.

```typescript
if (code) {
  // ... exchange code ...
}
// reached even when code is missing:
return NextResponse.redirect(`${origin}/dashboard`)
```

**Fix:** Return an error redirect when no code is present:

```typescript
if (!code) {
  return NextResponse.redirect(`${origin}/login?error=missing_code`)
}

const supabase = await createServerSupabaseClient()
const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (error) {
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
// ... rest of handler ...
return NextResponse.redirect(`${origin}/dashboard`)
```

---

### WR-03: `session.subscription` cast to string without null guard before DB write and Stripe API call

**File:** `app/api/webhooks/stripe/route.ts:34,62`
**Issue:** `session.subscription` can be `null` for non-subscription checkout sessions (one-time payments). It is cast directly to `string` in two places without a prior null check:

- Line 34: `stripe_subscription_id: session.subscription as string` — writes `"null"` (the string) to the database.
- Line 62: `stripe.subscriptions.retrieve(session.subscription as string)` — makes an API call to Stripe with `"null"` as the subscription ID, which throws and is caught, but the DB already has a corrupt value.

**Fix:** Guard on `session.subscription` before processing:

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  const userId = session.metadata?.user_id
  if (!userId) return Response.json({ received: true })

  // Ignore one-time payment sessions that have no subscription
  if (!session.subscription) return Response.json({ received: true })

  const { error } = await supabase
    .from('user_profiles')
    .update({
      plan: 'pro',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId)
  // ...
}
```

---

### WR-04: Module-level non-null assertions on env vars crash the process at import time

**File:** `lib/email.ts:4-5`
**Issue:** `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL` use the TypeScript non-null assertion operator (`!`) at module load time. If either variable is undefined at runtime (missing from `.env`, misconfigured deployment), the module will not throw immediately — TypeScript `!` is a compile-time assertion only. However, the undefined value will be used silently: `FROM` will be `undefined`, causing every Resend API call to fail with a cryptic "invalid from address" error rather than a clear startup error.

Additionally, `APP_URL` is embedded in HTML templates at call time. If `NEXT_PUBLIC_APP_URL` is undefined, the dashboard link in every email will be `undefined/dashboard`.

```typescript
const FROM = process.env.RESEND_FROM_EMAIL!   // no runtime guard
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!  // no runtime guard
```

**Fix:** Add explicit runtime validation with a clear error message:

```typescript
const FROM = process.env.RESEND_FROM_EMAIL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

if (!FROM) throw new Error('Missing env var: RESEND_FROM_EMAIL')
if (!APP_URL) throw new Error('Missing env var: NEXT_PUBLIC_APP_URL')
```

This causes an immediate, descriptive startup failure rather than a silent misfire in production.

---

## Info

### IN-01: `handleGoogle` lacks loading state — button can be double-clicked

**File:** `app/(auth)/signup/page.tsx:34-40`
**Issue:** The Google OAuth button has no loading/disabled state during the `signInWithOAuth` call. Users can click it multiple times before the browser redirect, potentially dispatching multiple OAuth flows. The `loading` state exists in the component but is only used for the email/password form.

**Fix:** Set `loading` before the call and clear it on error:

```typescript
async function handleGoogle() {
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
  // On success the browser navigates away — no need to clear loading
}
```

Then apply `disabled={loading}` to the Google button as is already done for the submit button.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
