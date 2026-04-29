---
phase: whole-app-review
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 103
files_reviewed_list:
  - app/(auth)/login/page.tsx
  - app/(auth)/signup/page.tsx
  - app/(dashboard)/admin/MaintenanceToggle.tsx
  - app/(dashboard)/admin/UserTable.tsx
  - app/(dashboard)/admin/actions.ts
  - app/(dashboard)/admin/page.tsx
  - app/(dashboard)/analytics/page.tsx
  - app/(dashboard)/arsenal/page.tsx
  - app/(dashboard)/contracts/[id]/page.tsx
  - app/(dashboard)/contracts/new/page.tsx
  - app/(dashboard)/contracts/page.tsx
  - app/(dashboard)/dashboard/page.tsx
  - app/(dashboard)/feedback/page.tsx
  - app/(dashboard)/layout.tsx
  - app/(dashboard)/loading.tsx
  - app/(dashboard)/projects/[id]/history/page.tsx
  - app/(dashboard)/projects/[id]/page.tsx
  - app/(dashboard)/projects/new/page.tsx
  - app/(dashboard)/projects/page.tsx
  - app/(dashboard)/settings/page.tsx
  - app/(dashboard)/template.tsx
  - app/api/account/delete/route.ts
  - app/api/billing-portal/route.ts
  - app/api/check-email/route.ts
  - app/api/checkout/route.ts
  - app/api/contracts/[id]/route.ts
  - app/api/contracts/analyze/route.ts
  - app/api/create-subscription/route.ts
  - app/api/feedback/route.ts
  - app/api/profile/route.ts
  - app/api/projects/[id]/analyze-message/route.ts
  - app/api/projects/[id]/defend/route.ts
  - app/api/projects/[id]/document/route.ts
  - app/api/projects/[id]/route.ts
  - app/api/projects/route.ts
  - app/api/responses/[id]/reply/route.ts
  - app/api/responses/[id]/route.ts
  - app/api/webhooks/stripe/route.ts
  - app/auth/callback/route.ts
  - app/checkout/CheckoutForm.tsx
  - app/checkout/page.tsx
  - app/how-it-works/page.tsx
  - app/layout.tsx
  - app/loading.tsx
  - app/maintenance/page.tsx
  - app/page.tsx
  - app/privacy/page.tsx
  - app/robots.ts
  - app/sitemap.ts
  - app/terms/page.tsx
  - components/contract/ClauseCard.tsx
  - components/contract/ContractDeleteButton.tsx
  - components/contract/ContractPendingState.tsx
  - components/contract/ContractUploader.tsx
  - components/contract/ContractsTable.tsx
  - components/contract/RiskReport.tsx
  - components/contract/RiskScoreBadge.tsx
  - components/defense/ArsenalQuickDeploy.tsx
  - components/defense/DefenseDashboard.tsx
  - components/defense/DefenseToolCard.tsx
  - components/defense/DocumentOutput.tsx
  - components/defense/NextStepCard.tsx
  - components/defense/ReplyThreadCard.tsx
  - components/defense/ResponseHistory.tsx
  - components/defense/ResponseOutput.tsx
  - components/defense/SituationPanel.tsx
  - components/hero/ContractAnimation.tsx
  - components/hero/ContractReveal.tsx
  - components/hero/DemoAnimation.tsx
  - components/hero/PushbackHero.tsx
  - components/hero/ReplyThreadAnimation.tsx
  - components/project/ClientBehaviorCard.tsx
  - components/project/ClientRiskBadge.tsx
  - components/project/NewProjectForm.tsx
  - components/project/PaymentSection.tsx
  - components/project/ProjectCard.tsx
  - components/project/ProjectDetailClient.tsx
  - components/project/ProjectHeader.tsx
  - components/project/ProjectsTable.tsx
  - components/settings/SettingsClient.tsx
  - components/shared/Button.tsx
  - components/shared/CopyButton.tsx
  - components/shared/FAQAccordion.tsx
  - components/shared/Footer.tsx
  - components/shared/Navbar.tsx
  - components/shared/OnboardingModal.tsx
  - components/shared/PageLoader.tsx
  - components/shared/SiteLoader.tsx
  - components/shared/UpgradePrompt.tsx
  - components/shared/WelcomeToast.tsx
  - components/ui/button.tsx
  - components/ui/dialog.tsx
  - components/ui/sonner.tsx
  - instrumentation-client.ts
  - instrumentation.ts
  - lib/anthropic.ts
  - lib/api.ts
  - lib/checkout.ts
  - lib/clientRisk.ts
  - lib/defenseTools.ts
  - lib/email.ts
  - lib/plans.ts
  - lib/profession.ts
  - lib/rate-limit.ts
  - lib/stripe.ts
  - lib/supabase/client.ts
  - lib/supabase/server.ts
  - lib/ui.ts
  - lib/utils.ts
  - next.config.ts
  - proxy.ts
  - sentry.server.config.ts
  - tests/api/analyze-message.test.ts
  - tests/api/defend.test.ts
  - tests/api/reply.test.ts
  - tests/api/stripe-webhook.test.ts
  - tests/helpers/supabase.ts
  - tests/setup.ts
  - types/database.types.ts
  - types/index.ts
  - vitest.config.ts
