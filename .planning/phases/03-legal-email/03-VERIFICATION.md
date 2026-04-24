---
phase: 03-legal-email
verified: 2026-04-24T09:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Navigate to /privacy in a browser"
    expected: "Full Privacy Policy page renders with dark theme, readable prose, working back-to-home link, and Anthropic-as-processor section visible"
    why_human: "Server Component rendering and CSS custom property resolution cannot be verified from static file checks alone"
  - test: "Navigate to /terms in a browser"
    expected: "Full Terms of Service page renders with AI output disclaimer section visible, cancellation terms visible, Stripe billing section visible"
    why_human: "Same as above — visual rendering requires browser"
  - test: "On /signup, click the 'Terms' link in the legal footer"
    expected: "Navigates to /terms without a 404; link is styled amber"
    why_human: "Client-side navigation and visual styling require browser testing"
  - test: "On /signup, click the 'Privacy Policy' link in the legal footer"
    expected: "Navigates to /privacy without a 404; link is styled amber"
    why_human: "Client-side navigation and visual styling require browser testing"
  - test: "Sign up a new account via email/password and complete the email confirmation"
    expected: "Within 60 seconds of callback: a 'Welcome to Pushback — your free account is ready' email arrives at the signup address, states 3 free AI-powered responses and 1 contract analysis, and includes a Go to Dashboard link"
    why_human: "Requires live RESEND_API_KEY, verified Resend domain, and a real inbox to confirm delivery"
  - test: "Complete a Stripe checkout for Pro (use Stripe test mode card 4242 4242 4242 4242)"
    expected: "A 'You're on Pushback Pro' email arrives at the user's address with billing amount and next billing date (or Stripe dashboard fallback if subscription data is unavailable)"
    why_human: "Requires live STRIPE_SECRET_KEY in test mode, RESEND_API_KEY, and Stripe webhook forwarding (stripe listen) to confirm email delivery and correct billing details"
---

# Phase 3: Legal & Email Verification Report

