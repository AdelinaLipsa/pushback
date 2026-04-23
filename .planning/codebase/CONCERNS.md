# Codebase Concerns

**Analysis Date:** 2026-04-23

## Tech Debt

**Resend installed but never used:**
- Issue: `resend` v6.12.2 is a declared dependency in `package.json` and `RESEND_API_KEY` is listed in `.env.local.example`, but no `lib/resend.ts` file exists and no file in the codebase imports from `resend`.
- Files: `package.json`, `.env.local.example`
- Impact: Dead dependency adds to bundle weight. No transactional emails are being sent — no welcome email on signup, no payment confirmation after upgrade.
- Fix approach: Either implement `lib/resend.ts` with welcome/confirmation emails, or remove the dependency and env var if email is deferred post-launch.

**Duplicate Anthropic import in analyze route:**
- Issue: `app/api/contracts/analyze/route.ts` imports `Anthropic` directly from `@anthropic-ai/sdk` on line 1, then also imports the shared `anthropic` client from `@/lib/anthropic` on line 2. The direct import is unused — the shared client is what's used.
- Files: `app/api/contracts/analyze/route.ts`
- Impact: Confusing, potential for someone to accidentally create a second unconfigured client.
- Fix approach: Remove line 1 (`import Anthropic from '@anthropic-ai/sdk'`). The `Anthropic` type is only needed for `Anthropic.MessageParam['content']` — import that type from the SDK only if needed.

**Anthropic Files API called with `as any` casts:**
- Issue: The Files API (beta) upload and message content use `(anthropic.beta.files as any).upload(...)` and `{ type: 'document', ... } as any`. This is because the SDK types don't fully expose this beta API yet.
- Files: `app/api/contracts/analyze/route.ts` lines 40, 46
- Impact: Type safety lost in the most critical path. SDK updates may silently break this.
- Fix approach: Pin the `@anthropic-ai/sdk` version. When the SDK properly types the Files API, remove the casts.

**Supabase join data accessed as `any` throughout:**
- Issue: Multiple files cast Supabase join results to `any` because the auto-generated types don't reflect joined tables. Affected: `app/api/projects/[id]/defend/route.ts` (line 52–53), `app/(dashboard)/projects/[id]/page.tsx` (line 33), `components/project/ProjectCard.tsx` (lines 16–19).
- Files: `app/api/projects/[id]/defend/route.ts`, `app/(dashboard)/projects/[id]/page.tsx`, `components/project/ProjectCard.tsx`
- Impact: Runtime errors if Supabase schema changes. No TypeScript protection on nested join data.
- Fix approach: Generate proper Supabase types via `supabase gen types typescript` and extend the `Project` type in `types/index.ts` to include the joined shape explicitly.

**`next.config.ts` is empty:**
- Issue: `next.config.ts` contains no configuration beyond the empty object `{}`.
- Files: `next.config.ts`
- Impact: Missing security headers (CSP, X-Frame-Options, HSTS), no image domain allowlist, no bundle analysis setup.
- Fix approach: Add security headers, configure `experimental` features if needed.

## Known Bugs

**`/privacy` and `/terms` pages do not exist:**
- Symptoms: Footer on the landing page (`app/page.tsx` lines 197–202) links to `/privacy` and `/terms`. These routes have no corresponding page files.
- Files: `app/page.tsx` (footer), no `app/privacy/`, no `app/terms/`
- Trigger: Any visitor clicking Privacy or Terms in the footer gets a 404.
- Workaround: None.

**Signup agreement text references Terms without a link:**
- Symptoms: Signup page (`app/(auth)/signup/page.tsx` line 147) says "By signing up you agree to our Terms and Privacy Policy" with no hyperlinks. The pages don't exist either.
- Files: `app/(auth)/signup/page.tsx`
- Trigger: Legal requirement triggered on every signup.
- Workaround: None.

**Auth callback does not handle exchange failure:**
- Symptoms: `app/auth/callback/route.ts` calls `exchangeCodeForSession(code)` but does not check if the exchange succeeded or failed. On failure it silently redirects to `/dashboard` without a valid session.
- Files: `app/auth/callback/route.ts`
- Trigger: Expired or replayed OAuth callback codes.
- Workaround: None.

