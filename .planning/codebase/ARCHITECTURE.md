# Architecture

**Analysis Date:** 2026-04-23

## Pattern Overview

**Overall:** Next.js App Router with Server Components as primary data-fetch layer, Client Components for interactivity, and Route Handlers as a thin REST API backend.

**Key Characteristics:**
- Server Components fetch data directly from Supabase — no separate API hop for page loads
- Route Handlers (`app/api/`) act as the AI integration layer and mutation surface
- Authentication is enforced at two levels: `middleware.ts` (edge redirect) and layout-level `getUser()` guard
- All AI calls (Anthropic) go through Route Handlers only — never from Client Components directly
- Usage limits (free vs pro) are enforced inside Route Handlers before calling Anthropic

## Layers

**Middleware (Edge):**
- Purpose: Route-level authentication gating and redirect logic
- Location: `middleware.ts`
- Contains: Supabase session check via `@supabase/ssr`, redirect rules
- Depends on: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used by: All non-static, non-API routes (matcher excludes `_next/*`, `api/*`)

**Route Groups / Page Layer:**
- Purpose: Server-rendered pages that fetch data and pass it to Client Components as props
- Location: `app/(auth)/`, `app/(dashboard)/`
- Contains: Async Server Components, layout files
- Depends on: `lib/supabase/server.ts`, `@/types`
- Used by: Browser (Next.js renders server-side)

**Dashboard Layout:**
- Purpose: Wraps all authenticated pages; fetches `user_profiles` once per request; renders `Navbar`
- Location: `app/(dashboard)/layout.tsx`
- Contains: Auth guard (`redirect('/login')`), profile fetch, `Navbar` composition
- Depends on: `lib/supabase/server.ts`, `components/shared/Navbar`

**API Route Handlers:**
- Purpose: Mutations, AI integration, webhook processing
- Location: `app/api/`
- Contains: Auth check, plan enforcement, Anthropic calls, Supabase writes
- Depends on: `lib/supabase/server.ts`, `lib/anthropic.ts`, `lib/creem.ts`
- Used by: Client Components (fetch calls), Creem webhook

**Supabase Client Abstraction:**
- Purpose: Provides correctly-scoped Supabase clients for different contexts
- Location: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Contains: `createServerSupabaseClient()` (anon key, cookie-based), `createServiceSupabaseClient()` (service role, for webhooks), `createClient()` (browser)
- Depends on: `@supabase/ssr`

**Component Layer:**
- Purpose: UI rendering; Client Components handle interactivity and local state
- Location: `components/`
- Contains: Feature components grouped by domain (`defense/`, `contract/`, `project/`, `shared/`, `hero/`), primitive UI (`ui/`)
- Depends on: `@/types`, `@/lib/defenseTools`, fetch to `/api/*`

**Static Config / Constants:**
- Purpose: Centralized business logic constants (tools, prompts, plans)
- Location: `lib/anthropic.ts` (system prompts), `lib/defenseTools.ts` (tool metadata), `lib/plans.ts` (plan limits)
- Contains: Exported constants and singletons
- Depends on: `@/types`

## Data Flow

**Defense Message Generation:**

1. User lands on `app/(dashboard)/projects/[id]/page.tsx` — Server Component fetches project + profile from Supabase
2. Page renders `<DefenseDashboard>` (Client Component) with `projectId`, `plan`, `responsesUsed` as props
3. User picks a tool in `DefenseDashboard`, fills `SituationPanel`, submits
4. `DefenseDashboard` POSTs to `/api/projects/[id]/defend`
5. Route handler: verifies auth → checks plan limit → fetches project + contract context → calls `anthropic.messages.create()` → saves response to `defense_responses` table → increments `defense_responses_used` if free
6. Response text returned; `DefenseDashboard` renders `ResponseOutput`
7. `router.refresh()` called to re-sync Server Component state

**Contract Analysis:**

1. User navigates to `app/(dashboard)/contracts/new/page.tsx`
2. `<ContractUploader>` (Client Component) collects PDF file or pasted text
3. POSTs multipart `FormData` to `/api/contracts/analyze`
4. Route handler: verifies auth → checks `contracts_used` limit → creates pending `contracts` row → uploads PDF to Anthropic Files API (if file) or sends text inline → calls `anthropic.messages.create()` → parses JSON response → updates contract row with analysis → increments `contracts_used`
5. Client redirects to `/contracts/[id]`

