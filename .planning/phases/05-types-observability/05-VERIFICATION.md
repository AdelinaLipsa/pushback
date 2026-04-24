---
phase: 05-types-observability
verified: 2026-04-24T00:00:00Z
status: human_needed
score: 8/9 must-haves verified
overrides_applied: 0
gaps:
  - truth: "next.config.ts withSentryConfig is missing hideSourceMaps: true and automaticVercelMonitors: false"
    status: partial
    reason: "withSentryConfig wrapper is present and correct for org/project/silent/widenClientFileUpload/disableLogger, but the plan required hideSourceMaps: true (strips source maps from public bundles — security) and automaticVercelMonitors: false. Both options are absent from the current next.config.ts."
    artifacts:
      - path: "next.config.ts"
        issue: "hideSourceMaps and automaticVercelMonitors options missing from withSentryConfig call"
    missing:
      - "Add hideSourceMaps: true to withSentryConfig options (prevents source code leaking to browser)"
      - "Add automaticVercelMonitors: false to withSentryConfig options"
human_verification:
  - test: "Configure Anthropic $10/month billing alert"
    expected: "Alert visible in console.anthropic.com → Settings → Billing → Spend alerts"
    why_human: "OBS-02 is a manual dashboard step — no code change can satisfy it"
  - test: "End-to-end Sentry smoke test in production"
    expected: "A test error thrown in a Route Handler appears in Sentry within seconds; stack trace shows original TypeScript file names and line numbers (not minified JS)"
    why_human: "Requires a live Vercel deploy with NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT set. Cannot verify source map upload or actual Sentry event capture programmatically."
---

# Phase 5: Types + Observability Verification Report

**Phase Goal:** Supabase type generation, Sentry error capture, and Anthropic spend alert
**Verified:** 2026-04-24
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | types/database.types.ts exists with export type Database covering 4 tables + 2 RPCs | ✓ VERIFIED | File exists; `export type Database` present; tables: contracts, defense_responses, projects, user_profiles (6 hits on table name pattern); RPCs: check_and_increment_contracts + check_and_increment_defense_responses at line 197-200 |
| 2 | createServerSupabaseClient and createAdminSupabaseClient use Database generic | ✓ VERIFIED | lib/supabase/server.ts line 8: `createServerClient<Database>`, line 27: `createClient<Database>`; import on line 4 |
| 3 | createClient in lib/supabase/client.ts uses Database generic | ✓ VERIFIED | lib/supabase/client.ts line 5: `createBrowserClient<Database>`; import on line 2 |
| 4 | Zero as-any casts on Supabase join shapes in defend/route.ts, ProjectCard.tsx, page.tsx | ✓ VERIFIED | grep counts: defend/route.ts=0, ProjectCard.tsx=0, projects/[id]/page.tsx=0; Array.isArray narrowing confirmed in all three files |
| 5 | instrumentation.ts exports onRequestError = Sentry.captureRequestError | ✓ VERIFIED | Line 10: `export const onRequestError: Instrumentation.onRequestError = Sentry.captureRequestError` |
| 6 | instrumentation-client.ts has Sentry.init with tracesSampleRate 0 | ✓ VERIFIED | tracesSampleRate: 0, replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0 all present |
| 7 | next.config.ts is wrapped with withSentryConfig | ✓ VERIFIED | Line 51: `export default withSentryConfig(nextConfig, {...})`; CSP connect-src includes `https://sentry.io https://*.sentry.io` (line 10) |
| 8 | CSP connect-src includes sentry.io | ✓ VERIFIED | Line 10 of next.config.ts: `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.sentry.io;` |
| 9 | npm run types:check exits 0 | ✓ VERIFIED | Ran `npm run types:check` — exited 0 with no output (clean compile) |

