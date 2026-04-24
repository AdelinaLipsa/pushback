# Phase 5: Types & Observability - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 10
**Analogs found:** 8 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/supabase/server.ts` | utility / client factory | request-response | itself (modify in place) | self |
| `lib/supabase/client.ts` | utility / client factory | request-response | itself (modify in place) | self |
| `app/api/projects/[id]/defend/route.ts` | route handler | request-response | itself (modify in place) | self |
| `components/project/ProjectCard.tsx` | component | transform | itself (modify in place) | self |
| `package.json` | config | — | itself (modify in place) | self |
| `next.config.ts` | config | — | itself (modify in place) | self |
| `instrumentation.ts` | observability hook | event-driven | Next.js docs example (no codebase analog) | none |
| `sentry.server.config.ts` | config | event-driven | `lib/anthropic.ts` (SDK init pattern) | partial |
| `sentry.client.config.ts` | config | event-driven | `lib/supabase/client.ts` (browser SDK init) | partial |
| `types/database.types.ts` | type definition | — | `types/index.ts` (hand-written types) | role-match |

---

## Pattern Assignments

### `lib/supabase/server.ts` (utility, request-response)

**Change:** Add `Database` generic to both `createServerClient` and `createClient` calls.

**Current code** (full file, lines 1–30):
```typescript
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Target pattern — add import and generic:**
```typescript
import { Database } from '@/types/database.types'

// createServerClient becomes:
return createServerClient<Database>(...)

// createClient becomes:
return createClient<Database>(...)
```

Both generics go on the function call directly — the `Database` type flows through to all `.from()` calls and their return types, eliminating the need for `as any` on joined results.

---

### `lib/supabase/client.ts` (utility, request-response)

**Change:** Add `Database` generic to `createBrowserClient` call.

**Current code** (full file, lines 1–8):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Target pattern:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

### `app/api/projects/[id]/defend/route.ts` (route handler, request-response)

**Change:** Remove `project.contracts as any` casts at lines 84–85. After the typed client is in place, `project.contracts` will have a known type from the generated `Database` types. The joined `.select('..., contracts(analysis)')` shape will be inferred as an object or array depending on the relationship — confirm the exact inferred shape before removing the cast.

**Current `as any` casts** (lines 84–85):
```typescript
const contractContext = (project.contracts as any)?.analysis
  ? `\n\nCONTRACT DATA:\n${JSON.stringify((project.contracts as any).analysis, null, 2)}`
  : '\n\n(No contract — do not reference or invent contract terms)'
```

**Target pattern — use inferred type directly:**
```typescript
// After typed client: project.contracts is inferred from the generated types.
// Supabase joined single foreign-key returns object | null (not array).
// Narrow with a type-safe check instead of `as any`:
const contractAnalysis = Array.isArray(project.contracts)
  ? project.contracts[0]?.analysis
  : project.contracts?.analysis

const contractContext = contractAnalysis
  ? `\n\nCONTRACT DATA:\n${JSON.stringify(contractAnalysis, null, 2)}`
  : '\n\n(No contract — do not reference or invent contract terms)'
```

**Note:** The exact shape of `project.contracts` from a `.select('contracts(analysis)')` on a one-to-one FK is `{ analysis: ... } | null` when queried with `.single()`. Planner must verify this against the generated types before writing the final implementation. The `Array.isArray` guard handles the case where Supabase returns an array for has-many joins.

**Existing error handling pattern to preserve** (lines 125–133):
```typescript
} catch (err) {
  console.error('Defend route error:', err)
  // Compensating decrement — RPC already incremented, undo it on any unhandled error
  await supabase
    .from('user_profiles')
    .update({ defense_responses_used: preIncrementCount })
    .eq('id', user.id)
  return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
}
```

Do not alter the error handling structure. Only the `as any` casts on lines 84–85 are in scope.

---

### `components/project/ProjectCard.tsx` (component, transform)

