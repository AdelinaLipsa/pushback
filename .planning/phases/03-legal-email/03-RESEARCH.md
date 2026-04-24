# Phase 3: Legal & Email — Research

**Researched:** 2026-04-24
**Domain:** Transactional email (Resend SDK v6), Stripe webhook payloads, Next.js 16 static pages, legal page content
**Confidence:** HIGH (all critical claims verified against installed package types and local source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Legal Pages (LEGAL-01, LEGAL-02, LEGAL-03)**
- D-01: Full production-quality policies. Entity: Pushback. Contact: adelina.lipsa@gmail.com. Standard 30-day cancellation policy. Anthropic named as data processor. AI output disclaimer that responses are not legal advice. No specific jurisdiction.
- D-02: Page styling matches login/signup — `var(--bg-base)` dark background, centered card, CSS custom property typography.
- D-03: Signup page legal text converted to `<Link>` components to `/terms` and `/privacy`.

**Welcome Email (EMAIL-01)**
- D-04: Trigger: auth callback (`app/auth/callback/route.ts`), after successful `exchangeCodeForSession`. Detect new signup: `user.created_at` within 60 seconds. Covers both Google OAuth and email/password. Returning logins do NOT receive it.
- D-05: Content: state free-tier limits (3 AI responses, 1 contract analysis), direct link to dashboard. Warm but functional tone.
- D-06: Fire-and-forget. Email failure must not block the redirect.

**Upgrade Confirmation Email (EMAIL-02)**
- D-07: Trigger: Stripe webhook `checkout.session.completed` block, after DB update. `userId` from `session.metadata.user_id`. Fetch email from `user_profiles` via `createAdminSupabaseClient()`.
- D-08: Content includes `amount_total` + `currency` from session, next billing date from `stripe.subscriptions.retrieve(session.subscription).current_period_end`. Fallback to "billing details available in your Stripe dashboard" if any field is absent or retrieve fails.
- D-09: Fire-and-forget. Email failure must NOT cause webhook to return non-2xx.

**Email Design (EMAIL-01, EMAIL-02)**
- D-10: Branded inline HTML — dark background (`#0a0a0a`), amber accent (`#f5a623`), Pushback wordmark in header. Inline HTML template literal strings in `lib/email.ts`. No React Email dependency.
- D-11: `lib/email.ts` exports `sendWelcomeEmail(to: string)` and `sendUpgradeEmail(to: string, billingDetails: {...})`. Route handlers call helpers only — no Resend SDK calls in route files.

**Specifics**
- Signup legal text: `"By signing up you agree to our{' '}<Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>."`
- Welcome subject: "Welcome to Pushback — your free account is ready"
- Upgrade subject: "You're on Pushback Pro"
- Sender: `RESEND_FROM_EMAIL` env var
- New-user detection: `const isNewUser = Date.now() - new Date(user.created_at).getTime() < 60_000`

### Claude's Discretion

- Exact HTML/CSS structure of email templates (inline styles, table vs div layout)
- Exact wording of Privacy Policy and Terms of Service body text
- Whether to use `RESEND_FROM_EMAIL` env var or hardcode — env var preferred (already in `.env.local.example`)
- Precise Stripe payload field paths for billing amount and next billing date — verified below in research

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEGAL-01 | `/privacy` page with full Privacy Policy — names Anthropic as data processor, data retention and deletion rights | Next.js 16 static page pattern verified; CSS variables confirmed from globals.css |
| LEGAL-02 | `/terms` page with Terms of Service — AI output disclaimer, subscription terms, cancellation policy | Same static page pattern as LEGAL-01 |
| LEGAL-03 | Signup page links to `/privacy` and `/terms` with working hyperlinks | `Link` already imported in signup page; exact text location at line 148 confirmed |
| EMAIL-01 | Welcome email after signup — sets free-tier expectations, links to dashboard | `exchangeCodeForSession` return type confirmed; `user.created_at` typed as `string`; fire-and-forget pattern confirmed |
| EMAIL-02 | Upgrade confirmation email after Stripe subscription activates | Stripe field paths for `amount_total`, `currency`, `subscription` confirmed from SDK types; `current_period_end` location confirmed (on SubscriptionItem, NOT Subscription root) |
</phase_requirements>

---

## Summary

Phase 3 is two parallel tracks with no new data models and no new npm packages. Both tracks have clear injection points in existing files.

**Track 1 (Legal pages)** creates two new static page files (`app/privacy/page.tsx`, `app/terms/page.tsx`) and updates one line in the signup page. The styling pattern is already established in `app/(auth)/signup/page.tsx` — same inline-style dark theme with CSS custom properties. These pages are Server Components with no `'use client'` directive needed.

**Track 2 (Email)** creates `lib/email.ts` and modifies two existing route handlers. The Resend SDK v6 API is confirmed from the installed package types — `new Resend(key)` constructor, `resend.emails.send({ from, to, subject, html })`, returns `{ data: { id } | null, error: ErrorResponse | null }`. The critical Stripe finding is that in Stripe v22, `current_period_end` is on `SubscriptionItem` (inside `subscription.items.data[0]`), not on the `Subscription` object root — training data is wrong on this point. The auth callback must be updated to destructure `data.user` from `exchangeCodeForSession` return, which is not currently done (the existing route only checks `error`).

**Primary recommendation:** Implement in wave order — legal pages first (static, no integration risk), then `lib/email.ts`, then auth callback injection, then webhook injection. Legal pages unblock Stripe live mode. Email is fire-and-forget so it cannot destabilize existing flows.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Privacy Policy page | Frontend Server (SSR/Static) | — | Static RSC, no auth required, no client state |
| Terms of Service page | Frontend Server (SSR/Static) | — | Same as privacy |
| Signup page link update | Browser / Client | — | Signup page is already `'use client'`; Link import already present |
| Welcome email trigger | API / Backend | — | Auth callback is a server-side GET route handler |
| Upgrade email trigger | API / Backend | — | Stripe webhook is a server-side POST route handler |
| Email sending (Resend) | API / Backend | — | Server-only; API key must not reach the client |
| Billing detail retrieval | API / Backend | — | `stripe.subscriptions.retrieve()` uses secret key |

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Confirmed |
|---------|---------|---------|-----------|
| `resend` | 6.12.2 | Transactional email | [VERIFIED: node_modules/resend/package.json] |
| `stripe` | 22.1.0 | Billing detail retrieval in webhook | [VERIFIED: node_modules/stripe/VERSION] |
| `next` | 16.2.4 | Static page routing | [VERIFIED: package.json] |
| `@supabase/auth-js` | (via supabase-js) | `exchangeCodeForSession` return type | [VERIFIED: node_modules/@supabase/auth-js/dist/module/lib/types.d.ts] |

**No new packages required.** D-10 explicitly rules out React Email. All functionality is achievable with the installed stack.

---

## Architecture Patterns

### System Architecture Diagram

```
TRACK 1: Legal Pages
  Browser GET /privacy
    → Next.js App Router (static RSC)
    → app/privacy/page.tsx (new file)
    → renders inline-HTML dark page

  Browser GET /terms
    → Next.js App Router (static RSC)
    → app/terms/page.tsx (new file)
    → renders inline-HTML dark page

  app/(auth)/signup/page.tsx (modify line 148)
    → <Link href="/terms"> and <Link href="/privacy"> (already imported)

TRACK 2: Email
  New file: lib/email.ts
    new Resend(RESEND_API_KEY)
    sendWelcomeEmail(to)  → resend.emails.send({ html: welcomeTemplate })
    sendUpgradeEmail(to, billingDetails) → resend.emails.send({ html: upgradeTemplate })

  Modify: app/auth/callback/route.ts
    exchangeCodeForSession(code)
      → destructure { data, error }
      → if error: redirect to /login?error=auth_failed (existing)
      → data.user.created_at → isNewUser check
      → if isNewUser: sendWelcomeEmail(data.user.email).catch(() => {})  [fire-and-forget]
      → redirect to /dashboard (existing)

  Modify: app/api/webhooks/stripe/route.ts
    checkout.session.completed block:
      → existing DB update (unchanged)
      → createAdminSupabaseClient().from('user_profiles').select('email').eq('id', userId)
      → stripe.subscriptions.retrieve(session.subscription as string)
      → sub.items.data[0].current_period_end  [CRITICAL: on SubscriptionItem, not Subscription]
      → sendUpgradeEmail(email, billingDetails).catch(() => {})  [fire-and-forget]
      → return Response.json({ received: true }) (existing)
```

### Recommended Project Structure (additions only)

```
app/
├── privacy/
│   └── page.tsx        # LEGAL-01: Privacy Policy (new)
├── terms/
│   └── page.tsx        # LEGAL-02: Terms of Service (new)
lib/
└── email.ts            # EMAIL-01 + EMAIL-02: Resend helper (new)
```

### Pattern 1: Resend SDK v6 — Email Send

**Exact API confirmed from installed types at `node_modules/resend/dist/index.d.mts`:**

```typescript
// Source: node_modules/resend/dist/index.d.mts lines 484-596, 1604, 2112
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Send method signature:
// resend.emails.send(payload: CreateEmailOptions): Promise<CreateEmailResponse>
// CreateEmailResponse = { data: { id: string } | null, error: ErrorResponse | null }
// ErrorResponse = { message: string, statusCode: number | null, name: RESEND_ERROR_CODE_KEY }

const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL!,  // "Friendly Name <email@domain.com>" format supported
  to: recipientEmail,
  subject: 'Your subject',
  html: '<p>Your HTML content</p>',       // RequireAtLeastOne: html OR react OR text
})

// fire-and-forget pattern:
resend.emails.send({ from, to, subject, html }).catch((err) => {
  console.error('Email send failed:', err)
})
```

**Key v6 facts verified from types:**
- Constructor: `new Resend(key?: string)` — key is optional (can pass undefined, will fail at send time)
- Send via: `resend.emails.send()` not `resend.sendEmail()` (old v1 API)
- `from` format: supports `"Display Name <email@domain.com>"`
- Body requires at least one of: `html`, `react`, or `text` (union type `RequireAtLeastOne`)
- Error is in `result.error`, NOT thrown — no try/catch needed for Resend SDK errors; `{ data: null, error: ErrorResponse }` on failure
- `data.id` is the email ID on success

### Pattern 2: Auth Callback — New Signup Detection

**Current callback (lines 1-17 of `app/auth/callback/route.ts`):**
```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code)
```

**Problem:** The return value discards `data` entirely. `data.user` is needed for both the email address and `created_at`.

**Corrected pattern with email injection:**
```typescript
// Source: node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts line 753
// exchangeCodeForSession returns AuthTokenResponse:
// { data: { user: User, session: Session }, error: null }
// | { data: { user: null, session: null }, error: AuthError }

const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (error) {
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

// data.user is User (not null) when error is null
// User.created_at is typed as string — ISO 8601 timestamp
const isNewUser = Date.now() - new Date(data.user.created_at).getTime() < 60_000
if (isNewUser && data.user.email) {
  // fire-and-forget: never awaited, never blocks redirect
  sendWelcomeEmail(data.user.email).catch((err) => {
    console.error('Welcome email failed:', err)
  })
}

return NextResponse.redirect(`${origin}/dashboard`)
```

### Pattern 3: Stripe Webhook — Upgrade Email Injection

**Current webhook `checkout.session.completed` block ends at line 40 with `if (error) { ... return }`. Email goes after the successful DB update, before the final `return Response.json({ received: true })`.**

**Confirmed field paths from `node_modules/stripe/cjs/resources/Checkout/Sessions.d.ts`:**
- `session.amount_total` — `number | null` (in cents)
- `session.currency` — `string | null`
- `session.subscription` — `string | Subscription | null` (the subscription ID when mode is 'subscription')
- `session.metadata` — `Metadata | null`
- `session.metadata?.user_id` — already used in existing code (confirmed working)

**CRITICAL — `current_period_end` location in Stripe v22:**

`current_period_end` is NOT on the `Subscription` object root. In Stripe v22 SDK, it is on `SubscriptionItem`:

```typescript
// Source: node_modules/stripe/cjs/resources/SubscriptionItems.d.ts lines 50-55
// SubscriptionItem.current_period_end: number  (Unix timestamp)
// SubscriptionItem.current_period_start: number

const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
// subscription.items is ApiList<SubscriptionItem>
const periodEnd = subscription.items.data[0]?.current_period_end  // number | undefined
const nextBillingDate = periodEnd
  ? new Date(periodEnd * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  : null
```

**Full injection pattern with fallback (D-08):**
```typescript
// Inside checkout.session.completed block, after successful DB update
const userProfile = await createAdminSupabaseClient()
  .from('user_profiles')
  .select('email')
  .eq('id', userId)
  .single()

if (userProfile.data?.email) {
  // Collect billing details with fallback
  let billingDetails: { amount: string; nextBillingDate: string | null } = {
    amount: session.amount_total != null && session.currency
      ? `${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`
      : null,
    nextBillingDate: null,
  }

  try {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const periodEnd = sub.items.data[0]?.current_period_end
    if (periodEnd) {
      billingDetails.nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    }
  } catch (err) {
    console.error('Failed to retrieve subscription for billing date:', err)
    // billingDetails.nextBillingDate stays null — fallback text used in email
  }

  sendUpgradeEmail(userProfile.data.email, billingDetails).catch((err) => {
    console.error('Upgrade email failed:', err)
  })
}
```

### Pattern 4: Next.js 16 Static Page

**Confirmed from `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`:**

Legal pages are plain Server Components (no `'use client'`). They live at `app/privacy/page.tsx` and `app/terms/page.tsx` — directly in `app/`, NOT in a route group. This is correct because:
- They need no authentication protection (public pages)
- They need no dashboard layout wrapper
- The root `app/layout.tsx` (with Toaster) wraps them automatically

```typescript
// Source: Next.js 16 app router docs — layouts-and-pages.md
// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', ... }}>
      {/* content */}
    </div>
  )
}
```

No special config needed. No `export const dynamic` needed. Static by default.

### Pattern 5: Email HTML Template (inline, dark-themed)

Per D-10, templates are inline HTML template literals in `lib/email.ts`. Email clients have poor CSS support; use tables for layout and inline styles only.

**Compatibility rules (Claude's discretion — email client best practices):**
- Use `<table>` layout, not `<div>` — Outlook (desktop) ignores div-based layouts
- All styles must be inline (`style="..."`) — no `<style>` blocks, no CSS classes
- Maximum width: 600px (standard email width)
- Use web-safe fallback fonts: `font-family: -apple-system, Arial, sans-serif`
- Background: `#0a0a0a` (matches `--bg-base`)
- Accent: `#f5a623` (matches `--brand-amber`, per D-10 spec of `#f5a623`)
- Text: `#fafafa` (matches `--text-primary`)

### Anti-Patterns to Avoid

- **Awaiting email in critical paths:** `await sendWelcomeEmail(...)` in the auth callback blocks the redirect. Always fire-and-forget with `.catch(() => {})`.
- **Throwing on Resend error:** The SDK returns `{ data: null, error }` — it does NOT throw. No try/catch needed around `resend.emails.send()` for SDK errors. But the outer async function can still be `.catch()`-chained.
- **`session.subscription` assumed to be a string:** TypeScript types it as `string | Subscription | null`. Cast with `as string` is already the pattern in the existing webhook (`session.subscription as string` at line 33) — consistent.
- **Accessing `subscription.current_period_end` directly:** This field does NOT exist on the `Subscription` root in Stripe v22. Must use `subscription.items.data[0]?.current_period_end`. Failure to use the item-level field results in `undefined` at runtime.
- **Placing legal pages in a route group:** `app/(auth)/privacy/page.tsx` would give the page the auth group's layout (if it had one). Use `app/privacy/page.tsx` directly.
- **`new Resend()` instantiated inside the send function:** Instantiate once at module scope in `lib/email.ts` — not per-call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP / fetch to Resend REST API | `resend.emails.send()` | Already installed; SDK handles retries, auth, error serialization |
| Billing date formatting | Custom date math | `new Date(unixTs * 1000).toLocaleDateString()` | One liner; no library needed |
| HTML email layout | CSS grid / flexbox | `<table>` structure with inline styles | Email client compatibility — Outlook, Gmail both require table layout |

---

## Common Pitfalls

### Pitfall 1: `current_period_end` on Subscription vs SubscriptionItem

**What goes wrong:** Code accesses `subscription.current_period_end` which is `undefined` in Stripe v22. The email sends with `null` billing date even though the data exists.

**Why it happens:** Older Stripe API versions and many online tutorials show `current_period_end` at the subscription root. Stripe moved it to `SubscriptionItem` in newer API versions. Training data is stale on this.

**How to avoid:** Use `subscription.items.data[0]?.current_period_end`. The optional chain on `data[0]` handles the (unlikely) empty items case.

**Warning signs:** TypeScript error "Property 'current_period_end' does not exist on type 'Subscription'" when accessing `sub.current_period_end` directly.

**Source:** [VERIFIED: node_modules/stripe/cjs/resources/SubscriptionItems.d.ts line 50] — `current_period_end: number` is on `SubscriptionItem`; [VERIFIED: node_modules/stripe/cjs/resources/Subscriptions.d.ts lines 88-280] — `current_period_end` does not appear in the `Subscription` interface.

### Pitfall 2: Discarding `data` from `exchangeCodeForSession`

**What goes wrong:** The existing callback already discards `data` (only destructures `error`). Without fixing this, the welcome email has no user object to check `created_at` against.

**How to avoid:** Change destructuring from `const { error }` to `const { data, error }`. When `error` is null, `data.user` is a fully populated `User` with `email` and `created_at`.

**Source:** [VERIFIED: node_modules/@supabase/auth-js/dist/module/lib/types.d.ts lines 190-193] — `AuthTokenResponse` has `data: { user: User, session: Session }` when `error` is null.

### Pitfall 3: `createAdminSupabaseClient()` Called as Async

**What goes wrong:** `createAdminSupabaseClient()` is synchronous (no `await`). The existing webhook already calls it correctly (`const supabase = createAdminSupabaseClient()`). But if a developer adds `await createAdminSupabaseClient()`, TypeScript will accept it (awaiting a non-Promise returns the value unchanged) but it signals a misunderstanding and creates a subtle pattern inconsistency.

**How to avoid:** No `await` on `createAdminSupabaseClient()`. This is already established in the codebase — the webhook uses it synchronously on line 21.

**Source:** [VERIFIED: lib/supabase/server.ts line 25-30] — function signature is `export function createAdminSupabaseClient()` (not async).

### Pitfall 4: Legal Page Placed Inside Route Group Accidentally

**What goes wrong:** If `app/(auth)/privacy/page.tsx` or `app/(dashboard)/privacy/page.tsx` is used, the page inherits the layout of that route group. The `(dashboard)` group has a Navbar; the `(auth)` group may have its own layout. Legal pages should match the auth page visual style but must not be inside any group that adds navigation chrome.

**How to avoid:** Create `app/privacy/page.tsx` and `app/terms/page.tsx` directly in `app/` — same level as `app/page.tsx`. They inherit only `app/layout.tsx` (which only adds fonts and the Toaster).

**Source:** [VERIFIED: ls app/] — confirmed `app/page.tsx` exists at root; legal pages go alongside it.

### Pitfall 5: Resend `from` Field — Unverified Domain

**What goes wrong:** Resend requires the sender domain to be verified in the Resend dashboard before emails send successfully. Using an unverified domain results in the email being rejected at the API level (error code `invalid_from_address`).

**How to avoid:** The `RESEND_FROM_EMAIL` env var must be an address on a domain verified in Resend. This is an ops prerequisite, not a code issue. The planner should include a Wave 0 or prerequisite note that `RESEND_FROM_EMAIL` must be set to a verified Resend domain address before EMAIL-01/EMAIL-02 can be tested end-to-end.

**Source:** [VERIFIED: node_modules/resend/dist/index.d.mts line 116] — `RESEND_ERROR_CODE_KEY` includes `'invalid_from_address'`.

### Pitfall 6: Stripe Webhook Non-2xx Triggers Retry with Duplicate DB Update

**What goes wrong:** Per D-09, email failure must not cause a non-2xx response. The existing webhook already has a pattern where DB failure returns 500. If the email `try/catch` is placed inside the error-returning block, a Resend failure could accidentally trigger a 500 return.

**How to avoid:** Email send is always `.catch(() => {})` fire-and-forget, placed AFTER all error-returning paths, BEFORE the final `return Response.json({ received: true })`. The email call can never throw to the outer scope because `.catch()` absorbs it.

---

## Code Examples

### lib/email.ts — Full Module Structure

```typescript
// Source: verified from node_modules/resend/dist/index.d.mts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL!

function welcomeHtml(): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
          <span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span>
          <span style="color:#f5a623;font-weight:800;font-size:1.5rem;">.</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="color:#fafafa;font-size:1.25rem;margin:0 0 16px;">Your free account is ready.</h1>
          <p style="color:#a0a0a0;line-height:1.6;margin:0 0 16px;">
            You have <strong style="color:#fafafa;">3 AI responses</strong> and
            <strong style="color:#fafafa;">1 contract analysis</strong> to use — no credit card needed.
          </p>
          <p style="color:#a0a0a0;line-height:1.6;margin:0 0 24px;">
            Use them on any difficult client situation: scope creep, late payments, cancellations, and more.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#f5a623;color:#0a0a0a;font-weight:700;
                    padding:12px 24px;border-radius:6px;text-decoration:none;font-size:0.95rem;">
            Go to Dashboard
          </a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
          <p style="color:#555;font-size:0.8rem;margin:0;">
            Pushback &mdash; adelina.lipsa@gmail.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

interface BillingDetails {
  amount: string | null
  nextBillingDate: string | null
}

function upgradeHtml(billing: BillingDetails): string {
  const billingLine = billing.amount && billing.nextBillingDate
    ? `<p style="color:#a0a0a0;line-height:1.6;margin:0 0 16px;">
         Amount charged: <strong style="color:#fafafa;">${billing.amount}</strong><br>
         Next billing date: <strong style="color:#fafafa;">${billing.nextBillingDate}</strong>
       </p>`
    : `<p style="color:#a0a0a0;line-height:1.6;margin:0 0 16px;">
         Billing details are available in your Stripe dashboard.
       </p>`

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
          <span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span>
          <span style="color:#f5a623;font-weight:800;font-size:1.5rem;">.</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="color:#fafafa;font-size:1.25rem;margin:0 0 16px;">You're on Pushback Pro.</h1>
          <p style="color:#a0a0a0;line-height:1.6;margin:0 0 16px;">
            Unlimited AI responses and contract analyses are now active on your account.
          </p>
          ${billingLine}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#f5a623;color:#0a0a0a;font-weight:700;
                    padding:12px 24px;border-radius:6px;text-decoration:none;font-size:0.95rem;">
            Back to Dashboard
          </a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
          <p style="color:#555;font-size:0.8rem;margin:0;">
            Pushback &mdash; adelina.lipsa@gmail.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

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

export async function sendUpgradeEmail(to: string, billing: BillingDetails): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You're on Pushback Pro",
    html: upgradeHtml(billing),
  })
  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
```

Note: Functions throw on Resend error so the `.catch()` fire-and-forget pattern at the call site works correctly. The throw is caught by `.catch((err) => { console.error(...) })` and never propagates.

### Stripe Subscription Retrieve for Billing Date

```typescript
// Source: node_modules/stripe/cjs/resources/SubscriptionItems.d.ts line 50
// current_period_end: number (Unix timestamp, seconds since epoch)
const sub = await stripe.subscriptions.retrieve(session.subscription as string)
const periodEnd = sub.items.data[0]?.current_period_end  // number | undefined
const nextBillingDate = periodEnd
  ? new Date(periodEnd * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  : null
```

---

## Runtime State Inventory

Step 2.5 trigger check: Phase 3 is not a rename, refactor, or migration phase. No runtime state inventory required.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `resend` npm package | EMAIL-01, EMAIL-02 | Yes | 6.12.2 | — |
| `stripe` npm package | EMAIL-02 (billing date) | Yes | 22.1.0 | — |
| `RESEND_API_KEY` env var | EMAIL-01, EMAIL-02 | Unknown (runtime) | — | — |
| `RESEND_FROM_EMAIL` env var | EMAIL-01, EMAIL-02 | Unknown (runtime) | — | — |
| Resend domain verification | EMAIL-01, EMAIL-02 | Unknown (ops step) | — | — |
| `STRIPE_WEBHOOK_SECRET` env var | EMAIL-02 trigger | In `.env.local` (from Phase 2) | — | — |

**Missing dependencies with no fallback:**
- `RESEND_API_KEY` — must be set in `.env.local` before email tests work. Get from resend.com dashboard.
- `RESEND_FROM_EMAIL` — must be an address on a domain verified in Resend dashboard.
- Resend domain verification — ops prerequisite; without it, `resend.emails.send()` returns `{ error: { name: 'invalid_from_address' } }`.

**Note:** These are ops prerequisites, not code blockers. The code can be written and reviewed before they're set. End-to-end email testing requires them.

---

## Validation Architecture

The `.planning/config.json` file was not found. Treating `nyquist_validation` as enabled (absent = enabled).

This phase has no automated test surface that can be wired in < 30 seconds:
- Legal pages: visual verification only (render the page, confirm content)
- Welcome email: requires Supabase auth flow + Resend credentials + a real email address
- Upgrade email: requires Stripe CLI webhook forwarding + Resend credentials

**Manual verification plan (per requirement):**

| Req ID | Verification | Command / Action |
|--------|-------------|-----------------|
| LEGAL-01 | Navigate to `/privacy` — page renders, dark background, correct entity name | `npm run dev` → open browser |
| LEGAL-02 | Navigate to `/terms` — page renders, AI disclaimer present, cancellation terms present | `npm run dev` → open browser |
| LEGAL-03 | Navigate to `/` → Login → Signup — links visible, click opens `/terms` and `/privacy` | Manual browser test |
| EMAIL-01 | Sign up new account via Supabase (email/password) — check inbox within 60s | Requires `RESEND_API_KEY` + verified domain |
| EMAIL-02 | Fire test webhook event via Stripe CLI | `stripe trigger checkout.session.completed` with Stripe CLI |

**Wave 0 gaps:** None — no test framework setup required. This phase is verified manually.

---

## Security Domain

The phase adds no new authentication, session management, or user input processing. Security implications are minimal but worth noting:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth changes |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | Legal pages are intentionally public |
| V5 Input Validation | No | No user input in this phase |
| V6 Cryptography | No | No new crypto |
| V7 Error Handling | Yes (partial) | Fire-and-forget email errors must not leak Resend error details to clients |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Email enumeration via timing | Information Disclosure | Fire-and-forget on welcome email means auth callback timing is not affected by Resend latency |
| Stripe webhook replay with email spam | Tampering | Existing HMAC verification (`stripe.webhooks.constructEvent`) blocks replay; idempotency of DB update (plan = 'pro' again is harmless) means duplicate email on replay is the only risk — acceptable for v1 |
| Legal page content injection | Tampering | Content is static hardcoded strings — no user input rendered |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `RESEND_FROM_EMAIL` is already added to `.env.local.example` | User Constraints (D-11) | Low — code uses `process.env.RESEND_FROM_EMAIL!`; if missing, runtime error at first email send |
| A2 | `NEXT_PUBLIC_APP_URL` is set in `.env.local` | Code Examples (dashboard link in email) | Medium — email CTA link points to wrong URL if not set |
| A3 | The amber accent is `#f5a623` (not `#f59e0b` which is what globals.css defines as `--brand-amber`) | Standard Stack / User Constraints | Low — D-10 specifies `#f5a623` but globals.css shows `#f59e0b`; planner should confirm which value to use in email HTML |

**Note on A3:** The globals.css defines `--brand-amber: #f59e0b` (Tailwind amber-500) but CONTEXT.md D-10 specifies `#f5a623`. These are different values. Email HTML uses inline hex (not CSS variables, since email clients don't support custom properties). The planner should use `#f59e0b` to match the actual design system, unless D-10's `#f5a623` is intentional for email-specific branding.

---

## Open Questions

1. **Amber hex in email HTML**
   - What we know: `globals.css` defines `--brand-amber: #f59e0b`; CONTEXT.md D-10 specifies `#f5a623`
   - What's unclear: Which value is correct for email templates? They produce visibly different oranges.
   - Recommendation: Use `#f59e0b` (matches the actual design system token) unless explicitly overridden.

2. **Resend domain verification status**
   - What we know: `RESEND_FROM_EMAIL` env var is required; domain must be verified in Resend dashboard
   - What's unclear: Whether the domain is already verified at time of implementation
   - Recommendation: Planner should include a Wave 0 checklist item: "Verify sender domain in Resend dashboard before testing email flows."

---

## Sources

### Primary (HIGH confidence — verified from local files)

- `node_modules/resend/dist/index.d.mts` — Resend v6 TypeScript types; `Resend` class, `CreateEmailOptions`, `CreateEmailResponse`, `ErrorResponse`, `RESEND_ERROR_CODE_KEY`
- `node_modules/stripe/cjs/resources/Checkout/Sessions.d.ts` — `Session.amount_total: number | null`, `Session.currency: string | null`, `Session.subscription: string | Subscription | null`
- `node_modules/stripe/cjs/resources/SubscriptionItems.d.ts` — `SubscriptionItem.current_period_end: number` (NOT on Subscription root)
- `node_modules/stripe/cjs/resources/Subscriptions.d.ts` — confirmed `current_period_end` does NOT appear in `Subscription` interface (lines 88-280 reviewed)
- `node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts` line 753 — `exchangeCodeForSession` returns `Promise<AuthTokenResponse>`
- `node_modules/@supabase/auth-js/dist/module/lib/types.d.ts` lines 162-193 — `AuthTokenResponse` structure; `User.created_at: string`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — static page creation pattern
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — route handler conventions
- `app/auth/callback/route.ts` — current auth callback (17 lines); confirmed `data` is discarded
- `app/api/webhooks/stripe/route.ts` — current Stripe webhook (57 lines); confirmed injection point after line 35
- `app/(auth)/signup/page.tsx` — confirmed legal text at line 148; `Link` already imported at line 4
- `lib/supabase/server.ts` — `createAdminSupabaseClient()` confirmed synchronous
- `lib/stripe.ts` — `stripe` singleton export confirmed; `stripe.subscriptions.retrieve()` available
- `supabase/migrations/001_initial.sql` — `user_profiles.email` column confirmed; `stripe_customer_id`, `stripe_subscription_id` confirmed (no migration 003 needed — columns already named correctly)
- `app/globals.css` — CSS variables confirmed: `--bg-base: #0a0a0a`, `--bg-surface: #111111`, `--bg-border: #2a2a2a`, `--text-primary: #fafafa`, `--brand-amber: #f59e0b`

### Secondary (MEDIUM confidence)

- `node_modules/resend/readme.md` — basic send pattern (`resend.emails.send({ from, to, subject, html })`)

---

## Metadata

**Confidence breakdown:**
- Resend SDK v6 API: HIGH — read from installed package `.d.mts` types file directly
- Stripe field paths: HIGH — read from installed package `.d.ts` types files directly
- `current_period_end` location: HIGH — confirmed present on `SubscriptionItem`, confirmed absent on `Subscription` root in Stripe v22
- Auth callback pattern: HIGH — confirmed from installed `@supabase/auth-js` types
- Next.js 16 static page: HIGH — confirmed from installed Next.js docs
- Email HTML compatibility rules: MEDIUM — CSS/table email best practices from training knowledge [ASSUMED]
- Legal page content (Privacy/Terms text): ASSUMED — Claude writes from D-01 parameters; no legal review

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable libraries; Resend/Stripe APIs rarely break)