**Phase Goal:** The app is legally compliant enough to activate live Stripe payments, and users receive email confirmation of key account events
**Verified:** 2026-04-24T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | /privacy returns a full Privacy Policy page — not a 404 — that names Anthropic as data processor for uploaded contract PDFs | VERIFIED | `app/privacy/page.tsx` exists as a Server Component at the top-level `app/privacy/` route (not inside a route group). Contains "Anthropic, PBC as a data processor" and "data processor" in the How We Use AI section (lines 59-61). No `'use client'`. |
| 2 | /terms returns a Terms of Service page with an AI output disclaimer and subscription cancellation terms | VERIFIED | `app/terms/page.tsx` exists as a Server Component. Contains exact text "Outputs are not legal advice" (line 42) and full Cancellation section with 30-day refund clause (lines 62-64). |
| 3 | The signup page links to /privacy and /terms with working hyperlinks | VERIFIED | `app/(auth)/signup/page.tsx` lines 156-159: `<Link href="/terms">Terms</Link>` and `<Link href="/privacy">Privacy Policy</Link>` using Next.js Link component with brand-amber styling. Old plain-text string is gone. |
| 4 | New signups receive a welcome email that states free-tier limits and links to the dashboard | VERIFIED | `lib/email.ts` exports `sendWelcomeEmail` with HTML template containing "3 free AI-powered responses", "1 contract analysis", "no credit card needed", and a "Go to Dashboard" CTA linking to `${APP_URL}/dashboard`. Wired in `app/auth/callback/route.ts` with fire-and-forget `.catch()` after 60-second new-user detection. |
| 5 | After a Stripe subscription activates, the user receives an upgrade confirmation email with billing confirmation and a dashboard link | VERIFIED | `app/api/webhooks/stripe/route.ts` imports `sendUpgradeEmail` and fires it after the successful DB update in `checkout.session.completed`. Billing amount extracted from `session.amount_total` + `session.currency`; next billing date from `sub.items.data[0]?.current_period_end` (correct Stripe v22 path). Null-safe fallback renders "Billing details are available in your Stripe dashboard." Email never causes non-2xx webhook response. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/privacy/page.tsx` | Privacy Policy Server Component with Anthropic clause | VERIFIED | 131 lines, full prose, 10 sections, dark theme CSS vars, no `'use client'` |
| `app/terms/page.tsx` | Terms of Service Server Component with AI disclaimer and cancellation | VERIFIED | 111 lines, full prose, 10 sections, contains "not legal advice" and 30-day cancellation |
| `app/(auth)/signup/page.tsx` | Signup page with legal footer links | VERIFIED | Lines 155-159 replace plain text with two `<Link>` components to `/terms` and `/privacy` |
| `lib/email.ts` | Resend helper with `sendWelcomeEmail` and `sendUpgradeEmail` | VERIFIED | Module-scope Resend singleton, `BillingDetails` interface, both typed async exports, correct amber hex `#f59e0b`, no deprecated `resend.sendEmail` |
| `app/auth/callback/route.ts` | Auth callback with welcome email trigger | VERIFIED | Imports `sendWelcomeEmail`, destructures `{ data, error }` from `exchangeCodeForSession`, 60-second `isNewUser` detection, fire-and-forget `.catch()`, no `await` on email call |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook with upgrade email trigger | VERIFIED | Imports `sendUpgradeEmail`, injects email block after successful DB update, correct `sub.items.data[0]?.current_period_end` path, try/catch around subscription retrieve, fire-and-forget `.catch()` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(auth)/signup/page.tsx` | `/terms` | `<Link href="/terms">` | WIRED | Line 157: `<Link href="/terms" style={{ color: 'var(--brand-amber)'...}}>Terms</Link>` |
| `app/(auth)/signup/page.tsx` | `/privacy` | `<Link href="/privacy">` | WIRED | Line 159: `<Link href="/privacy" style={{ color: 'var(--brand-amber)'...}}>Privacy Policy</Link>` |
| `app/auth/callback/route.ts` | `lib/email.ts` | `import { sendWelcomeEmail }` | WIRED | Line 2: `import { sendWelcomeEmail } from '@/lib/email'` |
| `app/auth/callback/route.ts` | `sendWelcomeEmail(data.user.email)` | fire-and-forget `.catch()` | WIRED | Line 27: `sendWelcomeEmail(data.user.email).catch((err) => { console.error(...) })` |
| `app/api/webhooks/stripe/route.ts` | `lib/email.ts` | `import { sendUpgradeEmail }` | WIRED | Line 4: `import { sendUpgradeEmail } from '@/lib/email'` |
| `app/api/webhooks/stripe/route.ts` | `sub.items.data[0]?.current_period_end` | Stripe v22 SubscriptionItem path | WIRED | Line 67: correct optional-chain path; not the v22-removed `sub.current_period_end` |
| `lib/email.ts` | Resend API | `resend.emails.send()` | WIRED | Two calls: lines 96 and 108, using `resend.emails.send()` (not deprecated `sendEmail`) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `lib/email.ts` `welcomeHtml()` | Free-tier copy | Hardcoded template | N/A — static template | VERIFIED (static content, correct) |
| `lib/email.ts` `upgradeHtml()` | `billing.amount`, `billing.nextBillingDate` | Stripe session `amount_total`, `currency`, `subscription.items.data[0].current_period_end` | Yes — extracted from Stripe event payload at webhook | VERIFIED |
| `app/auth/callback/route.ts` | `data.user.email` | Supabase `exchangeCodeForSession` response | Yes — server-authoritative session | VERIFIED |
| `app/api/webhooks/stripe/route.ts` | `profileData.email` | Supabase `user_profiles` query `.eq('id', userId).single()` | Yes — DB query | VERIFIED |

### Behavioral Spot-Checks

Step 7b: SKIPPED for email delivery and browser rendering (requires live external services). Static code checks applied instead — all patterns verified above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LEGAL-01 | 03-01 | `/privacy` page exists naming Anthropic as data processor | SATISFIED | `app/privacy/page.tsx` line 60: exact Anthropic-as-processor clause present |
| LEGAL-02 | 03-01 | `/terms` page with AI output disclaimer and cancellation policy | SATISFIED | `app/terms/page.tsx` line 42: "not legal advice"; lines 62-64: cancellation with 30-day refund |
| LEGAL-03 | 03-01 | Signup page links to `/privacy` and `/terms` | SATISFIED | `app/(auth)/signup/page.tsx` lines 157, 159: Next.js Link components to both routes |
| EMAIL-01 | 03-02, 03-03 | Welcome email after signup with free-tier limits and dashboard link | SATISFIED (code) | `lib/email.ts`: template with free-tier copy; `app/auth/callback/route.ts`: wired with 60s new-user detection. Actual delivery requires human test. |
| EMAIL-02 | 03-02, 03-04 | Upgrade confirmation email after Stripe subscription activates | SATISFIED (code) | `lib/email.ts`: upgrade template with billing block; `app/api/webhooks/stripe/route.ts`: wired to `checkout.session.completed`. Actual delivery requires human test. Note: REQUIREMENTS.md says "Creem subscription" but Stripe webhook is the correct implementation as of 2026-04-24. |

All 5 requirement IDs (LEGAL-01, LEGAL-02, LEGAL-03, EMAIL-01, EMAIL-02) are accounted for. No orphaned requirements found for Phase 3.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/email.ts` | 5-12 | `requireEnv()` helper instead of plan-specified `process.env.X!` non-null assertion | Info | Stricter and safer than the plan specified — throws at module load with a clear message rather than a TypeScript compile-only hint. Not a defect. |
| `app/auth/callback/route.ts` | 9-11 | `if (!code) { return redirect }` early return instead of plan's `if (code) { ... }` wrapping | Info | Structurally equivalent but flatter control flow. The `error=auth_failed` redirect (RELY-03) is preserved on line 16. Not a defect. |