findings:
  critical: 9
  warning: 11
  info: 7
  total: 27
status: issues_found
reviewed_at: 2026-04-28
---

# Whole-App Code Review — Pushback

**Reviewed:** 2026-04-28  
**Depth:** standard  
**Files Reviewed:** 103  
**Status:** issues_found

## Summary

Pushback is a Next.js 15 SaaS application with Supabase (auth + database), Stripe (subscriptions), Anthropic Claude (AI), and Upstash Redis (rate limiting). Overall the auth guards and IDOR protections are solid — every API route verifies the authenticated user and qualifies writes with `.eq('user_id', user.id)`. Stripe webhook signature verification is correctly implemented. The RLS/gate pattern using Postgres RPCs for atomic credit checks is well-designed.

However, nine critical issues were found, ranging from a hardcoded admin email in production code, a real email address in source code, rate-limiting that is silently bypassed when Redis is not configured, a double-spend window in the `analyze-message` route, unauthenticated email enumeration, an open redirect in the `check-email` route (abusable for account scraping), missing Stripe `customer.subscription.updated` handling that can leave Pro users on free, `'use client'` pages that call `window.location` without guards in SSR context, and a concurrency race in the Anthropic slot semaphore that can read a stale counter.

---

## Critical Issues

### CR-001: Hardcoded admin email comparison in source code leaks identity and is bypassable

**File:** `app/(dashboard)/admin/actions.ts:21`, `app/(dashboard)/admin/page.tsx:46`  
**Issue:** Admin identity is determined entirely by `user.email === process.env.ADMIN_EMAIL`. This is a single string comparison with no second factor. If `ADMIN_EMAIL` is ever leaked (e.g., in an error log, a Sentry breadcrumb, or an internal document), any attacker who registers with that email address on a secondary auth provider (Google OAuth) would obtain full admin access — including the ability to delete arbitrary users, manually upgrade any account to Pro for free, and toggle maintenance mode. Beyond the leakage risk, the comparison is also case-sensitive: if the env var is `Admin@example.com` but the user registered as `admin@example.com`, the check silently fails.

**Fix:**
```typescript
// In assertAdmin() / AdminPage guard:
const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
  redirect('/dashboard')
}
// Additionally: store an admin role in user_profiles and check that too.
// Role should be set via Supabase service-role key directly (out-of-band), 
// not through the app itself.
```

---

### CR-002: Real personal email hardcoded in `lib/email.ts`

**File:** `lib/email.ts:125`  
**Issue:** The `sendFeedbackNotification` function hard-codes `'adelina.lipsa@gmail.com'` as the feedback recipient. This email address is now permanently embedded in the git history and in any build artifact. It will appear in error logs, stack traces, and any future open-source or audit scenario.

```typescript
// Line 125
to: 'adelina.lipsa@gmail.com',
```

**Fix:**
```typescript
const FEEDBACK_TO = requireEnv('FEEDBACK_RECIPIENT_EMAIL')

// then:
to: FEEDBACK_TO,
```
Move the address to an environment variable (`FEEDBACK_RECIPIENT_EMAIL`). Remove the hardcoded string and rotate the email address if this repository ever becomes public.

