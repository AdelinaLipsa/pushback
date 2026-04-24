---
status: complete
date: 2026-04-24
scope: clean-code + reusability
---

# Clean Code Audit — Pushback

## Critical (fix before next phase)

| File | Line | Issue | Recommendation |
|------|------|-------|----------------|
| `components/defense/ResponseHistory.tsx` | 12–21 | `TOOL_LABELS` re-declared locally. The identical constant (same keys, similar values) also lives in `app/api/projects/[id]/defend/route.ts:7`. Two sources of truth for the same enum-label map — they'll drift. | Move to `lib/defenseTools.ts` alongside `DEFENSE_TOOLS` (the authoritative source). Export `TOOL_LABELS` from there and import it in both places. |
| `components/defense/DefenseDashboard.tsx` | 30–38 | `handleUpgrade` is copy-pasted verbatim into **three** components: `DefenseDashboard.tsx:30`, `ResponseHistory.tsx:27`, and `UpgradePrompt.tsx:14`. All three do the same `fetch('/api/checkout', { method: 'POST' })` → redirect pattern. | Extract to `lib/checkout.ts`: `export async function startCheckout(setLoading: (v: boolean) => void)`. Import it in all three. |
| `app/(dashboard)/dashboard/page.tsx` | 55–82 | Empty-state + project list block is **identical** to `app/(dashboard)/projects/page.tsx:34–63`. Both render the same `🛡` empty state, same "No projects yet" copy, same `New Project →` link styles, and the same `ProjectCard` list. | Extract a `<ProjectList projects={...} />` server component. Both pages render it. |
| `components/defense/SituationPanel.tsx` | 28–32 | Defines a local `inputStyle` object that duplicates `lib/ui.ts:inputStyle` exactly, except it adds `resize: 'vertical'`. The local one shadows the shared import — `lib/ui.ts` is never imported here. | Import `inputStyle` from `lib/ui.ts` and spread it with the textarea-only `resize` addition: `style={{ ...inputStyle, resize: 'vertical' as const }}`. Same fix for the `input` usage on line 84 which already does this correctly. |
| `components/project/NewProjectForm.tsx` | 49–57 | Redefines `inputStyle` and `labelStyle` identically to `lib/ui.ts`. Never imports from `lib/ui.ts`. | Remove the local redeclarations. Add `import { inputStyle, labelStyle } from '@/lib/ui'`. |
| `components/contract/ContractUploader.tsx` | 53–57 | Same — local `inputStyle` that matches `lib/ui.ts` exactly. Never imports from `lib/ui`. | Same fix as above. |

## Moderate (should fix soon)

