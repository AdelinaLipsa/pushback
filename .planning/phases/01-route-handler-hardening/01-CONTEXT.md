# Phase 1: Route Handler Hardening - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Make all AI route handlers safe under real production conditions: add try/catch error handling to the defend route, fix race conditions on free-tier plan gating using Supabase RPC (atomic), add Zod input validation to all AI POST routes, fix auth callback error handling, and add plan-gated response history. No new features. No UI changes beyond the response history gating overlay.

</domain>

<decisions>
## Implementation Decisions

### Error Messages
- **D-01:** When Anthropic is unreachable or returns an error on the defend route, return a descriptive + actionable error string: `{ error: 'AI generation failed — please try again' }` with status 500.
- **D-02:** When the free-tier AI response save to DB fails (RELY-04 case), return a credit-safe message: `{ error: 'Failed to save response — your credit was not used. Please try again.' }`. Do NOT increment `defense_responses_used` if the DB insert fails.
- **D-03:** Contract analysis generic error (catch block, existing): keep `{ error: 'Analysis failed' }` — already descriptive enough. Add credit-safe note if analysis insert fails before incrementing `contracts_used`.

### Response History Gating (GATE-03)
- **D-04:** Fetch ALL defense_responses from DB (no `.limit()` at query level). In the UI, render the first 3 responses normally. Responses beyond index 3 are rendered with `filter: blur(4px)` + a semi-transparent overlay containing an "Upgrade to Pro" CTA button. The plan check happens in `history/page.tsx` by reading the user's plan from the fetched profile.
- **D-05:** The upgrade overlay is positioned absolutely over each locked card, centered, with a brief label ("Upgrade to see full history") and a button linking to checkout.

### Auth Callback Error (RELY-03)
- **D-06:** In `auth/callback/route.ts`, check the result of `exchangeCodeForSession(code)`. On error (expired or replayed code): redirect to `/login?error=auth_failed`. The login page should read this query param and display a red inline banner: "Sign-in link expired — please try again."
- **D-07:** Successful auth flow remains unchanged: redirect to `/dashboard`.

### Input Validation — Projects POST (VALID-02)
- **D-08:** Add Zod schema to `app/api/projects/route.ts` POST handler:
  - `title`: string, min 1, max 200 chars
  - `client_name`: string, min 1, max 200 chars
  - `project_value`: optional, positive number
  - `currency`: optional, enum('EUR', 'USD', 'GBP', 'AUD', 'CAD')
  - `client_email`: optional, valid email format (`z.string().email()`)
  - `notes`: optional, string, max 2000 chars
  - Return `{ error: '<field> is invalid: <reason>' }` with status 400 on validation failure (match existing convention).

### Input Validation — Defend Route (VALID-01)
- **D-09:** Add Zod schema to `app/api/projects/[id]/defend/route.ts`:
  - `tool_type`: must be a valid `DefenseTool` enum value (use `z.enum([...Object.keys(TOOL_LABELS)])`)
  - `situation`: string, min 10, max 2000 chars
  - `extra_context`: optional, record of string keys to string/number values; individual string values max 500 chars each
  - Return `{ error: '<field>: <reason>' }` with status 400.

### Atomic Plan Gating (GATE-01, GATE-02)
- **D-10:** Use Supabase RPC for atomic plan gating (pre-decided in PROJECT.md). Replace the current read-then-write pattern with a Postgres function that does check + increment in a single transaction. The RPC returns `{ allowed: boolean }`. If `allowed` is false, return `{ error: 'UPGRADE_REQUIRED' }` with status 403. The RPC must be created as a new Supabase migration.
- **D-11:** Same atomic RPC pattern applies to both `defense_responses_used` (defend route) and `contracts_used` (contracts analyze route).

### Input Validation — Contracts Analyze (VALID-03)
- **D-12:** Validate file upload in `contracts/analyze/route.ts`: file type must be `application/pdf` (check `file.type`), file size max 10 MB (`file.size <= 10 * 1024 * 1024`). On failure: `{ error: 'Only PDF files are supported' }` or `{ error: 'File must be under 10 MB' }` with status 400.