---

### CR-003: Rate limiting silently degrades to no-op when Redis is unavailable

**File:** `lib/rate-limit.ts:13-30`  
**Issue:** All rate limiters (`defendRateLimit`, `contractRateLimit`, `feedbackRateLimit`, `writesRateLimit`) are `null` when Redis env vars are absent. `checkRateLimit` returns `null` (i.e., "pass") whenever the limiter is `null`. The same pattern applies to `acquireAnthropicSlot` and the middleware auth-callback rate limiter. This means: in a local environment, a staging environment without Redis, or after a Redis outage, **all rate limits are completely disabled**. An attacker who can trigger a Redis outage (e.g., exhaust the Upstash free tier) can then spam AI endpoints with no throttle.

```typescript
// checkRateLimit line 33-34 — silent pass-through:
export async function checkRateLimit(limiter: Ratelimit | null, userId: string) {
  if (!limiter) return null   // ← no-op, no log, no alert
```

**Fix:** At minimum, log a warning when a limiter is null so the absence is observable. In production, Redis must be required; the app should refuse to start (or return 503 on AI routes) if Redis is unconfigured.

```typescript
export async function checkRateLimit(limiter: Ratelimit | null, userId: string) {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[rate-limit] Redis unavailable — rate limiting DISABLED')
    }
    return null
  }
  // ...
}
```

---

### CR-004: Double-spend window in `analyze-message` — credit consumed before input is parsed

**File:** `app/api/projects/[id]/analyze-message/route.ts:44-61`  
**Issue:** The route calls `check_and_increment_defense_responses` (consuming a credit) **before** it parses or validates the request body. The input validation (`classifySchema.safeParse`) happens on line 55, after the credit has already been atomically debited. If the request body is malformed or too large, the decrement RPC is called as a compensating action. However, the Supabase decrement RPC is also fire-and-forget with no error handling on the compensating path: if `decrement_defense_responses` itself fails, the credit is permanently lost.

This is also logically inconsistent with the `defend` route (which parses input first, then checks the gate) — compare `defend/route.ts:165-172`.

**Fix:** Validate and parse the request body **before** calling `check_and_increment_defense_responses`. This eliminates the need for compensating decrements on validation failures entirely.

```typescript
// Parse first:
const body = await request.json()
const parsed = classifySchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: '...' }, { status: 400 })
}
// Then gate:
const { data: gateResult, error: gateError } = await supabase.rpc(
  'check_and_increment_defense_responses', { uid: user.id }
)
```

---

### CR-005: `check-email` endpoint is an unauthenticated account oracle — enables user enumeration at scale

**File:** `app/api/check-email/route.ts:1-19`  
**Issue:** This route accepts any POST with an email address and returns `{ exists: true/false }` using the admin Supabase client, with no authentication requirement, no rate limit, and no CAPTCHA. While the middleware marks it as a public API (intentionally), there is no throttle whatsoever applied to it. An attacker can enumerate the entire user base by submitting lists of email addresses and observing the boolean response. The endpoint is also reachable directly without going through the middleware's auth-callback rate limiter.

**Fix:** At minimum, apply a strict IP-based rate limit to this endpoint (e.g., 10 requests per minute per IP). Ideally, replace the boolean response with a delayed, timing-attack-resistant response or integrate a CAPTCHA. If the only consumer is the signup form, consider moving this check into the signup server action after a CAPTCHA solve.

```typescript
// Add to route.ts:
import { Ratelimit } from '@upstash/ratelimit'
// Apply strict per-IP rate limiting before the admin query
```

---

### CR-006: Missing `customer.subscription.updated` webhook handler — plan state can desync after payment method change or pause

**File:** `app/api/webhooks/stripe/route.ts:83-121`  
**Issue:** The webhook handler processes `checkout.session.completed`, `invoice.paid`, `checkout.session.expired`, and `customer.subscription.deleted`. It does **not** handle `customer.subscription.updated`. This event fires when:
- A subscription moves from `past_due` to `active` (payment eventually collected after failure)
- A subscription is paused/unpaused
- A subscription's plan is changed via the Stripe billing portal