**`defend` route has no try/catch:**
- Symptoms: `app/api/projects/[id]/defend/route.ts` makes a live Anthropic API call with no error handling wrapper. If Anthropic is down or rate-limits the request, an unhandled exception propagates to the client as an unformatted 500.
- Files: `app/api/projects/[id]/defend/route.ts`
- Trigger: Anthropic API outage or throttling.
- Workaround: None.

**Usage counter incremented even when save fails:**
- Symptoms: In `app/api/projects/[id]/defend/route.ts` lines 82–87, the `defense_responses_used` counter is incremented after the response is saved, but the save result (`saved`) is not checked for errors. If the insert fails, the counter still increments and the user loses a credit without getting a response.
- Files: `app/api/projects/[id]/defend/route.ts`
- Trigger: Supabase write failure during high load.
- Workaround: None.

**Contract analysis JSON.parse is unguarded:**
- Symptoms: `app/api/contracts/analyze/route.ts` line 65 calls `JSON.parse(rawText)` with no try/catch around the parse itself. If Anthropic returns malformed JSON (possible if it adds a preamble or truncates), the entire route throws and the contract is marked `error`.
- Files: `app/api/contracts/analyze/route.ts`
- Trigger: Unexpected model output format.
- Workaround: The outer try/catch marks the contract as `error`, so the DB is not left in a bad state, but the error is opaque to the user.

## Security Considerations

**No input validation on API routes:**
- Risk: `app/api/projects/[id]/defend/route.ts` accepts `tool_type`, `situation`, and `extra_context` from the request body with no validation. An attacker can send any string as `situation` (up to prompt injection), any `tool_type` not in the enum, or deeply nested objects as `extra_context`.
- Files: `app/api/projects/[id]/defend/route.ts`, `app/api/projects/route.ts`
- Current mitigation: RLS ensures the project belongs to the authenticated user. The AI prompt is structured to resist injection.
- Recommendations: Add Zod validation for request bodies on all POST routes. Limit `situation` field length (e.g. 2000 chars max).

**No rate limiting on AI endpoints:**
- Risk: Any authenticated user can call `POST /api/projects/[id]/defend` in a tight loop. The plan-gating counter (`defense_responses_used`) is a DB read-then-write with no atomic increment — a race condition could allow a free-tier user to exceed their 3-response limit.
- Files: `app/api/projects/[id]/defend/route.ts`, `app/api/contracts/analyze/route.ts`
- Current mitigation: Plan check exists but is non-atomic.
- Recommendations: Use a Supabase RPC with `update ... where defense_responses_used < 3 returning *` as an atomic check-and-increment. Add IP-level rate limiting via Vercel middleware or Upstash Ratelimit.

**Webhook secret loaded but not validated for null:**
- Risk: `app/api/webhooks/creem/route.ts` does `process.env.CREEM_WEBHOOK_SECRET!` — the non-null assertion means if the env var is not set, `secret` is `undefined`, the HMAC computes against `undefined`, and all webhook calls will fail with a 401 rather than a useful startup error.
- Files: `app/api/webhooks/creem/route.ts`, `lib/creem.ts`
- Current mitigation: None.
- Recommendations: Add startup validation for required env vars, or at minimum an explicit check with a descriptive error: `if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 500 })`.

**`createServiceSupabaseClient` unnecessarily reads cookies:**
- Risk: `lib/supabase/server.ts` lines 24–42 use `createServerClient` with the service role key but also wire up cookie handling. The service role client is used in the webhook handler where there is no cookie context. This is a pattern mismatch — the service role client should use a cookie-free transport.
- Files: `lib/supabase/server.ts`, `app/api/webhooks/creem/route.ts`
- Current mitigation: Does not expose a vulnerability, but the cookie wiring is meaningless and could cause unexpected behavior in edge cases.
- Recommendations: Use `createClient` from `@supabase/supabase-js` directly for the service role client, without cookie plumbing.

