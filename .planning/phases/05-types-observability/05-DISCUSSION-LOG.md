# Phase 5: Types & Observability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 05-types-observability
**Areas discussed:** Supabase types: coexist vs. replace, Sentry integration depth, Anthropic spend threshold

---

## Supabase types: coexist vs. replace

| Option | Description | Selected |
|--------|-------------|----------|
| Coexist | Generate database.types.ts for typed server client + query shapes. Keep types/index.ts for app logic. Less disruption, focused on fixing the as-any casts. | ✓ |
| Replace entirely | Generate database.types.ts and migrate all of types/index.ts to use generated shapes. Single source of truth but touches many more files. | |

**User's choice:** Coexist
**Notes:** None

---

## Gen script

| Option | Description | Selected |
|--------|-------------|----------|
| npm script | Add "gen:types" to package.json that runs supabase gen types with --project-id. Run manually when schema changes. | ✓ |
| CI / pre-build only | Run type generation automatically in CI before build. Requires Supabase CLI and credentials in CI. | |

**User's choice:** npm script
**Notes:** None

---

## Sentry integration depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full @sentry/nextjs | Auto-instruments route handlers, server components, and client errors via instrumentation.ts. Zero missed unhandled errors. Adds client-side Sentry bundle (~15KB gzip) and webpack plugin. | ✓ |
| Manual server-only | Install @sentry/node and wrap specific catch blocks with Sentry.captureException(). Lighter, no client bundle — but only captures explicitly wrapped errors. | |

**User's choice:** Full @sentry/nextjs
**Notes:** None

---

## Source maps

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, upload source maps | Stack traces in Sentry show original TypeScript lines instead of compiled output. Requires SENTRY_AUTH_TOKEN in Vercel env vars and sentry.config.ts files. | ✓ |
| Skip source maps for now | Simpler setup, but Sentry stack traces will show compiled/minified code — harder to debug production errors. | |

**User's choice:** Yes, upload source maps
**Notes:** None

---

## Anthropic spend threshold

| Option | Description | Selected |
|--------|-------------|----------|
| $10 / month | Flags unexpected usage before costs escalate. Easy to raise later. | ✓ |
| $25 / month | More headroom for legitimate usage growth. | |
| You decide | Claude picks a sensible default. | |

**User's choice:** $10 / month
**Notes:** None

---

## Claude's Discretion

- Exact `database.types.ts` file location
- Whether to add a `types:check` script alongside `gen:types`
- Sentry DSN env var naming
- Whether to add `sentry.edge.config.ts` for edge runtime routes

## Deferred Ideas

None — discussion stayed within phase scope.
