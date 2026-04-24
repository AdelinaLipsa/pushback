# Phase 5: Types & Observability - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Three infrastructure improvements that make production problems visible and eliminate `as any` hacks on database queries:

1. **Supabase type generation** — generate `database.types.ts` from the live schema; wire typed server client; eliminate `as any` casts on joined queries in the defend route and ProjectCard (TYPES-01)
2. **Sentry error capture** — full `@sentry/nextjs` integration with source map uploads; auto-instruments route handlers so unhandled errors appear in Sentry within seconds (OBS-01)
3. **Anthropic spend alert** — configure a $10/month billing threshold notification in the Anthropic dashboard (OBS-02)

This phase has no user-facing UI changes.

</domain>

<decisions>
## Implementation Decisions

### Supabase Types (TYPES-01)

- **D-01:** Generated `database.types.ts` coexists with the hand-written `types/index.ts`. The generated file provides the `Database` generic for server clients and typed query shapes. The hand-written types continue to serve app logic (component props, API response types, etc.). No migration of `types/index.ts` to generated shapes — keep disruption focused.
- **D-02:** Apply the `Database` generic to `createServerClient` and `createClient` calls in `lib/supabase/server.ts` and `lib/supabase/client.ts`. This is where the `as any` casts on joined queries originate.
- **D-03:** Eliminate the three `as any` casts that TYPES-01 calls out explicitly:
  - `project.contracts as any` in `app/api/projects/[id]/defend/route.ts` (lines 84–85)
  - `project as any` (defense_responses, contracts.risk_level, contracts.risk_score) in `components/project/ProjectCard.tsx`
- **D-04:** Anthropic beta API `as any` casts (`anthropic.beta.files as any`) are intentionally kept — these are beta endpoints without SDK types, not a Supabase query issue (carried forward from Phase 4, D-12).
- **D-05:** Add a `gen:types` script to `package.json` that runs `supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > types/database.types.ts`. Developers run this manually when the schema changes. No CI automation for now.

### Sentry Error Capture (OBS-01)

- **D-06:** Use full `@sentry/nextjs` — not manual `@sentry/node` wrapper calls. The full integration auto-instruments App Router route handlers via `instrumentation.ts`, which satisfies OBS-01 ("unhandled errors in Route Handlers with request context") without manually wrapping every catch block.
- **D-07:** Upload source maps to Sentry. Stack traces must show original TypeScript lines to be useful. Requires `SENTRY_AUTH_TOKEN` in Vercel env vars and `sentry.server.config.ts` / `sentry.client.config.ts` config files with `widenClientFileUpload: true`.
- **D-08:** Sentry scope is server + client. Full `@sentry/nextjs` integration captures both. Client-side errors in dashboard components are worth capturing too (free in the same setup).
- **D-09:** Performance monitoring and Session Replay are NOT enabled. OBS-01 is error capture only. Replay raises GDPR surface area (privacy policy names only Anthropic as data processor); performance monitoring is out of scope for this phase.

### Anthropic Spend Alert (OBS-02)

- **D-10:** Configure a $10/month billing threshold alert in the Anthropic console (console.anthropic.com → Settings → Billing → Spend alerts). This is a manual dashboard step, not a code change. The plan should include this as a verification checklist item.
- **D-11:** No code changes required for OBS-02. The plan documents the steps to configure the alert so it's not forgotten during deployment.

### Claude's Discretion

- Exact `database.types.ts` file location — `types/database.types.ts` is the natural choice given the existing `types/` directory.
- Whether to add a `types:check` script that validates the generated types compile — reasonable addition alongside `gen:types`.
- Sentry DSN env var naming — follow Sentry's default `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` conventions.
- Whether to add a `sentry.edge.config.ts` for edge runtime — only if the project uses edge routes; check before adding.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Supabase Types
- `lib/supabase/server.ts` — Add `Database` generic to `createServerClient` and `createClient` calls here
- `lib/supabase/client.ts` — Same typed client change for client-side Supabase usage
- `types/index.ts` — Hand-written app types; generated types coexist here, do not replace
- `supabase/migrations/001_initial.sql` — Full schema definition; what `gen types` will generate from
- `supabase/migrations/002_atomic_gating.sql` — RPC functions added in Phase 1; also reflected in generated types

### As-Any Casts to Eliminate
- `app/api/projects/[id]/defend/route.ts` lines 84–85 — `project.contracts as any` on joined Supabase query
- `components/project/ProjectCard.tsx` — `project as any` on defense_responses, contracts.risk_level, contracts.risk_score

### Sentry
- `node_modules/next/dist/docs/` — Next.js 16 instrumentation.ts specifics before writing Sentry config
- `.planning/codebase/STACK.md` — Next.js 16.2.4, React 19, confirms App Router usage

### No External API Docs Needed
- Sentry setup for Next.js — follow `@sentry/nextjs` official wizard output pattern; `instrumentation.ts` is the App Router hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase/server.ts` — Both `createServerSupabaseClient()` and `createAdminSupabaseClient()` need the `Database` generic added. Currently untyped.
- `types/index.ts` — The `Project` type already models the joined shape (`contracts?: {...}`, `defense_responses?: DefenseResponse[]`). After adding generated types, the server client will produce narrower inferred types — verify the `Project` hand-written type stays compatible.

### Established Patterns
- `as any` on Anthropic beta APIs is intentional and unchanged (Phase 4 D-12).
- `console.error` for non-critical failures (fire-and-forget) — Sentry `captureException` inside the full integration auto-captures these, no manual changes needed.
- Route handler error shape: `Response.json({ error: '...' }, { status: N })` — Sentry captures the thrown error before the catch handler returns this shape.

### Integration Points
- `instrumentation.ts` (to be created) — Next.js 16 hook for `@sentry/nextjs` server-side init. Must be at project root alongside `next.config.ts`.
- `next.config.ts` — Sentry webpack plugin wraps the Next.js config via `withSentryConfig()`. Existing security headers config must be preserved inside the wrapper.
- Vercel env vars needed: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SUPABASE_PROJECT_REF` (for `gen:types` script, already likely set or derivable from existing Supabase env vars).

</code_context>

<specifics>
## Specific Ideas

- `gen:types` script: `"gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > types/database.types.ts"`
- The Anthropic dashboard step should be a checklist item in the phase verification: "Log into console.anthropic.com → Settings → Billing → configure $10/month spend alert."
- Sentry DSN comes from Sentry project creation — the plan should note that a new Sentry project must be created first if one doesn't exist.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-types-observability*
*Context gathered: 2026-04-24*
