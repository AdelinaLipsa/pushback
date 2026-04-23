# External Integrations

**Analysis Date:** 2026-04-23

## APIs & External Services

**AI / LLM:**
- Anthropic Claude API — Core feature engine for both contract analysis and defense message generation
  - SDK/Client: `@anthropic-ai/sdk` ^0.90.0, singleton in `lib/anthropic.ts`
  - Auth: `ANTHROPIC_API_KEY` (server-only env var)
  - Model used: `claude-sonnet-4-6`
  - Max tokens: 4096 (contract analysis), 1024 (defense messages)
  - Feature: Anthropic Files API (beta) used to upload PDF contracts
    - Beta header: `anthropic-beta: files-api-2025-04-14`
    - Uploaded file ID stored in `contracts.anthropic_file_id` column
  - Used in: `app/api/contracts/analyze/route.ts`, `app/api/projects/[id]/defend/route.ts`

**Payments & Subscriptions:**
- Creem — Payment processor for Pro plan subscriptions
  - Base URL: `https://api.creem.io/v1`
  - SDK/Client: Native `fetch`, helper in `lib/creem.ts`
  - Auth: `CREEM_API_KEY` (server-only, sent as `x-api-key` header)
  - Used in: `app/api/checkout/route.ts` (create checkout session)
  - Product: `NEXT_PUBLIC_CREEM_PRODUCT_ID` identifies the Pro plan product
  - Success redirect: `{NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`

**Email:**
- Resend — Transactional email
  - SDK: `resend` ^6.12.2
  - Auth: `RESEND_API_KEY` (server-only env var)
  - Note: Package installed and key required but no active usage found in current API routes

**Fonts:**
- Google Fonts (via `next/font/google`) — loaded in `app/layout.tsx`
  - Inter (sans-serif body/heading)
  - JetBrains Mono (monospace code)

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser/SSR)
  - Service role: `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS — used in webhook handler)
  - Client (browser): `lib/supabase/client.ts` via `createBrowserClient`
  - Client (server RSC/route): `lib/supabase/server.ts` via `createServerSupabaseClient`
  - Client (service role): `lib/supabase/server.ts` via `createServiceSupabaseClient`
  - Schema: `supabase/migrations/001_initial.sql`
  - Tables:
    - `public.user_profiles` — plan, usage counters, Creem IDs; auto-created on auth signup via trigger
    - `public.projects` — freelancer projects with client info, value, currency, notes
    - `public.contracts` — uploaded contracts, Anthropic file IDs, analysis JSONB
    - `public.defense_responses` — history of AI-generated defense messages per project
  - RLS: Enabled on all tables; policies restrict each user to their own rows (`auth.uid() = user_id`)
  - Trigger: `on_auth_user_created` → `handle_new_user()` auto-inserts `user_profiles` row on signup

**File Storage:**
- No Supabase Storage used. Contract PDFs are uploaded directly to Anthropic Files API, not stored locally.

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Cookie-based session management via `@supabase/ssr`
  - OAuth: Supabase magic link / email auth + OAuth callback at `app/auth/callback/route.ts`
  - Callback exchanges auth code for session: `supabase.auth.exchangeCodeForSession(code)`
  - Middleware: `middleware.ts` protects `/dashboard`, `/projects`, `/contracts` routes; redirects unauthenticated users to `/login`
  - Middleware also redirects authenticated users away from `/login` and `/signup` to `/dashboard`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or similar configured)

**Logs:**
- `console.error` in API route catch blocks only
  - `app/api/contracts/analyze/route.ts` — logs contract analysis errors
  - `app/api/checkout/route.ts` — logs checkout errors

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured. Next.js 16 with no `output: 'export'` setting implies Node.js server deployment (Vercel or equivalent).

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (bypasses RLS, keep secret)
- `ANTHROPIC_API_KEY` — Anthropic Claude API key
- `CREEM_API_KEY` — Creem payment API key
- `CREEM_WEBHOOK_SECRET` — HMAC secret for webhook signature verification
- `NEXT_PUBLIC_CREEM_PRODUCT_ID` — Creem product ID for Pro plan
- `RESEND_API_KEY` — Resend email API key
- `NEXT_PUBLIC_APP_URL` — Base URL (e.g. `https://yourapp.com`)

**Secrets location:**
- `.env.local` (gitignored); example in `.env.local.example`

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/creem` — Creem subscription lifecycle events
  - Handler: `app/api/webhooks/creem/route.ts`
  - Verification: HMAC-SHA256 signature check against `CREEM_WEBHOOK_SECRET`
  - Events handled:
    - `subscription.active` / `subscription.updated` → sets `user_profiles.plan = 'pro'`, stores Creem customer/subscription IDs
    - `subscription.canceled` / `subscription.expired` → sets `user_profiles.plan = 'free'`
  - Uses service role client to bypass RLS for cross-user updates

**Outgoing:**
- Auth callback: `GET /auth/callback` — Supabase OAuth code exchange redirect target

---

*Integration audit: 2026-04-23*
