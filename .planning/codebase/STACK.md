# Technology Stack

**Analysis Date:** 2026-04-23

## Languages

**Primary:**
- TypeScript 5.x - All source files (`app/`, `lib/`, `components/`, `types/`)
- SQL - Database migrations (`supabase/migrations/`)

**Secondary:**
- CSS - Global styles via Tailwind v4 CSS-first config (`app/globals.css`)

## Runtime

**Environment:**
- Node.js v25.x (confirmed from local environment)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- Next.js 16.2.4 - App Router, RSC, API routes
  - NOTE: This is Next.js 16, not 15. Read `node_modules/next/dist/docs/` before modifying Next internals — APIs may differ from Next.js 14/15 training data.
  - Route params are now Promises: `{ params }: { params: Promise<{ id: string }> }` — must `await params`
  - `cookies()` from `next/headers` is async — must be awaited
- React 19.2.4 - UI rendering
- React DOM 19.2.4

**Styling:**
- Tailwind CSS 4.x (CSS-first config, no `tailwind.config.ts` file)
  - Config lives in `app/globals.css` via `@theme inline` blocks
  - PostCSS plugin: `@tailwindcss/postcss` (`postcss.config.mjs`)
  - Animation: `tw-animate-css` ^1.4.0
- `class-variance-authority` ^0.7.1 - Component variant management
- `clsx` ^2.1.1 + `tailwind-merge` ^3.5.0 - Class composition via `cn()` in `lib/utils.ts`

**Component Library:**
- shadcn/ui (style: `base-nova`, RSC-enabled)
  - Components: `@/components/ui`
  - Config: `components.json`
  - Icon library: `lucide-react` ^1.9.0
- `@base-ui/react` ^1.4.1 - Primitive UI components (underlying shadcn primitives)
- `sonner` ^2.0.7 - Toast notifications
- `next-themes` ^0.4.6 - Dark/light mode theming

**Animation:**
- `gsap` ^3.15.0 - GSAP animation library

**Build/Dev:**
- ESLint 9.x with `eslint-config-next` 16.2.4 (`eslint.config.mjs`, flat config format)
- TypeScript compiler (no separate build step, Next.js handles transpilation)

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` ^0.90.0 - Claude AI API client. Used for contract analysis and defense message generation. Client initialized in `lib/anthropic.ts`. Model: `claude-sonnet-4-6`.
- `@supabase/supabase-js` ^2.104.1 - Supabase database and auth client
- `@supabase/ssr` ^0.10.2 - Supabase SSR helpers for Next.js (cookie-based sessions)
- `resend` ^6.12.2 - Transactional email sending

**Infrastructure:**
- `shadcn` ^4.4.0 - CLI for adding shadcn components

## Configuration

**Environment:**
- Configured via `.env.local` (see `.env.local.example` for all required vars)
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server only, secret)
  - `ANTHROPIC_API_KEY` — Anthropic API key (server only, secret)
  - `STRIPE_SECRET_KEY` — Stripe secret key (server only, secret)
  - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (server only, secret)
  - `STRIPE_PRICE_ID` — Stripe Price ID for Pro plan (server only, secret)
  - `RESEND_API_KEY` — Resend email API key (server only, secret)
  - `RESEND_FROM_EMAIL` — Sender address for transactional emails (server only)
  - `NEXT_PUBLIC_APP_URL` — Base app URL, e.g. `http://localhost:3000` (public)

**TypeScript:**
- `tsconfig.json`: strict mode, target ES2017, bundler module resolution
- Path alias: `@/*` maps to project root `./*`
- Incremental compilation enabled

**Build:**
- `next.config.ts` — minimal config, no custom settings currently
- PostCSS: `postcss.config.mjs` using `@tailwindcss/postcss`

## Platform Requirements

**Development:**
- Node.js (v25.x confirmed locally; no `.nvmrc` present)
- npm (lockfileVersion 3)
- Supabase project (cloud or local CLI)

**Production:**
- Deployment target: Any Node.js-capable platform (Vercel recommended for Next.js)
- Supabase cloud database
- Environment variables must be set in host platform

---

*Stack analysis: 2026-04-23*
