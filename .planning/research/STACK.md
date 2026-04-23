# Technology Stack — Hardening Research

**Project:** Pushback
**Context:** Subsequent milestone — existing Next.js 15 / Supabase / Anthropic / Creem / Resend scaffold. Research covers five specific hardening questions only.
**Researched:** 2026-04-23
**Sources:** Next.js 16.2.4 official docs (verified), codebase analysis (verified), training knowledge for Zod/Supabase/Resend patterns (MEDIUM confidence — flagged where unverifiable)

---

## Question 1: Input Validation with Zod in Next.js 15 Route Handlers

### Recommendation

**Use Zod v3 (`zod@^3.24`).** Do not use Zod v4 for this project — it was announced in 2025 but its ecosystem compatibility (especially with `zod-form-data`, `@hookform/resolvers`, and older tooling) is still settling. Zod v3 is the stable choice the entire ecosystem targets and is what Next.js official docs reference.

**Confidence:** MEDIUM — Zod v3 is definitively verified as the ecosystem standard from official Next.js docs referencing `zod.dev`. The v4 caution is based on release timing in training data; verify current npm `latest` tag before pinning.

### The Pattern — Route Handlers (JSON bodies)

This project uses route handlers exclusively (no server actions — all mutations are via `fetch()` from client components). The pattern for route handlers differs from server actions.

**Route handler pattern (for all POST routes in this app):**

```typescript
// lib/validation/defend.ts
import { z } from 'zod'

export const DefenseToolEnum = z.enum([
  'scope_change', 'payment_first', 'payment_second', 'payment_final',
  'revision_limit', 'kill_fee', 'delivery_signoff', 'dispute_response',
])

export const DefendRequestSchema = z.object({
  tool_type: DefenseToolEnum,
  situation: z.string().min(10, 'Describe the situation in at least 10 characters').max(2000),
  extra_context: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
})

export type DefendRequest = z.infer<typeof DefendRequestSchema>
```

```typescript
// In the route handler — replaces the bare `await request.json()` cast
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // ... auth checks first ...

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = DefendRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { tool_type, situation, extra_context } = parsed.data
  // tool_type is now narrowed to DefenseTool union — no cast needed
}
```

**Key rules for this codebase:**

1. Always `safeParse` (not `parse`) in route handlers. `parse` throws a `ZodError` that will bubble as an unhandled 500 — `safeParse` returns a discriminated union you control.
2. Use `.flatten().fieldErrors` for the error payload — it gives field-keyed error arrays that clients can display per-field.
3. Validate **before** any database or AI calls — the current defend route passes `tool_type` directly into a `Record<DefenseTool, string>` lookup with no validation, which will silently produce `undefined` for garbage input and then call Anthropic with a malformed prompt.
4. Define schemas in `lib/validation/` as named exports — not inline in route files. The same schema can then be used in client-side pre-validation via Zod's `z.infer<>` if needed.

### Route Handlers vs Server Actions — Key Difference

Server actions receive `FormData` (or direct arguments when called programmatically). The official Next.js pattern for server action validation is `schema.safeParse({ field: formData.get('field') })`. This project does **not** currently use server actions — it uses route handlers called via `fetch()`. Route handlers receive `request.json()` (a plain object), so the schema validates the full object. If server actions are added in future: use `zod-form-data` for FormData coercion, or call actions programmatically (non-form) and validate the typed arguments directly.

### Routes Requiring Zod Schemas

Based on codebase analysis, these POST routes need schemas added:

| Route | Fields to Validate | Critical Missing Guard |
|-------|-------------------|----------------------|
| `POST /api/projects` | `title` (string, 1-100), `client_name` (string, 1-100), `client_email` (email or empty), `project_value` (positive number or null), `currency` (enum: EUR/USD/GBP/etc), `notes` (string max 500) | Currently checks `!title \|\| !client_name` only — no length/type enforcement |
| `POST /api/projects/[id]/defend` | `tool_type` (enum), `situation` (string 10-2000), `extra_context` (record or undefined) | No validation at all — raw JSON goes into Anthropic prompt |
| `POST /api/contracts` | `title` (string), `contract_text` (string max ~50k or null) | Needs investigation to find exact route |
| `POST /api/webhooks/creem` | No Zod needed — this validates with HMAC signature + raw text body. Do not add Zod here. | Null check on `CREEM_WEBHOOK_SECRET` is the missing guard |