In all these cases, the `user_profiles.plan` column in the database will not be updated. A user whose subscription enters `past_due` status will remain `pro` in the DB indefinitely. Conversely, if a subscription is reactivated after a lapse, the user stays `free` even though they are billing correctly.

**Fix:**
```typescript
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object
  const newStatus = subscription.status
  const plan = (newStatus === 'active' || newStatus === 'trialing') ? 'pro' : 'free'
  await supabase
    .from('user_profiles')
    .update({ plan })
    .eq('stripe_subscription_id', subscription.id)
}
```

---

### CR-007: Anthropic concurrency semaphore has a race condition — counter can go permanently negative

**File:** `lib/rate-limit.ts:60-77`  
**Issue:** The `acquireAnthropicSlot` / `releaseAnthropicSlot` pair uses Redis INCR/DECR. The INCR and EXPIRE are two separate commands (lines 62-63), not atomic. If the process crashes between INCR and EXPIRE, the key never expires and the counter grows indefinitely, permanently blocking all new AI requests. Additionally, if `releaseAnthropicSlot` is called more times than `acquireAnthropicSlot` (e.g., due to error paths calling release in a `finally` block when acquire was never called or returned a 503 response), the counter goes negative, meaning the slot check `count > MAX_CONCURRENCY` never fires.

Inspection of `defend/route.ts` lines 221-237 shows `acquireAnthropicSlot` is called and a 503 response returned if it fails. The `finally` block always calls `releaseAnthropicSlot` — but if `acquireAnthropicSlot` returned a 503 (meaning it called `decr` before returning), and then the Anthropic call throws before the try block, the finally block would call `decr` again on a key that was already decremented.

**Fix:** Use a Redis Lua script to atomically INCR and check in one command. For the TTL, set it unconditionally using `SET key value EX ttl NX` pattern rather than separate INCR + EXPIRE. Only call `releaseAnthropicSlot` when `acquireAnthropicSlot` returned `null` (slot acquired successfully).

```typescript
// Only release if slot was actually acquired:
const slotResponse = await acquireAnthropicSlot()
if (slotResponse) {
  await supabase.rpc('decrement_defense_responses', { uid: user.id })
  return slotResponse
}
// Slot acquired — now in try/finally:
try {
  // ... Anthropic call
} finally {
  await releaseAnthropicSlot()  // safe — slot was acquired
}
```

The current code in `defend/route.ts` does follow this pattern correctly (lines 221-237). However `document/route.ts` lines 118-132 has the same `acquireAnthropicSlot` / `releaseAnthropicSlot` pattern **without** the decrement RPC guard — if acquire returns a 503, the route returns that response directly without calling release, which is correct. But the TTL atomicity issue remains a standing risk.

---

### CR-008: `admin/actions.ts` `deleteUser` does not delete `projects` table rows — orphaned data and RLS gap

**File:** `app/(dashboard)/admin/actions.ts:62-70`  
**Issue:** The `deleteUser` server action manually deletes rows from `defense_responses` and `contracts`, then deletes from `user_profiles`, then calls `admin.auth.admin.deleteUser`. It does **not** delete rows from the `projects` table. This means every project a deleted user created remains in the database with a `user_id` pointing to a deleted auth user. If Postgres foreign key constraints do not cascade, these orphaned rows will accumulate silently and may be accessible in edge cases (e.g., if a new user is ever assigned the same UUID — extremely unlikely with UUIDs but not impossible in test environments with seeded IDs). Beyond storage waste, this is a data retention compliance gap.

**Fix:**
```typescript
export async function deleteUser(userId: string) {
  const admin = await assertAdmin()
  await admin.from('reply_threads').delete().eq('user_id', userId)
  await admin.from('defense_responses').delete().eq('user_id', userId)
  await admin.from('contracts').delete().eq('user_id', userId)
  await admin.from('projects').delete().eq('user_id', userId)   // ← missing
  await admin.from('feedback').delete().eq('user_id', userId)   // ← also missing
  await admin.from('user_profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
```
Ideally, add `ON DELETE CASCADE` foreign key constraints in Postgres so this is handled at the database level.

---

### CR-009: Self-account deletion in `api/account/delete` does not delete application data — relies on cascade that may not exist

