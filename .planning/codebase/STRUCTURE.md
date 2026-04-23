# Codebase Structure

**Analysis Date:** 2026-04-23

## Directory Layout

```
pushback/
├── app/                        # Next.js App Router root
│   ├── (auth)/                 # Route group: unauthenticated auth pages (no layout shared)
│   │   ├── login/page.tsx      # Email/password + Google OAuth login
│   │   └── signup/page.tsx     # New account registration
│   ├── (dashboard)/            # Route group: authenticated app shell
│   │   ├── layout.tsx          # Auth guard + Navbar composition for all dashboard routes
│   │   ├── dashboard/page.tsx  # Post-login home / overview
│   │   ├── projects/
│   │   │   ├── page.tsx        # Project list
│   │   │   ├── new/page.tsx    # Create project form
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Project detail + DefenseDashboard
│   │   │       └── history/page.tsx  # Response history for a project
│   │   ├── contracts/
│   │   │   ├── page.tsx        # Contract list
│   │   │   ├── new/page.tsx    # Upload/paste + analyze contract
│   │   │   └── [id]/page.tsx   # Contract analysis report
│   │   └── settings/page.tsx   # Account settings, plan management
│   ├── api/                    # Route Handlers (server-only, never rendered)
│   │   ├── checkout/route.ts   # POST: create Creem checkout session
│   │   ├── contracts/
│   │   │   ├── analyze/route.ts        # POST: upload + AI-analyze contract
│   │   │   └── [id]/route.ts           # GET, DELETE: single contract
│   │   ├── projects/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH, DELETE single project
│   │   │       └── defend/route.ts     # POST: generate defense message via AI
│   │   ├── responses/
│   │   │   └── [id]/route.ts           # PATCH: update was_copied / was_sent flags
│   │   └── webhooks/
│   │       └── creem/route.ts          # POST: Creem subscription webhook
│   ├── auth/
│   │   └── callback/route.ts   # GET: OAuth code exchange, redirect to /dashboard
│   ├── layout.tsx              # Root layout: fonts, global CSS, Toaster
│   ├── page.tsx                # Landing page (marketing, pricing)
│   └── globals.css             # Global styles + CSS custom properties (design tokens)
├── components/
│   ├── contract/               # Contract analysis UI
│   │   ├── ClauseCard.tsx      # Single flagged clause display
│   │   ├── ContractUploader.tsx # File upload / paste form → POST /api/contracts/analyze
│   │   ├── RiskReport.tsx      # Full analysis result view
│   │   └── RiskScoreBadge.tsx  # Inline risk level pill
│   ├── defense/                # Defense tool UI (core product)
│   │   ├── DefenseDashboard.tsx # Orchestrator: tool selection → situation → response
│   │   ├── DefenseToolCard.tsx  # Single tool button card
│   │   ├── ResponseHistory.tsx  # Past responses list
│   │   ├── ResponseOutput.tsx   # Generated message display + copy/send actions
│   │   └── SituationPanel.tsx   # Context fields form for selected tool
│   ├── hero/
│   │   └── PushbackHero.tsx    # Landing page WebGL/shader hero section
│   ├── project/
│   │   ├── NewProjectForm.tsx   # Create project form
│   │   └── ProjectCard.tsx      # Project list item
│   ├── shared/                 # Cross-feature components
│   │   ├── CopyButton.tsx       # Clipboard copy with feedback
│   │   ├── Navbar.tsx           # Sidebar (desktop) + bottom bar (mobile)
│   │   └── UpgradePrompt.tsx    # Free-limit hit → upgrade CTA
│   └── ui/                     # Primitive UI components
│       ├── button.tsx           # shadcn/ui Button
│       └── sonner.tsx           # Toast provider wrapper
├── lib/                        # Shared server/client utilities
│   ├── supabase/
│   │   ├── client.ts           # createClient() — browser Supabase client
│   │   └── server.ts           # createServerSupabaseClient() / createServiceSupabaseClient()
│   ├── anthropic.ts            # Anthropic singleton + system prompt constants
│   ├── creem.ts                # createCheckoutSession() helper
│   ├── defenseTools.ts         # DEFENSE_TOOLS metadata array, URGENCY_COLORS
│   ├── plans.ts                # PLANS constant (limits per tier)
│   └── utils.ts                # Shared utility functions (cn, etc.)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql     # Full schema: tables, RLS policies, auth trigger
├── types/
│   └── index.ts                # All shared TypeScript types (single file)
├── public/                     # Static assets
├── middleware.ts               # Edge middleware: auth redirect logic
├── next.config.ts              # Next.js config (minimal)
├── tsconfig.json               # TypeScript config with @/* path alias
├── components.json             # shadcn/ui config
├── eslint.config.mjs           # ESLint config
└── postcss.config.mjs          # PostCSS / Tailwind config
```

## Directory Purposes

