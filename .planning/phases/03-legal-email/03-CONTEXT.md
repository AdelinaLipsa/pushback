# Phase 3: Legal & Email - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Two parallel tracks to make Pushback legally compliant and communicative enough for Creem to activate live payments:

1. **Legal pages** — Create /privacy (Privacy Policy) and /terms (Terms of Service) pages. Update the signup page to link to both.
2. **Transactional emails** — Wire up the installed-but-unused `resend` package to send a welcome email on new signup and an upgrade confirmation email when a Creem subscription activates.

No new features. No new data models. No changes to the AI tools or plan gating.

</domain>

<decisions>
## Implementation Decisions

### Legal Pages (LEGAL-01, LEGAL-02, LEGAL-03)

- **D-01:** Content quality: full production-quality policies using smart defaults. Entity name: **Pushback**. Contact email: **adelina.lipsa@gmail.com**. No specific jurisdiction stated. Standard 30-day cancellation policy. AI-generated prose covering all required clauses — Anthropic named as data processor for contract PDFs (LEGAL-01), AI output disclaimer stating responses are not legal advice (LEGAL-02), subscription and cancellation terms (LEGAL-02).
- **D-02:** Page styling: match the login/signup pages — same dark background (`var(--bg-base)`), centered card/container layout, CSS custom property-based typography. Not a plain light prose page.
- **D-03:** Signup page link update: the existing "By signing up you agree to our Terms and Privacy Policy." text at the bottom of the form card gets converted to a proper sentence with `<Link>` components to `/terms` and `/privacy` (Next.js Link, not plain `<a>`).

### Welcome Email (EMAIL-01)

- **D-04:** Trigger point: **auth callback** (`app/auth/callback/route.ts`), after successful `exchangeCodeForSession`. Detect new signup by comparing `user.created_at` to current time — if ≤ 60 seconds ago, it's a new signup. This single trigger covers both Google OAuth and email/password confirmation flows. Returning logins do NOT receive the welcome email.
- **D-05:** Content: state free-tier limits (3 AI responses, 1 contract analysis) and include a direct link to the dashboard. Tone: warm but functional — this is a product email, not marketing.
- **D-06:** Email triggers no database write. Fire-and-forget — if Resend fails, the user still lands on the dashboard. Do not block the redirect on email send success.

### Upgrade Confirmation Email (EMAIL-02)

- **D-07:** Trigger point: inside the Creem webhook handler (`app/api/webhooks/creem/route.ts`), after the successful `user_profiles` update on `subscription.active` / `subscription.updated`. Use `createAdminSupabaseClient()` to fetch the user's email from `user_profiles` (userId is already extracted from `object.metadata.user_id`).
- **D-08:** Content: include billing details — amount and next billing date — from the Creem webhook payload. Planner MUST verify available fields on the `object` payload for `subscription.active` events against Creem's webhook documentation before hardcoding field paths. If a field is absent in the payload, fall back to "billing details available in your Creem dashboard" rather than throwing.
- **D-09:** Fire-and-forget — same pattern as D-06. Email failure must not cause the webhook to return a non-2xx (that would trigger Creem retries and cause duplicate DB updates).

### Email Design (applies to both EMAIL-01 and EMAIL-02)

- **D-10:** Format: **branded inline HTML** — dark background (`#0a0a0a`), amber accent (`#f5a623`), Pushback wordmark in header. Written as inline HTML template literal strings directly in the sending function. No React Email dependency, no additional packages beyond `resend` (already installed).
- **D-11:** Structure HTML in a shared `lib/email.ts` helper that exports typed `sendWelcomeEmail(to: string)` and `sendUpgradeEmail(to: string, billingDetails: {...})` functions. Route handlers call these helpers — no Resend SDK calls directly in route files.

### Claude's Discretion