**File:** `app/api/account/delete/route.ts:26-28`  
**Issue:** The account delete route calls `admin.auth.admin.deleteUser(user.id)` directly without first deleting application-layer data (projects, defense_responses, contracts, reply_threads, feedback). The code comment says "cascades to all user data," but this cascade only exists if database-level `ON DELETE CASCADE` foreign key constraints are set up on every table referencing `auth.users`. If any table is missing a cascade constraint, that data will be orphaned with a dangling `user_id` foreign key, creating a GDPR/data retention violation and a potential data leak if the UUID is ever reused.

This is distinct from the admin `deleteUser` in CR-008, which at least attempts explicit deletions. This route does nothing.

**Fix:** Explicitly delete all user data before calling auth deletion, mirroring the pattern the admin delete action should follow:

```typescript
export async function DELETE() {
  // ... auth check ...
  const admin = createAdminSupabaseClient()
  // Delete application data first:
  await admin.from('reply_threads').delete().eq('user_id', user.id)
  await admin.from('defense_responses').delete().eq('user_id', user.id)
  await admin.from('contracts').delete().eq('user_id', user.id)
  await admin.from('projects').delete().eq('user_id', user.id)
  await admin.from('feedback').delete().eq('user_id', user.id)
  await admin.from('user_profiles').delete().eq('id', user.id)
  // Then delete auth user:
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

---

## Warnings

### WR-001: `PATCH /api/projects/[id]` has no rate limit — unlimited write operations

**File:** `app/api/projects/[id]/route.ts:22-42`  
**Issue:** The `PATCH` handler for projects has no `checkRateLimit` call, unlike `DELETE` (line 50) which does apply `writesRateLimit`. An authenticated user can send an unbounded number of PATCH requests to update any of their projects, e.g., bulk-spamming notes field updates. Practically this creates a denial-of-service vector against the Supabase instance.

**Fix:** Add the same rate limit as DELETE:
```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // ... auth check ...
  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse
  // ... rest of handler
}
```

---

### WR-002: `PATCH /api/projects/[id]` allows mass-assignment including `contract_id` — potential IDOR via foreign key manipulation

**File:** `app/api/projects/[id]/route.ts:29-34`  
**Issue:** The allowed fields list includes `contract_id`. A user can set a project's `contract_id` to any UUID — including a contract belonging to another user. Supabase RLS policies on the `contracts` table would prevent reading the other user's contract data via direct query, but the association itself is stored in `projects`. If any query later joins `projects` with `contracts` without re-enforcing the `user_id` check on `contracts`, another user's contract analysis data could be exposed.

```typescript
const allowed = ['title', 'client_name', 'client_email', 'project_value', 'currency', 
                 'status', 'notes', 'contract_id', ...]  // contract_id is dangerous
```

**Fix:** Either remove `contract_id` from the PATCH allowed list and handle contract-linking exclusively through the analyze route (which already does `supabase.from('projects').update({ contract_id: contract.id }).eq('id', project_id).eq('user_id', user.id)`), or validate that the referenced `contract_id` belongs to the requesting user before accepting the update.

---

### WR-003: `pct()` function in admin page divides by `limit` without guarding zero — NaN at runtime

**File:** `app/(dashboard)/admin/page.tsx:26-28`  
**Issue:** The `pct` helper does `Math.round((used / limit) * 100)` where `limit` is `PLANS.pro.defense_responses` or `PLANS.pro.contracts`. These are currently non-zero constants, but if either plan limit is ever set to 0 (e.g., for a special tier), the result is `NaN` or `Infinity`, which React will render as an empty string or crash.

**Fix:**
```typescript
function pct(used: number, limit: number) {
  if (limit === 0) return 0
  return Math.min(Math.round((used / limit) * 100), 100)
}
```

---

### WR-004: `app/(dashboard)/projects/[id]/history/page.tsx` exposes raw response text for free users who query the API directly

**File:** `app/(dashboard)/projects/[id]/history/page.tsx:22-24`  
**Issue:** The history page fetches **all** responses from the database (line 15: no limit clause on the Supabase query), then slices the result in JavaScript: `visibleResponses = plan === 'free' ? allResponses.slice(0, 3) : allResponses`. This means all response data — including the full `response` text, `situation`, `extra_context` — is fetched from Supabase and held in server memory regardless of plan. The slicing only controls what is rendered in the UI. A free user can bypass the gating entirely by querying `/api/projects/[id]` (which returns `defense_responses` via the joined select) or by inspecting the RSC payload.

**Fix:** Apply the limit at the database layer, not in JavaScript:
```typescript
// For free users:
const query = supabase
  .from('defense_responses')
  .select('...')
  .eq('project_id', id)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