| File | Line | Issue | Recommendation |
|------|------|-------|----------------|
| `components/defense/DefenseDashboard.tsx` | 108 | Uses `var(--brand-amber)` for the hint arrow `↑`. User preference (memory: `feedback_lime_color.md`) established that Phase 4 accent is **lime**, not amber. Same issue in `DefenseToolCard.tsx:21,22,54` and `ResponseOutput.tsx:34` — all use amber in the defense/Phase 4 UI. | Replace `var(--brand-amber)` with `var(--brand-lime)` in all defense component accents. `btnStyles.primary` in `lib/ui.ts:33` also still uses amber — update it so any component using the shared button picks up lime automatically. |
| `components/defense/SituationPanel.tsx` | 68–69, 85–86 | `onFocus`/`onBlur` imperative border-color toggle uses `var(--brand-amber)`. `ProjectHeader.tsx` (which imports from `lib/ui.ts`) correctly uses `var(--brand-lime)` for focus. The two older components (SituationPanel, ContractUploader) still use amber. | Standardise to `var(--brand-lime)` and consider adding a `focusStyle` export to `lib/ui.ts` to make this a single source: `export const focusBorderColor = 'var(--brand-lime)'`. |
| `app/(dashboard)/contracts/page.tsx` | 6–11 | Defines its own `RISK_COLORS` map. Identical or near-identical versions exist in `ProjectCard.tsx:8`, `app/(dashboard)/projects/[id]/page.tsx:9`, and `ClauseCard.tsx:10`. **Four separate copies** of the same risk-level → color mapping. | Export a canonical `RISK_COLORS` from `lib/ui.ts` (or `types/index.ts`). `ClauseCard` needs a slightly richer shape; export two: `riskColor(level)` (string) and `riskColors(level)` (object with border/badge/badgeText) — or a single rich map that all consumers index into. |
| `components/shared/UpgradePrompt.tsx` | 43–49 | Inline button styles duplicate `btnStyles.primary` from `lib/ui.ts` but use `padding: '0.7rem 1.5rem'` instead of `'0.75rem 1.5rem'` — a subtle inconsistency. `ResponseHistory.tsx:111–119` has the same drift. Both already import-eligible via `btnStyles.primary`. | Use `style={btnStyles.primary}` (already available). Override only the props that genuinely differ (opacity, cursor on `disabled`) with a spread: `style={{ ...btnStyles.primary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}`. |
| `lib/email.ts` | 41, 49, 77 | Email template hard-codes `3 free AI-powered responses` in the welcome email (line 41), but the actual free tier limit is `1` (per `lib/plans.ts:5` and `DefenseDashboard.tsx:27`). The copy in the email is stale. Also `lib/plans.ts` price for Pro is listed as `19` (line 10) but the UI and terms page say `€12/month`. | Sync `lib/plans.ts` with actual pricing. Import plan limits from `lib/plans.ts` rather than hard-coding them in email templates. Fix the welcome email claim to match `PLANS.free.defense_responses`. |
| `app/(dashboard)/settings/page.tsx` | 52, 58 | Free tier limits `/1` are hard-coded as string literals inside JSX. If the plan limits change, this page won't update. | Derive from `PLANS.free.defense_responses` / `PLANS.free.contracts` imported from `lib/plans.ts`. |
| `components/defense/DefenseDashboard.tsx` | 27 | `FREE_LIMIT = 1` hard-coded inside the component. | Import `PLANS.free.defense_responses` from `lib/plans.ts`. |
| `app/(dashboard)/projects/[id]/page.tsx` | 8–12 | Defines `RISK_LABEL` and `RISK_COLORS` locally (only used in one inline contract strip). Neither is reused — but the values overlap with constants in four other files. | Use the canonical `RISK_COLORS` map once it's extracted (see above). `RISK_LABEL` can be inlined or added to the shared map. |

## Minor (nice to have)

| File | Line | Issue | Recommendation |
|------|------|-------|----------------|
| `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` | Throughout | The two auth pages share: logo markup, Google button with identical SVG, email/password inputs, error banner styling, and overall layout. ~70% of JSX is identical. | Extract `AuthCard` wrapper (logo + card shell), `GoogleButton`, and `AuthErrorBanner` components into `components/auth/`. Both pages become thin wrappers. |
| `components/defense/DefenseToolCard.tsx` | 33–44 | `onMouseEnter`/`onMouseLeave` mutate style imperatively rather than via CSS classes. This pattern requires reading back a style value on every hover. | Use a `hover:` Tailwind class or a single CSS class toggle (`className` prop). The component already mixes both paradigms (see `className="hover:text-white"` on the close button). Pick one. |
| `components/defense/ResponseHistory.tsx` | 25 | `upgradeLoading` state — component declares it but its associated upgrade button re-implements the full checkout flow. The `UpgradePrompt` component already exists for exactly this purpose. | Replace the locked-count upgrade button block (lines 91–125) with `<UpgradePrompt responsesUsed={...} />` if the design allows it, or extract the upgrade button into a shared `UpgradeButton` primitive. |
| `components/contract/RiskReport.tsx` | 47–59 | Missing protection cards are rendered as inline JSX inside `RiskReport`. The clause cards were extracted to `ClauseCard.tsx` — missing protections are similarly complex enough to warrant a `MissingProtectionCard` component. | Extract into `components/contract/MissingProtectionCard.tsx`. `RiskReport` maps over them the same way it maps over `ClauseCard`. |
| `lib/email.ts` | 49, 86 | Both HTML templates hard-code the author's personal email `adelina.lipsa@gmail.com` in the footer. | Move to an env var (`RESEND_FROM_EMAIL` already exists, or a new `SUPPORT_EMAIL`). |
| `components/project/ProjectCard.tsx` | 27–33 | `timeAgo` utility is defined inline inside the component. | Move to `lib/utils.ts` (already exists). |
| `app/api/contracts/analyze/route.ts` | 78 | `(anthropic.beta.files as any)` — `as any` cast repeated here and in `contracts/[id]/route.ts:41`. Indicates the beta API shape isn't typed. | Add a narrow local type or a helper in `lib/anthropic.ts` to wrap the beta call, so the cast is centralised and easy to remove when the SDK types ship. |
| `lib/plans.ts` | 19 | Pro price is listed as `19` (number) but no currency is attached. The UI shows `€12/month`. | At minimum add a comment. Better: add `currency: 'EUR'` and `priceDisplay: '€12/month'` fields and import them wherever the price is displayed to avoid drift. |

