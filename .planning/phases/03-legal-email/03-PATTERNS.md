# Phase 3: Legal & Email - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 6 (2 create new pages, 1 create new lib helper, 3 modify existing)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/privacy/page.tsx` | page (Server Component) | request-response (static) | `app/(auth)/signup/page.tsx` | role-match (same dark theme layout, same CSS variables, no auth) |
| `app/terms/page.tsx` | page (Server Component) | request-response (static) | `app/(auth)/signup/page.tsx` | role-match (same dark theme layout, same CSS variables, no auth) |
| `lib/email.ts` | utility/helper | request-response (fire-and-forget) | `lib/stripe.ts` | role-match (singleton init at module scope, typed exports) |
| `app/(auth)/signup/page.tsx` | page (Client Component) | request-response | `app/(auth)/signup/page.tsx` | exact (modifying self — exact text location at line 148) |
| `app/auth/callback/route.ts` | route handler (GET) | request-response | `app/auth/callback/route.ts` | exact (modifying self — current code is 17 lines, read in full) |
| `app/api/webhooks/stripe/route.ts` | route handler (POST) | event-driven (webhook) | `app/api/webhooks/stripe/route.ts` | exact (modifying self — injection point after line 35) |

---

## Pattern Assignments

### `app/privacy/page.tsx` (Server Component, static)

**Analog:** `app/(auth)/signup/page.tsx`

**Key differences from analog:** No `'use client'` directive. No imports (pure JSX). Wider container (max 720px vs 400px) to hold prose content. Same outer shell and color system.

**Outer shell pattern** (from `app/(auth)/signup/page.tsx` lines 57-58):
```tsx
// No 'use client' — this is a Server Component
export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {/* content */}
      </div>
    </div>
  )
}
```

**Wordmark header pattern** (from `app/(auth)/signup/page.tsx` lines 60-63):
```tsx
<div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
  <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
    <span style={{ color: 'var(--brand-amber)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>
  </a>
</div>
```
Note: Use plain `<a>` instead of `<Link>` since Server Components can use either, and this is a simple same-site link with no prefetching benefit.

**Content card pattern** (from `app/(auth)/signup/page.tsx` line 67):
```tsx
<div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
  {/* prose sections */}
</div>
```

**CSS custom properties in use** (confirmed from `app/globals.css`):
- `var(--bg-base)` = `#0a0a0a` — page background
- `var(--bg-surface)` = `#111111` — card background
- `var(--bg-border)` = `#2a2a2a` — card border
- `var(--text-primary)` = `#fafafa` — headings
- `var(--text-secondary)` — body text
- `var(--text-muted)` — secondary body text
- `var(--brand-amber)` = `#f59e0b` — accent (use this value in the app; email templates use inline hex)

**Section heading pattern** (derive from existing typography usage):
```tsx
<h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
  Section Title
</h2>
<p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
  Body text.
</p>
```

---

### `app/terms/page.tsx` (Server Component, static)

**Analog:** `app/(auth)/signup/page.tsx`

Identical outer shell and card pattern as `app/privacy/page.tsx` above. Only the page heading and prose content differ. Copy the exact same structural template; change the `<h1>` and section content for Terms of Service.

No additional patterns beyond what is documented for `app/privacy/page.tsx`.

---

### `lib/email.ts` (utility helper, fire-and-forget)

**Analog:** `lib/stripe.ts`

**Module-scope singleton pattern** (from `lib/stripe.ts` lines 1-3):
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```
Apply same pattern to Resend: one `import`, one module-scope `const` instantiation — NOT per-call instantiation.

**`lib/email.ts` module init pattern:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL!
```

**Typed named export pattern** (from `lib/stripe.ts` lines 5-15):
```typescript
// lib/stripe.ts: exports typed async functions (not default export)
export async function createCheckoutSession(userId: string, userEmail: string) {
  const session = await stripe.checkout.sessions.create({ ... })
  return session
}
```
Apply same pattern: named `export async function sendWelcomeEmail(to: string): Promise<void>` and `export async function sendUpgradeEmail(to: string, billing: BillingDetails): Promise<void>`.

**Error throw pattern** (functions throw so `.catch()` fire-and-forget at call site works):
```typescript
export async function sendWelcomeEmail(to: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Pushback — your free account is ready',
    html: welcomeHtml(),
  })
  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
```
The `throw` is intentional — callers use `.catch((err) => { console.error(...) })` fire-and-forget pattern (see fire-and-forget pattern below).

**BillingDetails interface:**
```typescript
interface BillingDetails {
  amount: string | null       // e.g. "9.00 USD" or null
  nextBillingDate: string | null  // e.g. "May 24, 2026" or null
}
```