**Score:** 8/9 truths verified (withSentryConfig is present but missing two security/config options)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `types/database.types.ts` | Database type, 4 tables, 2 RPCs | ✓ VERIFIED | 1 Database export, 6 table name matches, 2 RPC entries |
| `lib/supabase/server.ts` | createServerClient\<Database\>, createClient\<Database\> | ✓ VERIFIED | Both generics present, import from @/types/database.types |
| `lib/supabase/client.ts` | createBrowserClient\<Database\> | ✓ VERIFIED | Generic and import present |
| `app/api/projects/[id]/defend/route.ts` | No as-any on project.contracts | ✓ VERIFIED | 0 as-any casts; Array.isArray narrowing on line 85 |
| `components/project/ProjectCard.tsx` | No project-as-any casts | ✓ VERIFIED | 0 as-any casts; Array.isArray on line 18 |
| `app/(dashboard)/projects/[id]/page.tsx` | No ProjectWithContract workaround | ✓ VERIFIED | 0 occurrences of ProjectWithContract or as-unknown-as |
| `instrumentation.ts` | register() + onRequestError = Sentry.captureRequestError | ✓ VERIFIED | Both exports present; NEXT_RUNTIME guard for server init |
| `instrumentation-client.ts` | Sentry.init, tracesSampleRate 0 | ✓ VERIFIED | All three sample rates at 0, no exports (side-effect module) |
| `sentry.server.config.ts` | Sentry.init, tracesSampleRate 0 | ✓ VERIFIED | Side-effect module, dsn from env, tracesSampleRate: 0 |
| `next.config.ts` | withSentryConfig with all required options | ✗ PARTIAL | Wrapper present, org/project/silent/widenClientFileUpload/disableLogger present; hideSourceMaps: true and automaticVercelMonitors: false ABSENT |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| lib/supabase/server.ts | types/database.types.ts | import type { Database } | ✓ WIRED | Line 4 |
| lib/supabase/client.ts | types/database.types.ts | import type { Database } | ✓ WIRED | Line 2 |
| instrumentation.ts | sentry.server.config.ts | dynamic import under NEXT_RUNTIME guard | ✓ WIRED | Line 6: `await import('./sentry.server.config')` |
| next.config.ts | @sentry/nextjs withSentryConfig | export default withSentryConfig(nextConfig,...) | ✓ WIRED | Line 51 |
| CSP connect-src | sentry.io ingest | https://sentry.io https://*.sentry.io tokens | ✓ WIRED | Line 10 of next.config.ts |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles with Database generic applied | npm run types:check | Exit 0, no output | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TYPES-01 | 05-01, 05-02 | Typed Supabase client, no as-any on joined shapes | ✓ SATISFIED | Database generic on all 3 factories; 0 as-any casts in 3 target files; types:check exits 0 |
| OBS-01 | 05-03 | Unhandled errors in Route Handlers captured by Sentry with request context | ? NEEDS HUMAN | Code wiring is correct (onRequestError = Sentry.captureRequestError); actual event capture requires live deploy smoke test |
| OBS-02 | 05-03 | Anthropic $10/month billing alert configured | ? NEEDS HUMAN | Manual dashboard step — no code satisfies this |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| next.config.ts | 51-57 | hideSourceMaps: true missing from withSentryConfig | ⚠️ Warning | Source maps will be uploaded to Sentry but also served publicly in browser bundles — exposes TypeScript source to anyone who inspects network traffic. Not a blocker for error capture but is a security gap. |
| next.config.ts | 51-57 | automaticVercelMonitors: false missing | ℹ️ Info | Vercel cron monitors may be auto-created on deploy. Low impact but plan required explicit opt-out. |

### Human Verification Required

#### 1. OBS-02: Anthropic Billing Alert

**Test:** Log in to https://console.anthropic.com → Settings → Billing → Spend alerts. Configure a $10/month threshold notification.
**Expected:** Alert is visible in the Spend alerts list, triggered at $10/month.
**Why human:** No code change can satisfy this requirement — it is a manual dashboard configuration step.

#### 2. OBS-01: End-to-End Sentry Event Capture

**Test:** With NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT set in Vercel environment variables, deploy and trigger a test error in a Route Handler. Check the Sentry dashboard for the resulting issue.
**Expected:** Issue appears within ~30 seconds; stack trace shows original TypeScript file names and line numbers (source maps working); request method/path/headers visible in issue context.
**Why human:** Requires a live Vercel deploy with real Sentry credentials. Programmatic checks can only verify code wiring, not actual event delivery or source map restoration.

### Gaps Summary

**one gap and two human items are blocking `passed` status.**

The gap is in `next.config.ts`: the `withSentryConfig` call is present and correctly wraps the config, but two options from the plan are missing — `hideSourceMaps: true` and `automaticVercelMonitors: false`. The `hideSourceMaps` omission is the more significant issue: without it, uploaded source maps are also served to browsers, leaking TypeScript source code. Adding both options is a one-line change each.

The two human items (OBS-02 Anthropic alert, OBS-01 smoke test) are intentional holdouts that no automated check can satisfy.

---

_Verified: 2026-04-24_
_Verifier: Claude (gsd-verifier)_
