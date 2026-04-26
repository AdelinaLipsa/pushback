# Phase 13: How-To & In-App Guidance - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the app self-teaching for first-time users: a public `/how-it-works` page (marketing layout, no auth required) with grouped tool directory + FAQ, a CSS/JS animated product demo on the landing page, inline empty-state hints in DefenseDashboard and ProjectDetailClient, and a Help link in the dashboard Navbar. No new DB tables, no AI calls, no new API routes.

</domain>

<decisions>
## Implementation Decisions

### Demo Animation (DemoAnimation.tsx)
- **D-01:** Full implementation as planned — 4-step loop (~12s cycle), 5 states (`idle | pasting | analyzing | selecting | responding`), typewriter effect via `setInterval`, cinematic zoom-in entrance (`scale(0.92) opacity(0)` → `scale(1) opacity(1)` over 600ms spring easing on mount), radial-gradient vignette overlay.
- **D-02:** Starts on page load (component mount). No IntersectionObserver — simple `useEffect` chain. Consistent with plan spec.
- **D-03:** Fixed tool showcase — always "Rate Negotiation" card activates in the selecting step. No rotation between loops.
- **D-04:** All content strings exactly as in `13-PLAN.md`: contract clause (`"...Contractor waives all rights to claim additional compensation..."`), Risk Score badge (`8/10`), tool card label (`Rate Negotiation`), response text (rate negotiation message from plan). Do not paraphrase or shorten.

### /how-it-works Page
- **D-05:** `/how-it-works` is a **public page** — file location: `app/how-it-works/page.tsx` (outside the `(dashboard)` route group). **No auth required.** This is a change from the plan's `app/(dashboard)/how-it-works/page.tsx`.
- **D-06:** Uses **marketing layout** matching `app/page.tsx` shell — not the dashboard Navbar/sidebar. Same dark aesthetic, consistent with the landing page.
- **D-07:** The landing page Footer (`components/shared/Footer.tsx`) gets a link to `/how-it-works`. The dashboard Navbar also gets a "Help" link (as per plan) pointing to the same public URL.

### Tool Directory (on /how-it-works)
- **D-08:** Tools are **grouped by scenario type** with hardcoded groups in `app/how-it-works/page.tsx`. No changes to `DefenseToolMeta` type or `DEFENSE_TOOLS` array.
  - **Payment Issues:** `payment_first`, `payment_second`, `payment_final`, `retroactive_discount`, `disputed_hours`
  - **Scope & Delivery:** `scope_change`, `revision_limit`, `moving_goalposts`, `post_handoff_request`, `delivery_signoff`
  - **Client Behavior:** `ghost_client`, `feedback_stall`, `chargeback_threat`, `review_threat`, `dispute_response`, `spec_work_pressure`
  - **Pricing & Rates:** `discount_pressure`, `rate_increase_pushback`, `rush_fee_demand`, `kill_fee`, `ip_dispute`
- **D-09:** Each tool entry shows: bold label + `tool.description`. The description field already serves as the "when to use" explanation — no separate third field needed. Renders as a simple list item, not a card.
- **D-10:** Page-level static mapping assigns tool types to groups. Pull tool label and description from `DEFENSE_TOOLS` directly (`import { DEFENSE_TOOLS } from '@/lib/defenseTools'`) — never hardcode tool copy.

### Onboarding Hints
- **D-11:** Both hint surfaces implemented as per plan: (1) DefenseDashboard empty state updated with 2-line guidance + link to `/how-it-works`, and (2) ProjectDetailClient new-project hint below the heading.
- **D-12:** **Auto-hide only — no dismiss button.** Pure conditional render. DefenseDashboard hint shows when no tool is selected (empty state); disappears once a tool is picked. ProjectDetailClient hint shows when `defense_responses` is empty; disappears once ≥1 response exists. No localStorage, no DB flag needed.
- **D-13:** DefenseDashboard hint is **empty-state only** — does not persist into the SituationPanel or ResponseOutput steps. Once the user selects a tool, normal flow takes over.

