# Coding Conventions

**Analysis Date:** 2026-04-23

## Naming Patterns

**Files:**
- React components: PascalCase matching their default export — `DefenseDashboard.tsx`, `RiskScoreBadge.tsx`, `NewProjectForm.tsx`
- Route handlers: always `route.ts` inside the Next.js app-router directory
- Lib modules: camelCase — `defenseTools.ts`, `anthropic.ts`, `plans.ts`
- Type file: single barrel `types/index.ts`
- Supabase clients: `client.ts` (browser) and `server.ts` (server-side) inside `lib/supabase/`

**Functions:**
- Event handlers: `handle` prefix — `handleSubmit`, `handleSignOut`, `handleGenerate`, `handleCopy`, `handleMarkSent`
- Setters / simple actions: short descriptive names — `selectTool`, `handleRegenerate`
- Async API route exports: HTTP verb as name — `GET`, `POST`, `DELETE`, `PATCH`
- Lib factory functions: `create` prefix — `createServerSupabaseClient`, `createServiceSupabaseClient`, `createClient`, `createCheckoutSession`

**Variables:**
- camelCase throughout — `selectedTool`, `responsesUsed`, `extraContext`, `inputStyle`
- Constants defined at module scope: UPPER_SNAKE_CASE — `DEFENSE_TOOLS`, `TOOL_LABELS`, `FREE_LIMIT`, `CURRENCIES`, `NAV_ITEMS`, `LEVEL_COLORS`
- Record/map lookup objects: UPPER_SNAKE_CASE — `RISK_LABEL`, `RISK_COLORS`, `URGENCY_COLORS`, `LEVEL_LABEL`

**Types / Interfaces:**
- Domain types: PascalCase type aliases in `types/index.ts` — `UserProfile`, `Project`, `Contract`, `DefenseResponse`, `ContractAnalysis`
- Component prop interfaces: `{ComponentName}Props` — `DefenseDashboardProps`, `NavbarProps`, `RiskScoreBadgeProps`, `SituationPanelProps`
- Union/literal types: lowercase string literals — `'free' | 'pro'`, `'low' | 'medium' | 'high' | 'critical'`

## Code Style

**Formatting:**
- No Prettier config present. The codebase uses a consistent implicit style enforced via `eslint-config-next` + TypeScript strict mode.
- Indentation: 2 spaces
- Quotes: single quotes for strings in `.ts`/`.tsx` files
- Semicolons: omitted (no-semicolon style) — consistent throughout all source files
- Trailing commas: used in multi-line arrays and objects

**Linting:**
- ESLint 9 flat-config via `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No additional custom rules beyond next defaults
- Run with: `npm run lint` (invokes `eslint` directly, no path argument — scans project root)

**TypeScript:**
- `strict: true` in `tsconfig.json` — all strict checks enabled
- Non-null assertion (`!`) used on env vars: `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- Occasional `as any` cast used for Supabase join shapes: `(project.contracts as any)?.analysis` — acceptable workaround for untyped relational results
- `Promise<{ id: string }>` for Next.js 15+ dynamic route params (async params pattern)

## Import Organization

**Order (observed pattern):**
1. External packages / Next.js internals — `import { redirect } from 'next/navigation'`, `import { useState } from 'react'`
2. Internal lib utilities — `import { createServerSupabaseClient } from '@/lib/supabase/server'`
3. Types — `import { UserProfile, Project } from '@/types'`
4. Components — `import DefenseDashboard from '@/components/defense/DefenseDashboard'`

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- All internal imports use `@/` — never relative paths like `../../components`

## Inline Styles Pattern

All UI styling is done with inline `style` objects — no CSS modules, no Tailwind utility classes for layout (Tailwind classes used only for interaction states and responsive breakpoints).

**Shared style objects extracted to constants:**
```tsx
const inputStyle = {
  width: '100%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
  borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text-primary)',
  fontSize: '0.9rem', outline: 'none',
}
```

**Tailwind classes used only for:**
- Hover states: `className="hover:text-white transition-colors"`
- Responsive visibility: `className="hidden md:flex"`, `className="md:hidden"`, `className="md:pb-0"`
- Specific hardcoded values: `className="hover:bg-[#1a1a1a]"`

**CSS variables for design tokens** (used everywhere via `var(--token-name)`):
- `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-border`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--brand-amber`, `--brand-amber-dim`, `--brand-green`, `--brand-green-dim`
- `--urgency-low`, `--urgency-medium`, `--urgency-high`, `--urgency-high-dim`
- `--font-inter`, `--font-mono`

**Focus ring pattern (consistent across all inputs):**
```tsx
onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
```

## Component Patterns

**Server vs Client split:**
- Server Components (no directive): page files, layout files, API routes
- Client Components (`'use client'` at top): any component with state, event handlers, or browser APIs
- `'use client'` is always the very first line — no imports before it

**Component exports:**
- All components use `export default function ComponentName` — named exports reserved for types and constants
- No barrel files for components — each component imported directly by path

**Props:**
- Always typed via a local `interface {Name}Props` defined above the component function
- Optional props use `?` — `projectId?: string`, `responseId?: string`
- Plan types passed as `'free' | 'pro'` literal union, not the `Plan` type alias (inconsistency to be aware of)

**Form pattern:**
```tsx
const [form, setForm] = useState({ field: '' })
function set(key: string, value: string) {
  setForm(f => ({ ...f, [key]: value }))
}
// onChange: e => set('field', e.target.value)
```

## Error Handling

**API routes:**
- Auth check first: `if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
- Use `Response.json()` (native Web API) — not `NextResponse.json()`
- DB errors returned as `{ error: error.message }` with status 500
- Validation errors with status 400: `{ error: 'field is required' }`
- Plan limit errors use sentinel string: `{ error: 'UPGRADE_REQUIRED' }` with status 403

**Client components:**
- Local `error` state string displayed inline above the form
- Error from API: `data.error ?? 'Something went wrong'`
- Fire-and-forget fetches (analytics): `.catch(() => {})` to silence errors silently
- No global error boundary present

**Try/catch usage:**
- Only in routes where the operation can throw unpredictably (Anthropic SDK calls, Creem API)
- On catch: update DB status to `'error'`, `console.error(...)`, return 500
- Silent try/catch in Supabase server client's `setAll` cookie handler to handle Server Component read-only contexts

## Logging

**Framework:** `console.error` only

**When used:**
- Inside `catch` blocks in API routes: `console.error('Contract analysis error:', err)`
- No structured logging, no log levels beyond error

## Comments

**Style:** Sparse — only used for section labels within large JSX blocks
```tsx
{/* Mode toggle */}
{/* Desktop sidebar */}
{/* Mobile bottom bar */}
{/* Header */}
```
No JSDoc/TSDoc annotations anywhere. Self-documenting names preferred over comments.

## Module Design

**Lib modules export pattern:**
- Named exports for constants and functions: `export const anthropic`, `export const DEFENSE_TOOLS`, `export async function createServerSupabaseClient`
- No default exports from lib files
- Prompt strings exported as named constants from `lib/anthropic.ts`: `CONTRACT_ANALYSIS_SYSTEM_PROMPT`, `DEFENSE_SYSTEM_PROMPT`

**Data constants in lib vs components:**
- Domain-level constants (defense tools metadata, plans config) live in `lib/` — `lib/defenseTools.ts`, `lib/plans.ts`
- UI-only constants (style objects, local maps) defined inline in the component where used

---

*Convention analysis: 2026-04-23*