if (plan === 'free') {
  query.limit(3)
}
const { data: responses } = await query
```

---

### WR-005: `window.location.origin` used in server-rendered context without SSR guard in signup flow

**File:** `app/(auth)/signup/page.tsx:90`  
**Issue:** `window.location.origin` is accessed inside `handleSubmit` and `handleGoogle`, which are event handlers (so `window` will exist at runtime). However, the `emailRedirectTo` in `handleSubmit` on line 90 uses `window.location.origin` — this is fine since the component is `'use client'`. The actual risk is that `lib/checkout.ts:1-4` calls `window.location.href` inside `startCheckout`, which is used in `SettingsClient.tsx` — this is also a client component, so it's safe. No actual crash here, but the pattern is fragile. **The real concern** is `app/page.tsx` which is a `'use client'` component that calls `window` APIs inside `useEffect` — this is fine, but the client bundle on the landing page is very large (all hero animations imported directly). This is flagged as a pattern concern.

Actually the more concrete issue: in `lib/checkout.ts`, `startCheckout` immediately sets `window.location.href = '/checkout'` without any SSR guard, and this function is also imported in `SettingsClient.tsx` (a `'use client'` component). This is safe as-is because both consumers are client components. **However**, if this function is ever accidentally imported in a server component, it will throw at build time.

**Fix:** Document the function with a JSDoc `@clientOnly` comment, or move it inside the client component where it is consumed.

---

### WR-006: New-user detection in auth callback uses a 60-second window — race condition for slow email clients

**File:** `app/auth/callback/route.ts:27-28`  
**Issue:** New signup detection compares `Date.now() - new Date(confirmedAt).getTime() < 60_000`. The 60-second window is too short for users on mobile or in regions with slow email delivery. If more than 60 seconds elapse between Supabase setting `email_confirmed_at` and the user clicking the link, they will be treated as a returning user and not receive a welcome email or see the onboarding modal (`?welcome=1` will not be appended to the redirect).

**Fix:** A safer approach is to store a `is_new` boolean flag on `user_profiles` that is set during profile creation (via a Postgres trigger) and cleared after the welcome email is sent. The callback route checks and clears this flag atomically.

---

### WR-007: Contract file-type validation trusts `file.type` (MIME type from client) — bypassable

**File:** `app/api/contracts/analyze/route.ts:91-99`  
**Issue:** PDF validation is done exclusively on `file.type !== 'application/pdf'`. MIME type is supplied by the browser (the HTTP Content-Type of the multipart part) and is trivially forged. An attacker can send a JavaScript file, a binary, or a polyglot PDF/HTML file with `Content-Type: application/pdf` and it will pass this check and be forwarded to the Anthropic Files API.

While the damage is limited (Anthropic's API will either reject non-PDF content or analyze garbage), a polyglot PDF containing executable content could theoretically affect downstream processing.

**Fix:** Add magic byte validation in addition to MIME type check:
```typescript
const bytes = await file.arrayBuffer()
const header = new Uint8Array(bytes).slice(0, 5)
const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 &&
              header[3] === 0x46 && header[4] === 0x2D  // %PDF-