## What's Already Good

- **`lib/ui.ts`** is well-designed. `btnStyles`, `inputStyle`, `labelStyle`, `dialogContentStyle` cover the major primitives. `ProjectHeader.tsx` and `ContractDeleteButton.tsx` import from it correctly and apply it consistently — this is the pattern every component should follow.
- **`lib/defenseTools.ts`** cleanly co-locates `DEFENSE_TOOLS` metadata and `URGENCY_COLORS`. `DefenseToolCard.tsx` consumes both correctly.
- **`lib/anthropic.ts`** as a singleton export is correct for Next.js server-side. Both API routes that need the client import the shared instance — no accidental double-instantiation.
- **`lib/rate-limit.ts`** — the null-safe pattern (Redis is optional, falls back gracefully) and the `checkRateLimit` helper are clean and correctly reused by both AI routes.
- **`app/api/projects/[id]/defend/route.ts`** — compensating-decrement pattern with `preIncrementCount` is explicitly commented and applied consistently across all three error paths. This is correctness-critical and the code is clear about it.
- **`components/shared/CopyButton.tsx`** — single responsibility, handles its own PATCH fire-and-forget correctly. Good candidate for the shared library.
- **`lib/supabase/server.ts`** — `createServerSupabaseClient` is consistently used across all server pages and API routes. No leaking of the admin client into user-facing paths.
- **Zod validation in API routes** — `projectSchema` and `defendSchema` are defined at the route level and validated before any DB writes. The pattern is consistent across the routes that accept user input.
- **`types/index.ts`** — clean, minimal types with no duplication. `DefenseTool`, `DefenseToolMeta`, `ContextField` are all used correctly throughout.

## Top 3 Actions

1. **Centralise `TOOL_LABELS` and `RISK_COLORS`** — these are the most-duplicated data structures (2 and 4 copies respectively). Add them to `lib/defenseTools.ts` and `lib/ui.ts`. This prevents label/color drift as the product grows and is a 30-minute fix.

2. **Make `NewProjectForm` and `ContractUploader` import from `lib/ui.ts`** — both components redefine `inputStyle`/`labelStyle` locally and are completely unconnected to the shared constants. This is the most direct violation of the project's own convention. Delete the local copies, add the import. Three files fixed in one pass.

3. **Extract `handleUpgrade` to `lib/checkout.ts`** — the upgrade fetch is copy-pasted across three components. One of those (`UpgradePrompt`) is already meant to be the canonical upgrade UI but doesn't own the logic. A shared `startCheckout()` function eliminates the copies, and any future change to the checkout flow (error handling, redirect URL, analytics) only needs to happen once.