**No CSRF protection on state-mutating routes:**
- Risk: All `POST`/`PATCH`/`DELETE` API routes rely entirely on Supabase JWT cookies for auth but have no CSRF token check. Supabase's `HttpOnly` cookie mitigates most CSRF, but this depends on the Supabase SSR configuration being correct.
- Files: All `app/api/*/route.ts`
- Current mitigation: Supabase `HttpOnly` cookie behavior.
- Recommendations: Document the assumption explicitly. Consider adding `SameSite=Strict` verification.

## Performance Bottlenecks

**WebGL hero shader runs on every frame with no visibility check:**
- Problem: `components/hero/PushbackHero.tsx` starts a `requestAnimationFrame` loop immediately and never pauses when the canvas is off-screen. The fragment shader is computationally intensive (fbm with 8 octaves, voronoi).
- Files: `components/hero/PushbackHero.tsx`
- Cause: RAF loop has no `IntersectionObserver` or visibility-based pause.
- Improvement path: Add an `IntersectionObserver` to pause/resume the RAF loop when the hero is not visible. Add `visibilitychange` listener to pause when tab is hidden.

**GSAP `setGlobalIntensity` on every mouse move:**
- Problem: `PushbackHero.tsx` calls `setGlobalIntensity` (a React `useState` setter) inside a GSAP `onUpdate` tween triggered by `mousemove`. This forces a React re-render on every animation frame during mouse movement.
- Files: `components/hero/PushbackHero.tsx` lines 352–365
- Cause: Mixing GSAP animation state with React state.
- Improvement path: Store intensity in a `useRef` and read it directly in the RAF loop instead of triggering React re-renders.

**Dashboard fetches defense_responses for every project on load:**
- Problem: `app/(dashboard)/dashboard/page.tsx` selects `defense_responses(id, tool_type, created_at)` for all projects in a single query. As a user accumulates responses, this grows unboundedly.
- Files: `app/(dashboard)/dashboard/page.tsx`
- Cause: No pagination or limit on the joined defense_responses.
- Improvement path: Only fetch the count or most recent response per project. Add `.limit(1)` on the join or use a separate count query.

## Fragile Areas

**Contract analysis depends on Anthropic returning clean JSON:**
- Files: `app/api/contracts/analyze/route.ts`, `lib/anthropic.ts`
- Why fragile: The system prompt instructs Claude to return "ONLY valid JSON — no markdown, no preamble" but there is no fallback parser. A single model response with a leading sentence breaks the entire analysis.
- Safe modification: Add a JSON extraction step that strips everything before the first `{` and after the last `}` before parsing, then validate the parsed object against the `ContractAnalysis` type shape.
- Test coverage: No tests exist for the analysis pipeline.

**Plan gating is a simple counter with no audit trail:**
- Files: `app/api/projects/[id]/defend/route.ts`, `app/api/contracts/analyze/route.ts`
- Why fragile: Usage is tracked by incrementing `defense_responses_used` on `user_profiles`. There is no relationship between the counter and actual response rows — if responses are deleted, the counter does not decrease. If the increment step fails silently, the counter drifts from reality.
- Safe modification: Derive usage from `COUNT(*)` on `defense_responses` for free users rather than maintaining a denormalized counter.
- Test coverage: None.

**Middleware does not protect `/settings` route:**
- Files: `middleware.ts`
- Why fragile: The `isDashboardRoute` check in middleware covers `/dashboard`, `/projects`, and `/contracts` but not `/settings`. The settings page does its own `redirect('/login')` check, so it is not actually exposed — but this is a layered defense gap.
- Safe modification: Add `/settings` to `isDashboardRoute` check in `middleware.ts`.
- Test coverage: None.

**Response history accessible by `user_id` only via UI — no GET endpoint:**
- Files: `app/api/responses/[id]/route.ts`
- Why fragile: The responses API only exposes `PATCH`. There is no `GET /api/responses/[id]` endpoint. The history page fetches directly from Supabase server-side, which works, but any client-side history refresh requires a full page navigation.
- Safe modification: Not critical, but a GET endpoint would enable live refresh on the history page.
- Test coverage: None.

## Scaling Limits