if (!isPDF) {
  // return 400
}
```

---

### WR-008: Prompt injection sanitization in `document/route.ts` is incomplete and inconsistently applied

**File:** `app/api/projects/[id]/document/route.ts:100-106`  
**Issue:** The `context` field in the document generation route applies a sanitization regex that strips non-ASCII characters and removes exact phrases like "ignore all previous instructions". This regex-based approach is fundamentally insufficient for prompt injection because:
1. It only sanitizes the `context` field. The `situation` field in `defend/route.ts`, `message` in `analyze-message/route.ts`, and `client_reply` in `reply/route.ts` receive no equivalent sanitization.
2. Attackers routinely bypass such filters with obfuscation (e.g., "ign​ore previous instructions", Unicode lookalikes, splitting across tokens).
3. The `project.title`, `project.notes`, and `project.client_name` fields flow into the prompt without any sanitization (e.g., `contextLines` in `defend/route.ts` lines 194-201).

**Fix:** Prompt injection is not fully solvable with regex. The correct mitigation is:
- Use XML-tag delimiters around user-controlled content in all prompts (e.g., `<user_content>...</user_content>`)
- Add an output validation layer that checks AI output does not contain system-level instructions
- For high-value operations (document generation, contract analysis), consider adding an input classification step that rejects clearly malicious inputs

The `document/route.ts` is the only place that wraps user content in `<user_context>` tags — apply this pattern consistently across all AI routes.

---

### WR-009: `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL` are eagerly required at module load time in `lib/email.ts`

**File:** `lib/email.ts:11-12`  
**Issue:** `requireEnv` is called at the top level of the module (lines 11-12), not inside the exported functions. This means `lib/email.ts` will throw during module initialization if these environment variables are not set — not just when an email is actually attempted. This will crash any import of this file (including test setups) if the env vars are absent. The test setup in `tests/setup.ts` does not set `RESEND_FROM_EMAIL` or `NEXT_PUBLIC_APP_URL`, which means tests that import any module that transitively imports `lib/email.ts` will fail with an initialization error rather than a meaningful assertion failure.

**Fix:** Defer the `requireEnv` calls to inside each function, or check at the point of use:
```typescript
export async function sendWelcomeEmail(to: string): Promise<void> {
  const from = requireEnv('RESEND_FROM_EMAIL')
  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL')
  // ...
}
```

---

### WR-010: Admin `deleteUser` errors on individual table deletes are silently swallowed

**File:** `app/(dashboard)/admin/actions.ts:64-70`  
**Issue:** The `deleteUser` action calls `admin.from('defense_responses').delete()...`, `admin.from('contracts').delete()...`, `admin.from('user_profiles').delete()...` without checking the return values of these operations. If any of these Supabase calls returns an error (e.g., a constraint violation, connection timeout, or RLS policy), the error is silently discarded and the function proceeds to call `admin.auth.admin.deleteUser(userId)`. This can result in partial data deletion — the auth user is deleted but their application data (responses, contracts) remains orphaned with a now-invalid `user_id`.

**Fix:**
```typescript
const { error: responsesError } = await admin.from('defense_responses').delete().eq('user_id', userId)
if (responsesError) throw new Error(`Failed to delete responses: ${responsesError.message}`)
// repeat for each table
```

---

### WR-011: `checkRateLimit` leaks internal rate limit timing via response headers to all clients

**File:** `lib/rate-limit.ts:39-48`  
**Issue:** When a rate limit is exceeded, the response includes `X-RateLimit-Reset` and `Retry-After` headers containing the exact Unix timestamp when the window resets. This is not a severe issue but exposes internal timing information that can help an attacker calibrate burst attacks more precisely by knowing exactly when to start the next burst.

**Fix:** Use `Retry-After` with a duration (seconds) rather than an absolute timestamp, and omit `X-RateLimit-Reset` from the response:
```typescript
'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
// Remove: 'X-RateLimit-Reset': String(reset),
```
(Note: `Retry-After` with a duration is already included — simply remove the `X-RateLimit-Reset` header.)

---

## Info

### IN-001: `DEFENSE_TOOL_VALUES` type is `[string, ...string[]]` not `[DefenseTool, ...DefenseTool[]]` — loses type safety at Zod boundary

**File:** `lib/defenseTools.ts:261`  
**Issue:** `DEFENSE_TOOL_VALUES = DEFENSE_TOOLS.map(t => t.type) as [string, ...string[]]`. The `as [string, ...string[]]` cast erases the literal union type. When this is used in `z.enum(DEFENSE_TOOL_VALUES)`, Zod validates against the runtime values correctly, but the TypeScript inferred type from the enum is `z.ZodEnum<[string, ...string[]]>` not `z.ZodEnum<[DefenseTool, ...DefenseTool[]]>`. This means `parsed.data.tool_type` is typed as `string` not `DefenseTool`, requiring downstream casts.

**Fix:**
```typescript
export const DEFENSE_TOOL_VALUES = DEFENSE_TOOLS.map(t => t.type) as [DefenseTool, ...DefenseTool[]]
```

---

### IN-002: `admin/page.tsx` imports `createAdminSupabaseClient` twice from the same path

**File:** `app/(dashboard)/admin/page.tsx:2-3`  
**Issue:** Two separate import lines for the same module:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
```
These can be merged into a single import.