No blockers. No stubs. No TODO/FIXME comments. No placeholder returns.

### Human Verification Required

#### 1. Privacy Policy renders in browser

**Test:** Navigate to `/privacy` in a browser while the dev server is running
**Expected:** Page renders with dark background, Pushback wordmark, "Privacy Policy" h1, all prose sections visible including "How We Use AI (Anthropic as Processor)", and an amber-styled back-to-home link
**Why human:** CSS custom property resolution (`var(--bg-base)`, `var(--brand-amber)`) and Server Component rendering require a running Next.js instance

#### 2. Terms of Service renders in browser

**Test:** Navigate to `/terms` in a browser
**Expected:** Page renders with "AI Output Disclaimer" section containing "not legal advice", "Cancellation" section with 30-day refund policy, "Subscriptions and Billing" section mentioning Stripe
**Why human:** Same as above

#### 3. Signup legal links are clickable and navigate correctly

**Test:** Go to `/signup`, click "Terms" link in the footer text, then go back and click "Privacy Policy"
**Expected:** Each link navigates to the respective page without a 404; links are visually amber-colored and match surrounding text baseline
**Why human:** Client-side navigation flow and visual styling require browser interaction

#### 4. Welcome email delivers to inbox

**Test:** Sign up a new account via email/password at `/signup`, confirm via Supabase email link, wait up to 60 seconds
**Expected:** Email with subject "Welcome to Pushback — your free account is ready" arrives at the signup address, body shows "3 free AI-powered responses" and "1 contract analysis" in bold, includes a "Go to Dashboard" button linking to the dashboard
**Why human:** Requires `RESEND_API_KEY` configured, `RESEND_FROM_EMAIL` on a verified Resend domain, and access to the recipient inbox

#### 5. Upgrade email delivers with correct billing details

**Test:** With Stripe CLI running (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`), trigger a checkout completion for a real user. Use Stripe test card 4242 4242 4242 4242.
**Expected:** Email with subject "You're on Pushback Pro" arrives, shows billing amount (e.g. "9.00 USD") and next billing date formatted as "Month DD, YYYY"; if subscription retrieve fails, email still arrives with "Billing details are available in your Stripe dashboard" fallback
**Why human:** Requires Stripe test mode credentials, webhook forwarding, RESEND_API_KEY, and inbox access

### Gaps Summary

No gaps found. All 5 success criteria are satisfied at the code level. The `human_needed` status reflects that email delivery (SC4, SC5) and browser rendering (SC1, SC2, SC3) cannot be verified from static code analysis alone — they require live environment testing with real credentials.

The two implementation deviations noted (requireEnv vs `!` assertion; if(!code) early return vs if(code) wrap) are improvements over the plan specification and carry no negative impact.

---

_Verified: 2026-04-24T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