**Change:** Remove three `project as any` casts (lines 16–19). The `Project` type in `types/index.ts` already models the joined shape with `contracts?` and `defense_responses?`, so after confirming typed-client compatibility, plain property access replaces the casts.

**Current `as any` casts** (lines 16–19):
```typescript
const responses = (project as any).defense_responses ?? []
const lastResponse = responses[0]
const riskLevel = (project as any).contracts?.risk_level
const riskScore = (project as any).contracts?.risk_score
```

**Target pattern — use `Project` type directly:**
```typescript
const responses = project.defense_responses ?? []
const lastResponse = responses[0]
const riskLevel = project.contracts?.risk_level
const riskScore = project.contracts?.risk_score
```

**Existing `Project` type** (`types/index.ts` lines 70–84) already provides these fields:
```typescript
export type Project = {
  // ... core fields ...
  contracts?: { risk_score: number | null; risk_level: RiskLevel | null; analysis: ContractAnalysis | null } | null
  defense_responses?: DefenseResponse[]
}
```

No type changes to `types/index.ts` are needed — the hand-written type is already correct. The casts exist only because the Supabase client previously returned `any`.

---

### `package.json` (config)

**Change:** Add two scripts alongside the existing four.

**Current scripts block** (lines 5–10):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**Target pattern:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > types/database.types.ts",
  "types:check": "tsc --noEmit"
}
```

`types:check` validates that the generated types compile with no errors — a lightweight addition the planner may include per the Discretion note in CONTEXT.md.

---

### `next.config.ts` (config)

**Change:** Wrap the existing `nextConfig` export with `withSentryConfig()`. All existing content (CSP header, security headers, `poweredByHeader: false`) must be preserved inside the wrapper.

**Current export** (lines 1–50, full file):
```typescript
import type { NextConfig } from 'next'

const cspHeader = `...` // preserve verbatim

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() { ... },
}

export default nextConfig
```

**Target pattern:**
```typescript
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.sentry.io;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [ /* existing headers block unchanged */ ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
```

**CSP note:** `connect-src` must be extended to include `https://sentry.io https://*.sentry.io` so client-side Sentry error reports are not blocked by the existing Content-Security-Policy.

---

### `instrumentation.ts` (observability hook, event-driven) — NEW FILE

**No codebase analog.** Pattern sourced from Next.js 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`).

**Location:** Project root (same level as `next.config.ts`). This is required — Next.js looks for `instrumentation.ts` at the root, not inside `app/`.

**Next.js docs pattern** (from instrumentation.md, lines 20–26):
```typescript
export function register() {
  // called once on server start; must complete before server handles requests
}
```

**Target pattern for @sentry/nextjs:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

**Runtime guard:** Use `process.env.NEXT_RUNTIME === 'nodejs'` to load server config only in Node runtime. Edge config is conditionally added — CONTEXT.md notes to check if edge routes exist first (no edge routes found in current codebase, so `sentry.edge.config.ts` may be omitted).

---

### `sentry.server.config.ts` (config, event-driven) — NEW FILE

**Analog:** `lib/anthropic.ts` (SDK initialization at module level). Pattern: import SDK, call init with env vars, export nothing (side-effect module).

**Anthropic SDK init pattern** (from `lib/anthropic.ts` — side-effect initialization with env-var client):
```typescript
import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

**Target pattern for sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,          // performance monitoring off (D-09)
  debug: false,
})
```

This file is a side-effect module — no exports. It is dynamically imported by `instrumentation.ts` only in the Node.js runtime.

---

### `sentry.client.config.ts` (config, event-driven) — NEW FILE

**Analog:** `lib/supabase/client.ts` (browser/client SDK initialization). Pattern: import SDK, call init with env var, no exports.

**Target pattern for sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,          // performance monitoring off (D-09)
  replaysSessionSampleRate: 0,  // session replay off (D-09)
  replaysOnErrorSampleRate: 0,
  debug: false,
})
```

`NEXT_PUBLIC_SENTRY_DSN` must be prefixed with `NEXT_PUBLIC_` so it is available in the browser bundle. This file is auto-loaded by `@sentry/nextjs` on the client — do not import it manually.