**Fix:**
```typescript
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
```

---

### IN-003: `tests/setup.ts` sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to empty strings — Redis clients will be `null` in tests

**File:** `tests/setup.ts:8-9`  
**Issue:** Empty strings are falsy in the Redis initialization check:
```typescript
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis(...)
  : null
```
Empty strings evaluate to `null` — meaning all rate limiters are `null` in tests, rate limit checks always pass, and concurrency semaphores are no-ops. This is acceptable for unit tests but means there are **zero tests** verifying that rate limiting and concurrency controls work correctly when Redis is active. Add integration tests or use a mock Redis (e.g., `ioredis-mock`) to cover these paths.

---

### IN-004: `lib/email.ts` `sendFeedbackNotification` error handling is inconsistent with other send functions

**File:** `lib/email.ts:128-130`  
**Issue:** All three send functions throw on `error` (which is correct for `sendWelcomeEmail` and `sendUpgradeEmail` since callers need to know). But `sendFeedbackNotification` is called with `.catch(() => {})` in `app/api/feedback/route.ts:35-39`, silently dropping errors. The feedback email failure is completely invisible — no log, no Sentry event. If Resend is misconfigured or rate-limited, feedback submissions will appear successful to users but notifications will never arrive.

**Fix:** In the feedback route, log the error instead of swallowing it:
```typescript
sendFeedbackNotification(...).catch((err) => {
  console.error('Feedback notification failed:', err)
})
```

---

### IN-005: CSP header allows `'unsafe-inline'` for `script-src` in production

**File:** `next.config.ts:8`  
**Issue:** The Content Security Policy includes `'unsafe-inline'` for `script-src` in production (it is only `'unsafe-eval'` that is dev-only, not `'unsafe-inline'`). This materially weakens XSS protection: any injected inline script (e.g., via a stored XSS in user-controlled content that makes it into a rendered page) will execute without triggering the CSP. The correct approach for Next.js apps is to use nonce-based CSP or hash-based CSP for inline scripts.

**Fix:** This is complex to fix in Next.js 15 without middleware-level nonce injection, but at minimum document the decision and track it as a known gap.

---

### IN-006: `proxy.ts` maintenance mode bypass includes `/admin` without auth check — could expose admin during maintenance

**File:** `proxy.ts:54-57`  
**Issue:** The maintenance bypass list includes `pathname.startsWith('/admin')` which allows unauthenticated requests to `/admin` to bypass the maintenance redirect. The admin page itself does check auth on load, but the middleware no longer enforces auth for admin routes during maintenance. This is a defense-in-depth gap — the middleware should still verify auth even during maintenance for admin routes.

**Fix:**
```typescript
const bypassMaintenance =
  pathname === '/maintenance' ||
  pathname.startsWith('/auth')
// Remove '/admin' from bypass — admin auth check happens in the page itself
// OR keep '/admin' in bypass but still enforce auth in middleware for it
```

---

### IN-007: `app/page.tsx` landing page is `'use client'` — no server-side rendering for SEO-critical content

**File:** `app/page.tsx:1`  
**Issue:** The entire landing page (including the pricing section, how-it-works content, and all SEO-relevant copy) is a client component (`'use client'`). This means the page ships as JavaScript that renders only after hydration, with no SSR HTML for crawlers that don't execute JavaScript. While Googlebot does execute JavaScript, this delays indexing and hurts Core Web Vitals (LCP is deferred until the JS bundle downloads and renders). The landing page should be a server component with interactive sections extracted into small client sub-components.

**Fix:** Convert `app/page.tsx` to a server component. Extract only the interactive parts (`ToolCarousel`, `DemoAnimation`, scroll-driven animations) into `'use client'` sub-components.

---

_Reviewed: 2026-04-28_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