- Exact HTML/CSS structure of the email templates (inline styles, table vs div layout, etc.) — Claude decides based on email client compatibility best practices.
- Exact wording of Privacy Policy and Terms of Service body text — Claude writes complete prose from the locked parameters in D-01.
- Whether to add a `RESEND_FROM_EMAIL` env var or hardcode the sender address — Claude decides (env var preferred for configurability).
- Precise Creem payload field paths for billing amount and next billing date — planner must check Creem docs and verify before writing the email template.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to Modify
- `app/(auth)/signup/page.tsx` — Add Link components to /terms and /privacy (LEGAL-03)
- `app/auth/callback/route.ts` — Add new-signup detection + welcome email trigger (EMAIL-01)
- `app/api/webhooks/creem/route.ts` — Add upgrade email trigger after successful plan update (EMAIL-02)

### Files to Create
- `app/privacy/page.tsx` — Full Privacy Policy page (LEGAL-01)
- `app/terms/page.tsx` — Terms of Service page (LEGAL-02)
- `lib/email.ts` — Resend helper with `sendWelcomeEmail` and `sendUpgradeEmail` exports (D-11)

### Reference Files
- `.planning/codebase/STACK.md` — Next.js 16.2.4 specifics, async params handling, Resend version
- `.planning/codebase/CONVENTIONS.md` — Error response format, import patterns, CSS variable naming
- `.planning/phases/02-infrastructure-security/02-CONTEXT.md` — Established patterns: `createAdminSupabaseClient()`, fire-and-forget error pattern, `Response.json()` format
- `app/(auth)/signup/page.tsx` — Existing signup page layout to match for /privacy and /terms styling
- `app/api/webhooks/creem/route.ts` — Current webhook structure; email must be added after the existing DB update block
- `supabase/migrations/001_initial.sql` — `user_profiles` table schema (has `email` column)
- `node_modules/next/dist/docs/` — Next.js 16 specifics before any route/layout changes

### External Docs to Check
- Creem webhook payload documentation — verify field names for billing amount and next billing date on `subscription.active` events (required for D-08)
- Resend SDK v6 docs — `resend@^6.12.2` may have API differences from v2/v3 training data; check before writing send calls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createAdminSupabaseClient()` in `lib/supabase/server.ts` — synchronous, no cookies; use in webhook to fetch user email by userId
- `resend@^6.12.2` — installed in package.json, zero existing usage; just needs `new Resend(process.env.RESEND_API_KEY)` to initialize
- `app/(auth)/signup/page.tsx` — existing dark-themed auth page; /privacy and /terms should match its layout pattern (`--bg-base` background, centered container, `var(--bg-surface)` card)

### Established Patterns
- Fire-and-forget error handling: webhook and route handlers do not throw on non-critical failures — log with `console.error`, continue execution
- `Response.json({ error: '...' }, { status: N })` — consistent error response format across all route handlers
- CSS custom properties (`--bg-base`, `--bg-surface`, `--bg-border`, `--text-primary`, `--text-secondary`, `--brand-amber`) — all styling uses these, not raw hex values in app pages
- `import Link from 'next/link'` — already used in signup page; same import for the /terms and /privacy links

### Integration Points
- Auth callback (`app/auth/callback/route.ts`): currently redirects to `/dashboard` after code exchange — welcome email fires before the redirect
- Creem webhook: currently ends with `return Response.json({ received: true })` after all event handling — email call goes inside the `subscription.active` block before that return
- `user_profiles.email` column exists and is populated by `on_auth_user_created` trigger — reliable source for user email in webhook context

</code_context>

<specifics>
## Specific Ideas

- Signup page legal text: current text is `"By signing up you agree to our Terms and Privacy Policy."` — convert to `"By signing up you agree to our{' '}<Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>."`
- Welcome email subject: "Welcome to Pushback — your free account is ready"
- Upgrade email subject: "You're on Pushback Pro"
- Email sender address: use `RESEND_FROM_EMAIL` env var (e.g. `hello@pushback.app` or similar) — not hardcoded
- New-user detection in callback: `const isNewUser = Date.now() - new Date(user.created_at).getTime() < 60_000`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-legal-email*
*Context gathered: 2026-04-24*