**Email HTML template pattern** (inline table layout for email client compatibility):
```typescript
function welcomeHtml(): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
          <span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span>
          <span style="color:#f59e0b;font-weight:800;font-size:1.5rem;">.</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <!-- body content -->
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
          <p style="color:#555;font-size:0.8rem;margin:0;">Pushback &mdash; adelina.lipsa@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```
Note: Use `#f59e0b` (the actual `--brand-amber` hex from globals.css) not `#f5a623` (CONTEXT.md D-10 has a typo). Email HTML uses inline hex because email clients do not support CSS custom properties.

---

### `app/(auth)/signup/page.tsx` — MODIFY (line 148)

**Analog:** `app/(auth)/signup/page.tsx` (modifying self)

**Current text at line 147-149** (exact text to replace):
```tsx
<p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.5 }}>
  By signing up you agree to our Terms and Privacy Policy.
</p>
```

**`Link` import already present at line 4:**
```tsx
import Link from 'next/link'
```

**Replacement pattern** (use existing `Link` style from line 154 as the anchor style):
```tsx
<p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.5 }}>
  By signing up you agree to our{' '}
  <Link href="/terms" style={{ color: 'var(--brand-amber)', fontWeight: 500, textDecoration: 'none' }}>Terms</Link>
  {' '}and{' '}
  <Link href="/privacy" style={{ color: 'var(--brand-amber)', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>.
</p>
```
The `<Link>` style is copied directly from the existing Link at lines 154-156 (`color: 'var(--brand-amber)', fontWeight: 500, textDecoration: 'none'`).

---

### `app/auth/callback/route.ts` — MODIFY

**Analog:** `app/auth/callback/route.ts` (modifying self — current file is 17 lines)

**Current full file** (lines 1-17):
```typescript
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

**Problem:** Line 10 destructures only `{ error }`, discarding `data`. `data.user` is needed for `email` and `created_at`.

**Import addition** — add `sendWelcomeEmail` import:
```typescript
import { sendWelcomeEmail } from '@/lib/email'
```

**Modified `exchangeCodeForSession` block** (replaces lines 9-13):
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (error) {
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

// New-signup detection: created_at within the last 60 seconds
const isNewUser = Date.now() - new Date(data.user.created_at).getTime() < 60_000
if (isNewUser && data.user.email) {
  // Fire-and-forget: never blocks the redirect
  sendWelcomeEmail(data.user.email).catch((err) => {
    console.error('Welcome email failed:', err)
  })
}
```

**Fire-and-forget pattern** — established in Phase 2 context and confirmed by `app/api/webhooks/stripe/route.ts` lines 37-39:
```typescript
// Pattern: log error, never throw, never await in critical path
.catch((err) => {
  console.error('Welcome email failed:', err)
})
```

---

### `app/api/webhooks/stripe/route.ts` — MODIFY

**Analog:** `app/api/webhooks/stripe/route.ts` (modifying self — current file is 57 lines)

**Existing imports at lines 1-3:**
```typescript
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
```
Add `sendUpgradeEmail` import:
```typescript
import { sendUpgradeEmail } from '@/lib/email'
```

**Existing `checkout.session.completed` block** (lines 23-41) — injection point is AFTER line 35 (successful DB update), BEFORE falling through to the final `return Response.json({ received: true })` at line 56:
```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  const userId = session.metadata?.user_id
  if (!userId) return Response.json({ received: true })

  const { error } = await supabase
    .from('user_profiles')
    .update({
      plan: 'pro',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user plan:', error.message)
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  // <<< EMAIL INJECTION POINT: after error check on line 37-40, before block closes >>>
}
```