### What NOT to Use

- Do not use `zod-form-data` — this project uses JSON bodies, not FormData.
- Do not use `@t3-oss/env-nextjs` for this milestone — it's useful for env validation but out of scope for the hardening tasks.
- Do not validate with `class-validator` — it's already in the `devDependencies` transitive graph but Zod is the documented standard for Next.js App Router.

### Installation

```bash
npm install zod
```

(No dev dependency — schemas are used at runtime in route handlers.)

---

## Question 2: Atomic Usage Gating in Supabase

### The Problem — Existing Race Condition

The current defend route has a non-atomic read-then-write:

```typescript
// CURRENT CODE — RACE CONDITION
const { data: profile } = await supabase.from('user_profiles')
  .select('plan, defense_responses_used').eq('id', user.id).single()

if (profile?.plan === 'free' && (profile?.defense_responses_used ?? 0) >= 3) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
// ... AI call ...
await supabase.from('user_profiles')
  .update({ defense_responses_used: (profile.defense_responses_used ?? 0) + 1 })
  .eq('id', user.id)
```

Two concurrent requests both read `defense_responses_used = 2`, both see `< 3`, both call Anthropic (2x cost), both write `3`. A user can exceed the limit by firing concurrent requests.

### Recommendation: PostgreSQL RPC with FOR UPDATE

**Use a Supabase RPC (PostgreSQL function).** This is the correct solution — it runs atomically in the database transaction, with `SELECT ... FOR UPDATE` row locking to prevent concurrent increments.

**Confidence:** HIGH for the pattern — PostgreSQL row locking and atomic increments are established database primitives. The Supabase `rpc()` client call pattern is MEDIUM confidence (standard but not verified from current Supabase JS docs due to fetch restriction).

**Migration SQL — create this function in Supabase dashboard > SQL editor:**

```sql
CREATE OR REPLACE FUNCTION increment_defense_usage(p_user_id uuid, p_limit int)
RETURNS TABLE(success boolean, responses_used int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_used int;
BEGIN
  -- Lock the row for this transaction to prevent concurrent increments
  SELECT plan, defense_responses_used
  INTO v_plan, v_used
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- If free tier and at or above limit, return failure without incrementing
  IF v_plan = 'free' AND v_used >= p_limit THEN
    RETURN QUERY SELECT false, v_used;
    RETURN;
  END IF;

  -- Only increment for free tier (pro is unlimited)
  IF v_plan = 'free' THEN
    UPDATE user_profiles
    SET defense_responses_used = defense_responses_used + 1
    WHERE id = p_user_id;
    v_used := v_used + 1;
  END IF;

  RETURN QUERY SELECT true, v_used;
END;
$$;
```

**Client call in the route handler:**

```typescript
const { data, error } = await supabase.rpc('increment_defense_usage', {
  p_user_id: user.id,
  p_limit: 3,
})

if (error || !data?.[0]?.success) {
  return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}

// data[0].success === true — safe to proceed with Anthropic call
```

**Why this over alternatives:**

| Approach | Verdict | Reason |
|----------|---------|--------|
| Application-level (current) | NO | Non-atomic read-then-write — exploitable |
| DB trigger on defense_responses insert | MAYBE | Complicates the schema, hard to return early before AI call |
| Supabase RPC with FOR UPDATE | YES | Atomic, returns result, blocks AI call if limit hit |
| Optimistic locking (check version column) | NO | Still two round-trips, still a race between check and update |

**SECURITY DEFINER note:** The function runs with the privileges of its creator (service role equivalent), bypassing RLS for this specific atomic update. This is correct and safe here — the function is narrowly scoped to the user's own row and parameterized by `p_user_id`, which is always `user.id` from the server-side auth check. Do not expose this RPC to the anon key via a client-side call without re-verifying auth inside the function.