**Anthropic Files API stored file IDs with no expiry management:**
- Current capacity: Anthropic Files API stores uploaded PDFs indefinitely (per billing account).
- Limit: No mechanism deletes the `anthropic_file_id` when a contract is deleted in Supabase.
- Scaling path: Add a cleanup step in `DELETE /api/contracts/[id]` that calls the Anthropic Files API to delete the stored file before removing the DB record.

**`user_profiles` usage counters are unbounded for Pro users:**
- Current capacity: `defense_responses_used` and `contracts_used` increment forever for Pro users but are only displayed in Settings — no monthly reset logic exists.
- Limit: Not a functional bug, but misleading UX (shows "47 (unlimited)" rather than a current-period count).
- Scaling path: Add a `usage_reset_at` timestamp and a scheduled function (Supabase cron or external) to reset counters monthly.

## Dependencies at Risk

**Anthropic Files API is a beta endpoint:**
- Risk: `anthropic.beta.files` is used with `as any` casts and a hardcoded beta header `'anthropic-beta': 'files-api-2025-04-14'`. Beta APIs can change or be removed without a major version bump.
- Impact: PDF contract upload breaks silently if the API changes.
- Migration plan: Monitor Anthropic SDK release notes. When the Files API graduates to stable, remove the `as any` casts and the manual beta header.

**`resend` v6.12.2 installed but not integrated:**
- Risk: A major dependency is unused, adding maintenance overhead and potential security surface without providing value.
- Impact: Dependency updates and security scans must cover a library with zero actual usage.
- Migration plan: Either implement the email integration or remove `resend` from `package.json` and `RESEND_API_KEY` from `.env.local.example`.

## Missing Critical Features

**No transactional email on signup or upgrade:**
- Problem: `RESEND_API_KEY` is configured but no emails are sent. New users get a Supabase confirmation email but nothing from Pushback. Pro upgraders get no receipt or welcome email.
- Blocks: Trust-building with new users, payment confirmation paper trail.

**No project editing UI:**
- Problem: `PATCH /api/projects/[id]` exists and accepts updates to all project fields, but there is no UI in the dashboard to edit a project after creation. The `NewProjectForm` only creates; there is no edit form.
- Files: `app/api/projects/[id]/route.ts`, `components/project/NewProjectForm.tsx`
- Blocks: Users who make a typo in client name or project value have no recourse except via API.

**No contract deletion UI:**
- Problem: `DELETE /api/contracts/[id]` exists but there is no delete button on the contract list page or contract detail page.
- Files: `app/api/contracts/[id]/route.ts`, `app/(dashboard)/contracts/page.tsx`, `app/(dashboard)/contracts/[id]/page.tsx`
- Blocks: Users cannot clean up mistaken or outdated contract analyses.

**No project deletion UI:**
- Problem: `DELETE /api/projects/[id]` exists but there is no delete button in the project UI.
- Files: `app/api/projects/[id]/route.ts`, `app/(dashboard)/projects/[id]/page.tsx`
- Blocks: Users cannot archive or remove completed/cancelled projects.

**Privacy and Terms pages missing:**
- Problem: Footer links to `/privacy` and `/terms`. Signup page references Terms. Neither page exists.
- Blocks: Legal compliance, GDPR requirements, app store / payment processor requirements.

## Test Coverage Gaps

**Zero test files exist:**
- What's not tested: The entire codebase — AI prompt engineering, plan gating logic, webhook signature verification, contract analysis parsing, auth callback.
- Files: All source files
- Risk: Any refactor or dependency update can break core revenue flows (checkout, plan gating, AI generation) with no automated detection.
- Priority: High

**Most critical untested paths:**
- Webhook HMAC verification in `app/api/webhooks/creem/route.ts` — wrong signature should return 401; correct signature should update plan.
- Plan gating race condition in `app/api/projects/[id]/defend/route.ts` — concurrent requests could exceed free limit.
- JSON parse failure path in `app/api/contracts/analyze/route.ts` — contract should be marked `error`, not left `pending`.
- Auth callback with expired code in `app/auth/callback/route.ts`.

---

*Concerns audit: 2026-04-23*