**Authentication Flow:**

1. User submits login form → Client Component calls `supabase.auth.signInWithPassword()` directly
2. OR: User clicks Google → `supabase.auth.signInWithOAuth()` → redirect to `app/auth/callback/route.ts` → `exchangeCodeForSession()` → redirect to `/dashboard`
3. Supabase session stored in cookies; middleware reads cookies on every request
4. On first sign-up, DB trigger `handle_new_user()` auto-creates `user_profiles` row

**Subscription Upgrade:**

1. User hits upgrade → Client POSTs to `/api/checkout` → handler calls `creem.createCheckoutSession()` → returns checkout URL
2. User completes Creem checkout → Creem POSTs to `/api/webhooks/creem`
3. Webhook handler verifies HMAC signature → updates `user_profiles.plan` to `'pro'` using service-role client

**State Management:**
- No global state store. Server Components own authoritative data.
- Client Components use `useState` for local UI state (selected tool, loading, generated response).
- `router.refresh()` used to invalidate Server Component cache after mutations.

## Key Abstractions

**DefenseTool:**
- Purpose: Typed union of 8 situation categories that drive both UI and AI prompt context
- Examples: `lib/defenseTools.ts`, `types/index.ts`
- Pattern: Static metadata array (`DEFENSE_TOOLS: DefenseToolMeta[]`) consumed by both the landing page and the authenticated dashboard

**System Prompts:**
- Purpose: Encapsulate all Anthropic prompt engineering in one file; exported as named constants
- Examples: `lib/anthropic.ts` (`CONTRACT_ANALYSIS_SYSTEM_PROMPT`, `DEFENSE_SYSTEM_PROMPT`)
- Pattern: Long string constants exported alongside the `anthropic` singleton

**Plan Enforcement:**
- Purpose: Free-tier limits checked inline in Route Handlers before any Anthropic call
- Pattern: `if (profile?.plan === 'free' && usage >= limit) return 403 UPGRADE_REQUIRED`
- Both handlers follow identical pattern: `app/api/projects/[id]/defend/route.ts`, `app/api/contracts/analyze/route.ts`

**Row-Level Security:**
- Purpose: Database-enforced data isolation — every table has an RLS policy restricting access to `auth.uid() = user_id`
- Examples: `supabase/migrations/001_initial.sql`
- Pattern: API handlers still check `user_id` in queries as defense-in-depth, but RLS is the authoritative guard

## Entry Points

**Landing Page:**
- Location: `app/page.tsx`
- Triggers: Any unauthenticated visit to `/`
- Responsibilities: Marketing content, tool showcase, pricing display. Uses `'use client'` (WebGL hero component requirement).

**Auth Callback:**
- Location: `app/auth/callback/route.ts`
- Triggers: OAuth redirect from Supabase after Google login
- Responsibilities: Exchanges auth code for session, redirects to `/dashboard`

**Dashboard Layout:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: Any request to a `/dashboard`, `/projects`, `/contracts`, or `/settings` route
- Responsibilities: Auth guard, profile fetch, Navbar rendering

**Creem Webhook:**
- Location: `app/api/webhooks/creem/route.ts`
- Triggers: HTTP POST from Creem on subscription events
- Responsibilities: HMAC signature verification, plan update via service-role client

## Error Handling

**Strategy:** Route Handlers return structured JSON errors with HTTP status codes. Client Components check `res.ok` and render inline error state. No global error boundary beyond Next.js defaults.

**Patterns:**
- `401 Unauthorized` — returned from every Route Handler when `getUser()` returns no user
- `403 UPGRADE_REQUIRED` — specific error code client checks to show `UpgradePrompt` component instead of generic error
- `404 Not found` — returned when Supabase query returns null (includes implicit RLS enforcement)
- `500` with `console.error` — for unexpected failures (Anthropic API errors, DB errors)
- Form-level inline errors in Client Components (e.g., `setError(error.message)`)

## Cross-Cutting Concerns

**Logging:** `console.error()` at failure points in Route Handlers only. No structured logging framework.

**Validation:** Minimal — required field checks in Route Handlers (`!title || !client_name`), TypeScript types as primary contract. No Zod or validation library.

**Authentication:** Three-layer: middleware edge redirect → layout-level `getUser()` guard → Route Handler `getUser()` check per request.

---

*Architecture analysis: 2026-04-23*