### JSON Extraction — Contract Analysis (RELY-02)
- **D-13:** Claude's Discretion — implement a JSON extraction helper: try `JSON.parse(rawText)` first; if it throws, attempt to extract the first JSON object using a regex (`/{[\s\S]*}/`) and parse that; if both fail, return `{ error: 'Contract analysis returned malformed output — please try again' }` with status 500 and set contract status to 'error'.

### System Prompt Off-Topic Guard
- **D-14:** Add a short guardrail to `DEFENSE_SYSTEM_PROMPT` in `lib/anthropic.ts`: if the submitted situation is not a freelancer-client dispute (e.g. unrelated topics, homework, tests), Claude should respond with: "This tool is designed for freelancer-client situations only." No pre-flight classification call — the instruction lives in the system prompt only.

### Claude's Discretion
- Error boundary in the defend route: structure of the catch block, specific error categories (rate limit vs. network vs. auth) can all be decided by the planner.
- Zod library is not yet in package.json — the planner must add it. `zod` is the standard choice.
- RPC function naming: `check_and_increment_defense_responses` / `check_and_increment_contracts` or similar.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route Handlers to Harden
- `app/api/projects/[id]/defend/route.ts` — Main defend route: missing try/catch, race condition on gating, no validation
- `app/api/contracts/analyze/route.ts` — Contract analysis: JSON.parse throws on bad output, no file validation, same race condition
- `app/auth/callback/route.ts` — Auth callback: no error check on exchangeCodeForSession
- `app/api/projects/route.ts` — Projects POST: only truthiness check, needs Zod

### Pages to Update
- `app/(dashboard)/projects/[id]/history/page.tsx` — Response history: no plan check, shows all responses to free users

### Reference Files
- `lib/plans.ts` — FREE_LIMIT constants (defense_responses: 3, contracts: 1)
- `types/index.ts` — DefenseTool enum values (must match Zod schema exactly)
- `supabase/migrations/001_initial.sql` — DB schema: user_profiles columns (defense_responses_used, contracts_used, plan)

### Login Page (for auth error banner)
- `app/(auth)/login/page.tsx` — Needs to read `?error=auth_failed` query param and show error banner

### Stack / Conventions
- `.planning/codebase/CONVENTIONS.md` — Error response format (`{ error: 'message' }` + HTTP status), import order, no-semicolons style
- `.planning/codebase/STACK.md` — Next.js 16.2.4, async params, async cookies(), Supabase client patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createServerSupabaseClient` from `@/lib/supabase/server` — standard server-side DB client used in all routes
- `Response.json()` (Web API) — existing error response pattern, do NOT switch to NextResponse
- `DefenseTool` type from `@/types` — already defines the valid tool_type enum values
- `TOOL_LABELS` record in `defend/route.ts` — keyed by DefenseTool; use `Object.keys(TOOL_LABELS)` for Zod enum

### Established Patterns
- Error responses: `{ error: 'message' }` + HTTP status code (never structured Zod error output)
- DB errors: `{ error: error.message }` status 500
- Plan limit: `{ error: 'UPGRADE_REQUIRED' }` status 403 — client checks for this sentinel
- Auth check: `const { data: { user } } = await supabase.auth.getUser()` — always first in route

### Integration Points
- New Supabase migration needed for atomic RPC functions (GATE-01, GATE-02)
- Login page at `app/(auth)/login/page.tsx` needs to read `searchParams.error` (or similar) to show the auth error banner
- `ResponseHistory` component at `components/defense/ResponseHistory.tsx` may need props or internal changes to support the blurred locked state

</code_context>

<specifics>
## Specific Ideas

- Response history locked cards: CSS `filter: blur(4px)` on response text content, `position: relative` on card, absolute overlay with centered "Upgrade to Pro" CTA button
- Auth error banner on login page: red/error-colored inline alert above the login form reading "Sign-in link expired — please try again." triggered by `?error=auth_failed` param
- Supabase RPC pattern: `const { data, error } = await supabase.rpc('check_and_increment_defense_responses', { uid: user.id })` — returns `{ allowed: boolean, current_count: number }`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-route-handler-hardening*
*Context gathered: 2026-04-23*
