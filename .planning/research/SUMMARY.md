# Research Summary — Pushback

## Executive Summary

Pushback is scaffold-complete. No new features are needed before launch. All gaps are in reliability, security, legal compliance, and two missing UI surfaces (edit/delete). The primary revenue risk is a race condition on the free-tier usage counter that allows concurrent requests to bypass the limit and generate unlimited free Anthropic responses. The secondary revenue risk is a webhook secret misconfiguration that silently drops all paid upgrades if the env var is missing.

## Stack

- **Validation:** Zod v3 (`zod@^3.24`) with `safeParse` in all Route Handlers — never `parse` (throws unhandled ZodErrors). Schemas in `lib/validation/`.
- **Atomic gating:** PostgreSQL function via `supabase.rpc()` with `SELECT ... FOR UPDATE` row locking. One RPC replaces the profile read, limit check, and counter increment.
- **Security headers:** Static `next.config.ts` headers with `unsafe-inline` (not nonce-based — nonces break PPR and CDN caching). Must whitelist `wss://*.supabase.co` for Supabase auth realtime. Set `poweredByHeader: false`.
- **Emails:** Install `@react-email/components`. Templates in `/emails/`. Use `render()` to produce HTML strings. Never block auth or webhook flow on email send — catch and swallow errors.
- **Supabase types:** `npx supabase gen types typescript --project-id <id> > types/database.types.ts`. Pass `Database` generic to `createServerClient<Database>()`. Use `QueryData<typeof query>` for joined shapes — eliminates all `as any` casts.

## Features

**Table stakes (must have before launch):**
- Project edit UI — freelancers will have typos; broken input = broken AI output
- Project and contract delete UI — GDPR right to erasure; trust signal
- Privacy Policy page — required by GDPR and Creem for live payments
- Terms of Service page — required by Creem for payment processor activation; must include AI output disclaimer
- Welcome email on signup — sets free-tier expectations
- Upgrade confirmation email — payment paper trail

**Differentiators to protect:**
- "€1.50 per handled situation" framing in `UpgradePrompt.tsx` — best copy in the codebase, must survive any redesign
- Pre-wall nudge at 2/3 usage (2 of 3 responses used) — converts before exhaustion rather than after

**Anti-features (do not build for v1):**
- Team/agency plans
- Contract template generation
- Chrome extension
- Monthly usage counter reset

## Architecture

**Confirmed patterns:**

1. **Atomic RPC:** `CREATE FUNCTION check_and_increment_usage(p_user_id uuid, p_limit int, p_column text) RETURNS boolean` using `FOR UPDATE` — called via `supabase.rpc()` before any Anthropic call. Both `defend` and `contracts/analyze` routes need this.

2. **Error handling:** Anthropic SDK exports named error classes (`RateLimitError`, `APIConnectionTimeoutError`, `APIError`). Catch specifically: `RateLimitError` → 429, `APIConnectionTimeoutError` → 503, generic `APIError` → 502. Always wrap Anthropic calls in try/catch.

3. **Service-role client:** `createServiceSupabaseClient()` incorrectly uses `@supabase/ssr`'s `createServerClient` (calls `cookies()`, sets up session refresh — meaningless in webhook context). Fix: use `createClient()` from `@supabase/supabase-js` directly with `autoRefreshToken: false, persistSession: false`.

4. **Middleware → Proxy (Next.js 16 breaking change):** `middleware.ts` with `middleware` export is deprecated in Next.js 16. Correct file is `proxy.ts` with a `proxy` export. A codemod handles the mechanical rename. Additionally, `/settings` is missing from the protected routes matcher.

5. **JSON extraction:** Three-stage extraction before `JSON.parse`: (1) try direct parse, (2) strip markdown fences, (3) find first `{` to last `}`. Also check `stop_reason === 'max_tokens'` — truncated JSON should be reported distinctly, not silently fail.

## Pitfalls

**Launch blockers (fix before any user):**
- Defend route has zero try/catch — silent 500 on any Anthropic outage
- `CREEM_WEBHOOK_SECRET!` non-null assertion — all paid upgrades silently fail if env var missing
- `/privacy` and `/terms` return 404 — Creem requires live Terms for payment processing
- Auth callback doesn't check exchange result — expired OAuth codes silently redirect without session
- No error monitoring — zero visibility into production failures

**Revenue integrity (fix before paid traffic):**
- Race condition on free-tier gating — exploitable, real revenue leak
- Usage counter incremented even when save fails — user loses credit without getting response
- No upgrade confirmation email — users have no paper trail after paying

**GDPR exposure (from first EU signup):**
- No account deletion mechanism
- Privacy Policy doesn't disclose Anthropic as data processor for uploaded contract PDFs

**Scale readiness (before marketing push):**
- Supabase default connection port 5432 — use pooler port 6543 on Vercel (serverless)
- No per-user rate limiting — authenticated users can loop AI endpoints

## Roadmap Implications

**5 coarse phases:**

1. **Route Handler Hardening** — atomic RPC, try/catch with typed errors, Zod validation, JSON extraction fix
2. **Infrastructure & Security** — service-role client fix, webhook secret null check, proxy.ts rename, security headers, `/settings` middleware gap
3. **Legal & Email** — Privacy Policy, Terms of Service, Resend welcome + upgrade emails
4. **Missing UI** — project edit form, project/contract/account delete
5. **Pre-Launch Ops** — Sentry, uptime monitoring, Supabase pooler URL, Anthropic spend alerts, Supabase type generation

## Confidence

**Overall: HIGH** — findings derived from reading actual route handler code and installed package sources, not inference.

**Open questions:**
- Creem merchant checklist exact requirements for legal page URLs
- Anthropic DPA process for API customers below enterprise tier
- Response history feature gating inconsistency: `lib/plans.ts` lists it as Pro-only but `/projects/[id]/history` has no plan check
- Zod v4 ecosystem status at implementation time (research recommends v3)

---
*Research synthesized: 2026-04-23*