**Apply the same pattern to contracts:** The `contracts_used` counter has the same race condition. A parallel function `increment_contract_usage(p_user_id uuid, p_limit int)` should be created with the same structure.

---

## Question 3: Security Headers in next.config.ts

### Recommendation

Use `next.config.ts` static headers for all non-nonce headers. Do **not** implement nonce-based CSP for this milestone — it requires all pages to be dynamically rendered (forcing SSR on every request, disabling CDN caching), is incompatible with Partial Prerendering, and is disproportionate for a v1 SaaS with no inline scripts.

Use the `next.config.ts` static approach with `'unsafe-inline'` on `script-src` and `style-src`. This is what the official Next.js docs document as the "Without Nonces" path.

**Confidence:** HIGH — sourced directly from Next.js 16.2.4 official docs.

### Full next.config.ts

```typescript
import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === 'development'

// External domains needed by this app
// - Supabase for auth and storage
// - Anthropic API calls happen server-side (no connect-src needed for client)
// - Creem payment iframes (if any redirect pages use them)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' ${SUPABASE_URL} https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'Strict-Transport-Security',
            // 2 years, include subdomains, eligible for preload list
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            // Belt-and-suspenders alongside frame-ancestors 'none' in CSP
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            // Sends full URL to same origin, only origin to cross-origin HTTPS
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // This app uses no camera/mic/geo; disable all
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Header rationale:**

| Header | Value | Why |
|--------|-------|-----|
| `Content-Security-Policy` | Static with `unsafe-inline` | Blocks XSS from external origins while allowing Next.js inline scripts. No nonce = static pages can still be cached. |
| `Strict-Transport-Security` | 63072000 (2yr) | Forces HTTPS; `preload` allows submission to browser preload lists. Only set once on Vercel (it may already add HSTS). |
| `X-Frame-Options: DENY` | DENY | Belt-and-suspenders over `frame-ancestors 'none'` CSP for older browsers |
| `X-Content-Type-Options` | nosniff | Prevents MIME-sniffing attacks on uploads (relevant given contract PDF uploads) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Protects project/client URLs from leaking in Referer headers to third parties |
| `Permissions-Policy` | all disabled | This app has zero need for device APIs; deny everything |
| `poweredByHeader: false` | — | Removes `X-Powered-By: Next.js` fingerprinting |

**What NOT to add:**

- Do not add `X-XSS-Protection: 1; mode=block` — it is deprecated and can introduce vulnerabilities in older IE browsers; CSP supersedes it.
- Do not add nonce-based CSP for this milestone — the performance/caching tradeoff is not worth it at v1 scale.
- Do not whitelist `creem.io` or `stripe.com` in `frame-src` unless the checkout redirect embeds an iframe — Creem typically redirects to its own domain rather than embedding.

**Vercel-specific note:** Vercel automatically adds HSTS on its managed domains. The explicit HSTS header here is still correct for custom domains and self-hosting compatibility.

---

## Question 4: Resend Transactional Email Pattern

### Existing State

`resend@^6.12.2` is installed in `package.json` but nothing is wired. The Creem webhook handler is the natural trigger for upgrade emails (fires on `subscription.active`). The auth callback is the trigger for welcome emails.

### Recommendation

**Use Resend with `@react-email/components` for templates.** Do not write raw HTML email strings — they are unmaintainable and HTML email compatibility is a specialty. React Email gives component-based templates that render to compatible HTML automatically.

**Confidence:** MEDIUM — Resend + React Email is the documented standard pairing; package versions from training data, verify current before installing.

### Packages

```bash
npm install resend @react-email/components
```

- `resend` — already installed (`^6.12.2`)
- `@react-email/components` — the official component library (Html, Head, Body, Container, Text, Button, Hr, etc.) — current version is `^0.0.x`, verify latest on npm

Do **not** install `react-email` (the preview server CLI) as a production dependency — it's a devDependency for local preview only:

```bash
npm install -D react-email
```

### Email Template Pattern

```typescript
// emails/welcome.tsx
import {
  Html, Head, Body, Container, Text, Button, Hr, Heading
} from '@react-email/components'

interface WelcomeEmailProps {
  userName: string
}