**`app/(auth)/`:**
- Purpose: Login and signup pages with no shared chrome
- Contains: Client Components only (form state, Supabase browser client calls)
- Key files: `login/page.tsx`, `signup/page.tsx`

**`app/(dashboard)/`:**
- Purpose: All authenticated app pages sharing the Navbar layout
- Contains: Async Server Components that fetch from Supabase and pass data to Client Components
- Key files: `layout.tsx` (auth gate + profile fetch)

**`app/api/`:**
- Purpose: Backend mutation surface and AI integration. Never imported by pages — only called via fetch.
- Contains: Route Handlers with auth check, plan enforcement, Supabase/Anthropic calls
- Pattern: Every handler starts with `getUser()` check before any logic

**`components/defense/`:**
- Purpose: The core product UI — 3-step flow (pick tool → describe situation → get message)
- Key files: `DefenseDashboard.tsx` orchestrates the flow; sub-components handle each step

**`components/contract/`:**
- Purpose: Contract upload and analysis result display
- Key files: `ContractUploader.tsx` (upload/paste form), `RiskReport.tsx` (full results view)

**`lib/`:**
- Purpose: Shared business logic and service clients, safe to import from both server and client contexts with care
- Note: `lib/supabase/server.ts` and `lib/anthropic.ts` are server-only. `lib/supabase/client.ts` is browser-only. `lib/defenseTools.ts` and `lib/plans.ts` are isomorphic.

**`types/index.ts`:**
- Purpose: Single source of truth for all TypeScript types. Import all types from `@/types`.
- Contains: Domain types (`Project`, `Contract`, `DefenseResponse`, `UserProfile`), AI output types (`ContractAnalysis`, `FlaggedClause`), union types (`DefenseTool`, `RiskLevel`, `Plan`)

**`supabase/migrations/`:**
- Purpose: Versioned SQL schema applied to Supabase project
- Generated: No (hand-authored)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Public landing page
- `app/(dashboard)/layout.tsx`: Authenticated app shell entry
- `middleware.ts`: Edge auth enforcement
- `app/auth/callback/route.ts`: OAuth callback handler

**Configuration:**
- `tsconfig.json`: TypeScript with `@/*` path alias mapping to project root
- `components.json`: shadcn/ui component registry config
- `next.config.ts`: Next.js config (currently empty/default)
- `supabase/migrations/001_initial.sql`: Complete database schema

**Core Logic:**
- `lib/anthropic.ts`: All AI system prompts + Anthropic client singleton
- `lib/defenseTools.ts`: Defense tool metadata array (labels, icons, context fields, urgency)
- `lib/plans.ts`: Plan tier limits
- `app/api/projects/[id]/defend/route.ts`: Defense message generation endpoint
- `app/api/contracts/analyze/route.ts`: Contract analysis endpoint

**Types:**
- `types/index.ts`: All types — import exclusively from `@/types`

## Naming Conventions

**Files:**
- Page files: always `page.tsx` (App Router convention)
- API files: always `route.ts` (App Router convention)
- Components: PascalCase matching the exported component name (e.g., `DefenseDashboard.tsx`)
- Lib files: camelCase (e.g., `defenseTools.ts`, `anthropic.ts`)

**Directories:**
- Route groups: lowercase with parentheses `(auth)`, `(dashboard)`
- Dynamic segments: bracket notation `[id]`
- Component subdirectories: lowercase domain name (`defense/`, `contract/`, `shared/`)

**Exports:**
- One default export per component file, named matching the file
- Named exports for constants and utilities in `lib/` files

## Where to Add New Code

**New dashboard page:**
- Add directory under `app/(dashboard)/[feature]/`
- Create `page.tsx` as async Server Component
- Fetch data with `createServerSupabaseClient()` before rendering

**New API endpoint:**
- Add `route.ts` under `app/api/[resource]/` or `app/api/[resource]/[id]/`
- Always start with `getUser()` auth check
- Enforce plan limits before any external API call

**New feature component:**
- Create subdirectory under `components/[feature]/` if more than one component
- Single components go into the most relevant existing subdirectory
- Shared components (used across features) go in `components/shared/`

**New type:**
- Add to `types/index.ts` only — do not create additional type files

**New lib utility:**
- Isomorphic (safe anywhere): add to `lib/utils.ts` or new file in `lib/`
- Server-only (uses `cookies()`, `process.env` secrets): add to `lib/supabase/server.ts` or new server-only file
- Client-only (uses browser APIs): clearly name or co-locate with component

**New database table:**
- Add migration as `supabase/migrations/002_[description].sql`
- Always include RLS policy: `create policy "Own X only" on public.[table] for all using (auth.uid() = user_id)`
- Add corresponding TypeScript type to `types/index.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents and codebase maps
- Generated: By GSD commands
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and dev cache
- Generated: Yes
- Committed: No

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-04-23*