**Email injection block** (insert between lines 40 and 41):
```typescript
  // Fetch user email for upgrade confirmation
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (profileData?.email) {
    let billingDetails: { amount: string | null; nextBillingDate: string | null } = {
      amount: session.amount_total != null && session.currency
        ? `${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`
        : null,
      nextBillingDate: null,
    }

    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      // CRITICAL: current_period_end is on SubscriptionItem in Stripe v22, NOT on Subscription root
      const periodEnd = sub.items.data[0]?.current_period_end
      if (periodEnd) {
        billingDetails.nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      }
    } catch (err) {
      console.error('Failed to retrieve subscription for billing date:', err)
      // nextBillingDate stays null — fallback text used in email template
    }

    // Fire-and-forget: must NOT cause a non-2xx response (would trigger Stripe retries)
    sendUpgradeEmail(profileData.email, billingDetails).catch((err) => {
      console.error('Upgrade email failed:', err)
    })
  }
```

**`createAdminSupabaseClient()` usage pattern** (from `app/api/webhooks/stripe/route.ts` line 21):
```typescript
// Synchronous — no await
const supabase = createAdminSupabaseClient()
```
The `supabase` variable created on line 21 is already in scope for the entire POST handler. Reuse it for the `user_profiles` email lookup — do NOT create a second admin client.

**Error response format** (from lines 37-39 and lines 51-53 of the webhook):
```typescript
return Response.json({ error: 'Database update failed' }, { status: 500 })
```
Any new error-returning paths (none needed for email — it's fire-and-forget) must use this exact format.

---

## Shared Patterns

### Fire-and-Forget Email Error Handling
**Source:** `app/api/webhooks/stripe/route.ts` lines 37-39 (error log pattern); `app/auth/callback/route.ts` (redirect-not-blocked pattern)
**Apply to:** All email send call sites in `app/auth/callback/route.ts` and `app/api/webhooks/stripe/route.ts`
```typescript
sendXxxEmail(email, details).catch((err) => {
  console.error('[descriptive label] email failed:', err)
})
// execution continues — no await, no throw, no return
```

### CSS Custom Property Palette
**Source:** `app/globals.css` (confirmed values)
**Apply to:** `app/privacy/page.tsx`, `app/terms/page.tsx`

| Variable | Hex Value | Use |
|----------|-----------|-----|
| `var(--bg-base)` | `#0a0a0a` | Page background |
| `var(--bg-surface)` | `#111111` | Card background |
| `var(--bg-border)` | `#2a2a2a` | Card border |
| `var(--text-primary)` | `#fafafa` | Headings |
| `var(--text-secondary)` | (dim white) | Body text |
| `var(--text-muted)` | (dimmer white) | Secondary body / meta text |
| `var(--brand-amber)` | `#f59e0b` | Accent; use this in app pages |

**Email HTML uses hardcoded hex** (CSS vars not supported in email clients):
- Background: `#0a0a0a`
- Card: `#111111`
- Border: `#2a2a2a`
- Text: `#fafafa`
- Muted text: `#a0a0a0`
- Accent: `#f59e0b` (use globals.css value, not the `#f5a623` typo in CONTEXT.md D-10)
- Footer text: `#555555`

### Supabase Admin Client (synchronous)
**Source:** `lib/supabase/server.ts` lines 25-30; used at `app/api/webhooks/stripe/route.ts` line 21
**Apply to:** `app/api/webhooks/stripe/route.ts` (email lookup reuses existing `supabase` variable)
```typescript
// Correct — synchronous, no await
const supabase = createAdminSupabaseClient()

// Incorrect — do NOT do this
const supabase = await createAdminSupabaseClient()
```

### `Response.json()` Error Format
**Source:** `app/api/webhooks/stripe/route.ts` lines 7, 18, 39, 53
**Apply to:** Any new error-return paths in route handlers
```typescript
return Response.json({ error: 'Descriptive message' }, { status: NNN })
```

### Pushback Wordmark in Headers
**Source:** `app/(auth)/signup/page.tsx` lines 61-63 and `app/(auth)/login/page.tsx` lines 45-47
**Apply to:** `app/privacy/page.tsx`, `app/terms/page.tsx` (page header), `lib/email.ts` (email header)
```tsx
// App pages (uses CSS variables and Link):
<span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
<span style={{ color: 'var(--brand-amber)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>

// Email HTML (uses inline hex, no Link):
<span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span>
<span style="color:#f59e0b;font-weight:800;font-size:1.5rem;">.</span>
```

---

## No Analog Found

All 6 files have direct analogs. No files require fallback to RESEARCH.md-only patterns.

---

## Critical Implementation Notes for Planner

1. **`current_period_end` is on `SubscriptionItem`, not `Subscription` root** in Stripe v22. Use `sub.items.data[0]?.current_period_end`. Accessing `sub.current_period_end` directly returns `undefined` at runtime and causes a TypeScript error.

2. **Amber hex discrepancy:** CONTEXT.md D-10 specifies `#f5a623` but globals.css defines `--brand-amber: #f59e0b`. Use `#f59e0b` in email HTML to match the actual design system. The difference is visible.

3. **Legal pages are NOT in a route group.** Place at `app/privacy/page.tsx` and `app/terms/page.tsx` (top-level in `app/`), not inside `app/(auth)/` or `app/(dashboard)/`.

4. **`sendWelcomeEmail` and `sendUpgradeEmail` must throw on Resend error** (not swallow it) so the `.catch()` at call sites receives the error for logging. The fire-and-forget `.catch()` is at the call site, not inside the helper.

5. **`supabase` admin client in the webhook is already instantiated at line 21.** Reuse it for the email fetch query — do not create a second admin client.

---

## Metadata

**Analog search scope:** `app/(auth)/`, `app/api/webhooks/stripe/`, `app/auth/callback/`, `lib/`
**Files read:** 7 (`signup/page.tsx`, `login/page.tsx`, `callback/route.ts`, `stripe/route.ts`, `lib/stripe.ts`, `lib/supabase/server.ts`, plus CONTEXT.md and RESEARCH.md)
**Pattern extraction date:** 2026-04-24