export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Welcome to Pushback</Heading>
          <Text>Hi {userName},</Text>
          <Text>
            You now have 3 free AI-powered responses and 1 contract analysis to use.
            When you're ready for unlimited access, upgrade to Pro.
          </Text>
          <Button href="https://pushback.app/dashboard" style={{ backgroundColor: '#000', color: '#fff', padding: '12px 24px' }}>
            Go to Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

```typescript
// emails/upgrade.tsx
import { Html, Head, Body, Container, Text, Heading } from '@react-email/components'

interface UpgradeEmailProps {
  userName: string
}

export default function UpgradeEmail({ userName }: UpgradeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>You're now on Pushback Pro</Heading>
          <Text>Hi {userName},</Text>
          <Text>
            Unlimited AI responses and contract analyses are now active on your account.
            Thank you for upgrading.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Sending Pattern

```typescript
// lib/email.ts
import { Resend } from 'resend'
import { render } from '@react-email/components'
import WelcomeEmail from '@/emails/welcome'
import UpgradeEmail from '@/emails/upgrade'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pushback <hello@pushback.app>'

export async function sendWelcomeEmail(to: string, userName: string) {
  const html = await render(WelcomeEmail({ userName }))
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Pushback',
    html,
  })
}

export async function sendUpgradeEmail(to: string, userName: string) {
  const html = await render(UpgradeEmail({ userName }))
  return resend.emails.send({
    from: FROM,
    to,
    subject: "You're on Pushback Pro",
    html,
  })
}
```

### Integration Points

**Welcome email** — trigger in the Supabase auth callback route (after the user is confirmed and the session is exchanged):

```typescript
// app/auth/callback/route.ts — after session exchange succeeds
const { data: { user } } = await supabase.auth.getUser()
if (user?.email) {
  await sendWelcomeEmail(user.email, user.user_metadata?.full_name ?? 'there')
}
```

Send errors must be caught and ignored — never let an email failure block the auth flow.

**Upgrade email** — trigger in the Creem webhook handler, in the `subscription.active` branch:

```typescript
// app/api/webhooks/creem/route.ts
if (eventType === 'subscription.active' || eventType === 'subscription.updated') {
  // ... existing DB update ...
  
  // Fetch user email — service role client bypasses RLS
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single()
  
  if (profile?.email) {
    // Fire and forget — don't await in the critical path
    sendUpgradeEmail(profile.email, '').catch(() => {})
  }
}
```

### Environment Variable

Add `RESEND_API_KEY` to `.env.local` and Vercel environment variables. Get from resend.com dashboard.

### What NOT to Do

- Do not use `nodemailer` — no transactional email SaaS, complex SMTP config, not needed.
- Do not use `@sendgrid/mail` — Resend is already installed and is the modern standard.
- Do not render emails inline in route handlers — keep templates in `/emails/` directory.
- Do not block the auth callback on email send — wrap in try/catch and continue regardless of email result.

---

## Question 5: Supabase Type Generation

### The Problem

The codebase has multiple `as any` casts on Supabase queries, particularly on embedded/joined queries. The worst is in the defend route:

```typescript
// Current — type-unsafe
const contractContext = (project.contracts as any)?.analysis
  ? `...${JSON.stringify((project.contracts as any).analysis, null, 2)}`
  : '...'
```

And the GET projects route returns `data` with inferred `any` on the joined `contracts` column.

### Recommendation

**Use the Supabase CLI type generation workflow.** This generates a `database.types.ts` file from your live schema, which you pass as the generic type parameter to `createClient`. From that point, `.from('projects').select('*, contracts(*)')` gives you fully-typed results including the embedded relationship.

**Confidence:** MEDIUM — this is the documented Supabase pattern from training data. The CLI commands have been stable across Supabase versions; verify against current `supabase-js` docs before running.

### Step 1 — Install and authenticate Supabase CLI

```bash
npm install -D supabase
npx supabase login
```

### Step 2 — Generate types

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public \
  > types/database.types.ts
```