### Claude's Discretion
- Exact H3 group header labels for the tool directory sections (e.g., "Payment Issues" vs "Payment Problems")
- Minor timing adjustments in the animation (step durations within the ~12s overall budget)
- Whether the Footer link is a separate "How it works" text link or merged into an existing "Resources" or "Help" footer group
- Exact copy for the DefenseDashboard empty-state 2-line hint (the plan specifies wording; use it as written or adjust for voice consistency)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth — Tool Data
- `lib/defenseTools.ts` — `DEFENSE_TOOLS` array; pull label + description from here; do NOT hardcode tool copy in the how-it-works page

### Files Being Modified
- `app/page.tsx` — landing page; add "See it in action" section with `DemoAnimation` + ensure Footer links to `/how-it-works`
- `components/shared/Navbar.tsx` — add "Help" link pointing to `/how-it-works`
- `components/shared/Footer.tsx` — add link to `/how-it-works`
- `components/defense/DefenseDashboard.tsx` — update empty-state hint copy + add link
- `app/(dashboard)/projects/[id]/page.tsx` — project detail page; check if `ProjectDetailClient` is already a separate component or if the hint goes directly in the page

### New Files
- `components/hero/DemoAnimation.tsx` — animated product walkthrough (new)
- `app/how-it-works/page.tsx` — public how-it-works page (new; NOT in `(dashboard)`)

### Prior Phase Patterns (must-read for consistency)
- `.planning/phases/12-client-risk/12-CONTEXT.md` — inline styles with CSS vars, pill/badge patterns, `UPPER_SNAKE_CASE` constants
- `.planning/phases/11-document-generation/11-CONTEXT.md` — secondary action button style (ghost/outline, below primary CTA row)

### Existing Plan (fully-specified animation strings and timing)
- `.planning/phases/13-how-to/13-PLAN.md` — contains exact animation content strings, timing, CSS classes, section wrapper JSX for `app/page.tsx`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DEFENSE_TOOLS` (`lib/defenseTools.ts`) — 20 tools with `type`, `label`, `description`, `icon`, `urgency`, `contextFields` — tool directory imports this directly
- `components/shared/Footer.tsx` — existing footer used on landing page; add `/how-it-works` link here
- `components/hero/PushbackHero.tsx` — existing hero component on landing page; `DemoAnimation` goes in a new section below the hero, not inside it
- CSS variables in `app/globals.css` — `var(--bg-base)`, `var(--bg-surface)`, `var(--bg-border)`, `var(--text-primary)`, etc. — use for all styling in new components

### Established Patterns
- Inline `style` objects with CSS vars for all layout — no Tailwind layout classes; `DemoAnimation` and how-it-works page follow this pattern
- `UPPER_SNAKE_CASE` for module-scope constants — if any display maps are needed in how-it-works page, follow this convention
- Conditional render pattern: `{condition && <Component />}` — matches how-it-works hint in DefenseDashboard

### Integration Points
- `app/page.tsx` landing page: `DemoAnimation` goes in a new `<section>` between the existing hero and features/pricing sections. The plan has the exact section wrapper JSX.
- `components/shared/Navbar.tsx`: "Help" link position — after Settings, before auth links (per plan)
- `app/how-it-works/page.tsx` is OUTSIDE `(dashboard)` — it needs its own layout or the root layout. Check `app/layout.tsx` to understand what root layout provides (fonts, global CSS, Toaster).

</code_context>

<specifics>
## Specific Ideas

- The `/how-it-works` page is public, so a logged-in user who navigates there from the Navbar should see it cleanly — no auth redirect, no broken layout. The marketing layout (`app/page.tsx`-style) handles this naturally.
- Tool directory groups are defined as a static array of `{ heading: string; types: DefenseTool[] }` objects in the page file. Each group renders an H3 heading + list of matching DEFENSE_TOOLS entries.
- Animation vignette: `radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.85) 100%)` — exact value from plan. Matches page background color `#09090b` so the blur bleeds seamlessly.
- Cinematic entrance: `requestAnimationFrame` inside `useEffect` toggles a CSS class for the spring animation. Uses `useState(false)` → `true` after first paint. See plan for exact Tailwind classes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-how-to*
*Context gathered: 2026-04-26*