---

### `types/database.types.ts` (type definition) — NEW FILE (generated)

**This file is generated, not hand-written.** The `gen:types` script produces it:
```
supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > types/database.types.ts
```

**Schema tables that will appear in generated output** (from migrations):
- `public.user_profiles` — matches `UserProfile` in `types/index.ts`
- `public.contracts` — matches `Contract` in `types/index.ts`
- `public.projects` — matches `Project` in `types/index.ts`
- `public.defense_responses` — matches `DefenseResponse` in `types/index.ts`

**RPCs that will appear** (from `002_atomic_gating.sql` and `003_free_tier_limit.sql`):
- `check_and_increment_defense_responses(uid: string): Json`
- `check_and_increment_contracts(uid: string): Json`

**Expected generated shape (illustrative — actual output from CLI):**
```typescript
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          contract_id: string | null
          title: string
          client_name: string
          client_email: string | null
          project_value: number | null
          currency: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: { ... }
        Update: { ... }
      }
      contracts: { Row: { ... }; Insert: { ... }; Update: { ... } }
      defense_responses: { Row: { ... }; Insert: { ... }; Update: { ... } }
      user_profiles: { Row: { ... }; Insert: { ... }; Update: { ... } }
    }
    Functions: {
      check_and_increment_defense_responses: { Args: { uid: string }; Returns: Json }
      check_and_increment_contracts: { Args: { uid: string }; Returns: Json }
    }
  }
}
```

**Coexistence rule (D-01):** `types/database.types.ts` exports only `Database`. `types/index.ts` continues to export all app-level types (`Project`, `Contract`, `DefenseResponse`, etc.) unchanged. No migration of hand-written types to generated row types — the generated `Database` generic is for the Supabase client only.

---

## Shared Patterns

### SDK Initialization (side-effect modules)
**Sources:** `lib/anthropic.ts`, `lib/supabase/client.ts`
**Apply to:** `sentry.server.config.ts`, `sentry.client.config.ts`

Pattern: Import SDK at top level, call `init()` or instantiate client with env vars, no exports. Files are loaded for their side effects only.

### Environment Variable Naming
**Source:** All `lib/` files (consistent `process.env.NEXT_PUBLIC_*` for browser-accessible, bare `process.env.*` for server-only)
**Apply to:** Sentry config files

- `NEXT_PUBLIC_SENTRY_DSN` — client-accessible DSN
- `SENTRY_AUTH_TOKEN` — server-only, for source map uploads (never expose to client)
- `SENTRY_ORG`, `SENTRY_PROJECT` — build-time only (used in `withSentryConfig`)
- `SUPABASE_PROJECT_REF` — server-only, used in `gen:types` script only

### Non-nullable env var assertion
**Source:** `lib/supabase/server.ts` (lines 7–9), `lib/supabase/client.ts` (lines 4–6)
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```
**Apply to:** Sentry DSN references in config files — use `process.env.NEXT_PUBLIC_SENTRY_DSN` without `!` since Sentry's `init()` accepts `undefined` DSN gracefully (disables reporting, does not throw).

### Error response shape
**Source:** `app/api/projects/[id]/defend/route.ts` (lines 31, 42, 58, 74, 121, 132)
```typescript
return Response.json({ error: '...' }, { status: N })
```
**Apply to:** No new route handlers in this phase. Preserve existing shape in `defend/route.ts` — the only route change is removing `as any` casts, not altering response format.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `instrumentation.ts` | observability hook | event-driven | No observability hooks exist in codebase; use Next.js docs pattern |
| `types/database.types.ts` | type definition | — | Generated file; no hand-written analog; `types/index.ts` is complementary, not a template |

---

## Metadata

**Analog search scope:** `/lib/`, `/app/api/`, `/components/`, `/types/`, `/next.config.ts`, `/package.json`, `node_modules/next/dist/docs/`
**Files read:** 12 source files + 1 Next.js docs file
**Pattern extraction date:** 2026-04-24