Find `YOUR_PROJECT_ID` in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-id>`.

Add this as a `package.json` script:

```json
"scripts": {
  "gen:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/database.types.ts"
}
```

Run `npm run gen:types` after any schema migration.

### Step 3 — Typed Supabase client

```typescript
// lib/supabase/server.ts — update to pass the Database type
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
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
```

### Step 4 — Typed joined queries

The key insight: with the `Database` generic on the client, Supabase JS infers return types for simple selects automatically. For **embedded relationships** (joined rows via foreign key), the inferred type includes the joined table as a nested object or array.

For the defend route's `select('id, title, client_name, project_value, currency, notes, contracts(analysis)')` query — after type generation, `project.contracts` will be typed as the contracts row shape (or `null`). No more `as any`.

**For complex joined shapes that TypeScript can't infer automatically**, use the `QueryResult` helper:

```typescript
import type { QueryResult, QueryData } from '@supabase/supabase-js'

// Construct the query (don't await yet)
const projectsWithContractsQuery = supabase
  .from('projects')
  .select('*, contracts(risk_score, risk_level, analysis)')

// Extract the inferred type
type ProjectsWithContracts = QueryData<typeof projectsWithContractsQuery>

// Use in your handler
const { data, error } = await projectsWithContractsQuery
// data is now typed as ProjectsWithContracts | null
```

This `QueryData<>` utility is available from `@supabase/supabase-js` v2 and infers the full joined shape including any embedded relationships.

**Applying to the defend route:**

```typescript
// Before (with as any)
const contractContext = (project.contracts as any)?.analysis

// After (typed — project.contracts.analysis is ContractAnalysis | null)
const contractContext = project.contracts?.analysis
  ? `\n\nCONTRACT DATA:\n${JSON.stringify(project.contracts.analysis, null, 2)}`
  : '\n\n(No contract — do not reference or invent contract terms)'
```

### What NOT to Do

- Do not manually maintain the `Database` type file — always regenerate from the live schema.
- Do not add `as any` to fix TypeScript errors in Supabase queries — this is always a symptom of either missing type generation or an incorrect select shape.
- Do not use `createClient` from `@supabase/supabase-js` directly (without the `Database` generic) in any route handler — only use the typed factory from `lib/supabase/server.ts`.
- Do not use `supabase-js` v1 — the `QueryData<>` helper requires v2.

---

## Existing Stack — Current Version Summary

All versions from `package.json` (verified by direct file read):

| Package | Current Version | Status |
|---------|----------------|--------|
| `next` | 16.2.4 | Stable |
| `react` / `react-dom` | 19.2.4 | Stable |
| `@anthropic-ai/sdk` | ^0.90.0 | Stable |
| `@supabase/ssr` | ^0.10.2 | Stable |
| `@supabase/supabase-js` | ^2.104.1 | Stable |
| `resend` | ^6.12.2 | Installed, unwired |
| `typescript` | ^5 | Stable |

## New Packages Needed for Hardening

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `zod` | `^3.24` | Input validation on all POST routes | `npm install zod` |
| `@react-email/components` | latest | Email template components | `npm install @react-email/components` |
| `react-email` | latest | Local email preview (dev only) | `npm install -D react-email` |
| `supabase` (CLI) | latest | Type generation | `npm install -D supabase` |

No other new packages needed. The Supabase RPC is implemented in SQL (no new JS library). Security headers are implemented in `next.config.ts` (no library).

---

## Sources

- Next.js 16.2.4 route handler docs: https://nextjs.org/docs/app/api-reference/file-conventions/route (verified)
- Next.js 16.2.4 headers config: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers (verified)
- Next.js 16.2.4 CSP guide: https://nextjs.org/docs/app/guides/content-security-policy (verified)
- Next.js 16.2.4 data security guide: https://nextjs.org/docs/app/guides/data-security (verified)
- Next.js 16.2.4 forms/server actions guide: https://nextjs.org/docs/app/guides/forms (verified)
- Codebase direct analysis: defend route, projects route, webhook route, supabase client, types, middleware, package.json (all verified via Read tool)
- Zod, Supabase type gen, Resend/React Email patterns: MEDIUM confidence (training data, official docs inaccessible due to tool restrictions — verify versions before installing)
