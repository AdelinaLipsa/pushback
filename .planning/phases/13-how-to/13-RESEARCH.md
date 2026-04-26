# Phase 13: How-To & In-App Guidance - Research

**Researched:** 2026-04-26
**Domain:** React component authoring, CSS animation, Next.js App Router page structure, in-app onboarding patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Demo Animation (DemoAnimation.tsx)**
- D-01: Full 4-step loop (~12s cycle), 5 states (`idle | pasting | analyzing | selecting | responding`), typewriter via `setInterval`, cinematic zoom-in entrance (`scale(0.92) opacity(0)` → `scale(1) opacity(1)` over 600ms spring easing), radial-gradient vignette overlay.
- D-02: Starts on component mount. No IntersectionObserver. Simple `useEffect` chain.
- D-03: Fixed tool showcase — always "Rate Negotiation" card activates in the selecting step.
- D-04: All content strings exactly as in 13-PLAN.md (contract clause, Risk Score badge, tool card label, response text). Do not paraphrase or shorten.

**/how-it-works Page**
- D-05: Public page at `app/how-it-works/page.tsx` (outside `(dashboard)` route group). No auth required.
- D-06: Uses marketing layout matching `app/page.tsx` shell — not the dashboard Navbar/sidebar.
- D-07: Footer (`components/shared/Footer.tsx`) gets a link to `/how-it-works`. Dashboard Navbar also gets a "Help" link pointing to same public URL.

**Tool Directory (on /how-it-works)**
- D-08: Tools grouped by scenario type with hardcoded groups in `app/how-it-works/page.tsx`. No changes to `DefenseToolMeta` type or `DEFENSE_TOOLS` array.
  - Payment Issues: `payment_first`, `payment_second`, `payment_final`, `retroactive_discount`, `disputed_hours`
  - Scope & Delivery: `scope_change`, `revision_limit`, `moving_goalposts`, `post_handoff_request`, `delivery_signoff`
  - Client Behavior: `ghost_client`, `feedback_stall`, `chargeback_threat`, `review_threat`, `dispute_response`, `spec_work_pressure`
  - Pricing & Rates: `discount_pressure`, `rate_increase_pushback`, `rush_fee_demand`, `kill_fee`, `ip_dispute`
- D-09: Each tool entry shows bold label + `tool.description`. Description serves as "when to use". Renders as list item, not card.
- D-10: Pull label and description from `DEFENSE_TOOLS` directly (`import { DEFENSE_TOOLS } from '@/lib/defenseTools'`). Never hardcode tool copy.

**Onboarding Hints**
- D-11: Both hint surfaces: (1) DefenseDashboard empty state updated with 2-line guidance + link; (2) ProjectDetailClient new-project hint below heading.
- D-12: Auto-hide only — no dismiss button. Pure conditional render. No localStorage, no DB flag.
- D-13: DefenseDashboard hint is empty-state only — disappears once tool is selected.

### Claude's Discretion
- Exact H3 group header labels (e.g., "Payment Issues" vs "Payment Problems")
- Minor timing adjustments within the ~12s animation budget
- Whether Footer link is separate text or merged into existing group
- Exact copy for DefenseDashboard empty-state 2-line hint (use plan wording or adjust for voice consistency)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

---

## Summary

Phase 13 is a pure UI/content phase: no new API routes, no DB tables, no AI calls. It adds three surfaces: (1) a `DemoAnimation` component on the landing page — a JS state machine with typewriter and CSS transitions; (2) a `/how-it-works` public page outside the dashboard route group; (3) inline onboarding hints in two existing components.

The implementation risk is low because all source data (`DEFENSE_TOOLS`) already exists, all styling patterns are established in `app/page.tsx` and `globals.css`, and the component structure (inline `style` objects with CSS vars, conditional render with `{condition && <Component />}`) is well-established across the codebase.

The main planning precision required is: (a) getting the `DemoAnimation` state machine timing right without IntersectionObserver; (b) placing `/how-it-works` correctly in the filesystem (at `app/how-it-works/`, NOT `app/(dashboard)/how-it-works/`) so it inherits the root layout only; and (c) adding the Navbar "Help" link in the correct position within `NAV_SECTIONS`.

**Primary recommendation:** Execute in wave order — DemoAnimation first (most complex, self-contained), then /how-it-works page, then Navbar + Footer links, then inline hints last (touch existing components).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DemoAnimation component | Browser / Client | — | Pure presentational, no server data; `'use client'` required for `useState`/`useEffect`/`setInterval` |
| /how-it-works page | Frontend Server (SSR) | — | Public static page; no auth, no client state; Server Component; root layout provides fonts + Toaster |
| Tool directory data | Frontend Server (SSR) | — | Reads `DEFENSE_TOOLS` at module scope; no fetch, no suspense |
| Navbar Help link | Browser / Client | — | Navbar is already `'use client'` (`usePathname`, `useRouter`); link addition is additive |
| Footer /how-it-works link | Frontend Server (SSR) | — | Footer is a Server Component; link addition is additive |
| DefenseDashboard empty-state hint | Browser / Client | — | DefenseDashboard is `'use client'`; conditional render on `!selectedTool` |
| ProjectDetailClient new-project hint | Browser / Client | — | ProjectDetailClient is `'use client'`; conditional render on `defense_responses.length === 0` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | Already installed | `useState`, `useEffect`, `useRef`, `requestAnimationFrame` | App base |
| Next.js | Already installed | App Router, Server Components, `Link` | App framework |
| Lucide React | Already installed | Icons in Navbar (`HelpCircle` or `LifeBuoy`) | Project icon standard — NEVER use emoji |

No new packages needed. This phase is zero-dependency. [VERIFIED: codebase grep]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `setInterval` typewriter | Framer Motion `useAnimate` | Framer is not in this project; `setInterval` matches existing HowItWorksDemo pattern in `app/page.tsx` |
| CSS class toggle for entrance | Inline `style` state | Both work; class toggle is lighter and matches existing `will-animate` / `fade-up` patterns |

---

## Architecture Patterns

### System Architecture Diagram

```
Landing page (app/page.tsx)
  └── DemoAnimation (components/hero/DemoAnimation.tsx)
        useEffect mount → requestAnimationFrame → setState(entered=true)
        setTimeout chain: idle → pasting → analyzing → selecting → responding → idle (loop)
        setInterval typewriter: incrementing charIndex into fixed string
        CSS: transition on wrapper div (scale + opacity), always-on vignette overlay

/how-it-works (app/how-it-works/page.tsx)
  └── inherits app/layout.tsx (fonts, globals.css, Toaster)
        imports DEFENSE_TOOLS from lib/defenseTools.ts
        static TOOL_GROUPS constant maps group headings → DefenseTool[] types
        renders: marketing header → intro prose → 3 use modes → tool directory → contract explanation → FAQ
        styling: inline style objects with var(--bg-*), var(--text-*), var(--brand-lime)

Navbar (components/shared/Navbar.tsx)
  └── NAV_SECTIONS — add Help item to 'Account' section (after Settings)
        href: '/how-it-works', Icon: HelpCircle (or LifeBuoy) from lucide-react

Footer (components/shared/Footer.tsx)
  └── PRODUCT_LINKS array — add { label: 'How it works', href: '/how-it-works' }
        (replaces the existing anchor-hash link `/#how-it-works`)

DefenseDashboard (components/defense/DefenseDashboard.tsx)
  └── showAnalyzePanel block — below existing divider line
        {!selectedTool && !analysisResult && <hint paragraph with Link to /how-it-works />}

ProjectDetailClient (components/project/ProjectDetailClient.tsx)
  └── below <ProjectHeader>
        {responses.length === 0 && <hint paragraph />}
```

### Recommended Project Structure

No new directories needed. New files:

```
components/hero/
  DemoAnimation.tsx        (new — purely presentational, 'use client')

app/
  how-it-works/
    page.tsx               (new — Server Component, public, root layout only)
```

### Pattern 1: CSS Entrance Transition via requestAnimationFrame

**What:** Toggle a boolean state after first paint to trigger a CSS transition on mount.
**When to use:** Cinematic entrance that must not flash on server render. [VERIFIED: codebase — `app/page.tsx` uses same approach with IntersectionObserver; `requestAnimationFrame` variant is per CONTEXT.md D-01]

```tsx
// Source: 13-CONTEXT.md D-01, consistent with app/page.tsx animation patterns
'use client'
import { useState, useEffect } from 'react'

function DemoAnimation() {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  return (
    <div
      style={{
        transform: entered ? 'scale(1)' : 'scale(0.92)',
        opacity: entered ? 1 : 0,
        transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* animation content */}
    </div>
  )
}
```

### Pattern 2: Typewriter via setInterval

**What:** Increment a character index into a fixed string on an interval; clear interval when complete.
**When to use:** Any text-reveal animation where the full string is known upfront.
[VERIFIED: codebase — `HowItWorksDemo` in `app/page.tsx` uses this exact pattern]

```tsx
// Source: app/page.tsx HowItWorksDemo, adapted per 13-PLAN.md
const FULL_TEXT = '...Contractor waives all rights...'
const [displayText, setDisplayText] = useState('')

useEffect(() => {
  if (step !== 'pasting') return
  let i = 0
  const interval = setInterval(() => {
    i++
    setDisplayText(FULL_TEXT.slice(0, i))
    if (i >= FULL_TEXT.length) clearInterval(interval)
  }, 28) // ~28ms per char for a ~12s budget across all steps
  return () => clearInterval(interval)
}, [step])
```

### Pattern 3: /how-it-works Tool Directory — Static Group Mapping

**What:** Module-scope constant maps group headings to `DefenseTool` type arrays. At render, filter `DEFENSE_TOOLS` by types in each group.
**When to use:** D-08 mandates hardcoded groups, no changes to source data.
[VERIFIED: codebase — DefenseDashboard.tsx uses identical `CATEGORIES` pattern at line 30–47]

```tsx
// Source: Pattern from DefenseDashboard.tsx CATEGORIES constant
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import type { DefenseTool } from '@/types'

const TOOL_GROUPS: { heading: string; types: DefenseTool[] }[] = [
  {
    heading: 'Payment Issues',
    types: ['payment_first', 'payment_second', 'payment_final', 'retroactive_discount', 'disputed_hours'],
  },
  // ... other groups per D-08
]

// In render:
{TOOL_GROUPS.map(group => (
  <div key={group.heading}>
    <h3>{group.heading}</h3>
    <ul>
      {group.types.map(type => {
        const tool = DEFENSE_TOOLS.find(t => t.type === type)!
        return (
          <li key={type}>
            <strong>{tool.label}</strong> — {tool.description}
          </li>
        )
      })}
    </ul>
  </div>
))}
```

### Pattern 4: Conditional Empty-State Hint (Auto-Hide)

**What:** Pure conditional render. No dismiss, no persistence.
**When to use:** D-12 — hint disappears when condition becomes false (tool selected, or responses exist).
[VERIFIED: codebase — existing `showAnalyzePanel` conditional in DefenseDashboard.tsx uses same pattern]

```tsx
// DefenseDashboard: hint visible only when showAnalyzePanel && !analysisResult
{showAnalyzePanel && !analysisResult && (
  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
    Not sure which tool?{' '}
    <Link href="/how-it-works" style={{ color: 'var(--brand-lime)', textDecoration: 'none' }}>
      See the tool guide →
    </Link>
  </p>
)}

// ProjectDetailClient: hint visible only when no responses exist
{responses.length === 0 && (
  <p style={{ fontSize: '0.75rem', color: '#3f3f46', marginTop: '0.25rem' }}>
    New to Pushback? Paste a message from your client above — we&apos;ll figure out what you&apos;re dealing with.
  </p>
)}
```

### Anti-Patterns to Avoid

- **Placing /how-it-works inside `(dashboard)` route group:** CONTEXT.md D-05 explicitly overrides the original plan. The file must be at `app/how-it-works/page.tsx`, NOT `app/(dashboard)/how-it-works/page.tsx`. The `(dashboard)` group wraps its pages with auth middleware; the how-it-works page is public. [VERIFIED: codebase — `app/privacy/` and `app/terms/` are both outside route groups for the same reason, per STATE.md 03-01 decision]

- **Using Tailwind layout classes in DemoAnimation or how-it-works page:** Project convention is inline `style` objects with CSS vars for all layout — no Tailwind layout classes. Tailwind utility classes are acceptable for transitions and color helpers (e.g., `transition-opacity`, `hover:text-white`). [VERIFIED: codebase — `app/page.tsx` ToolCarousel, HowItWorksDemo use inline styles exclusively; CONTEXT.md code_context section]

- **Hardcoding tool labels or descriptions in how-it-works page:** Always import from `DEFENSE_TOOLS`. D-10 is explicit. [VERIFIED: codebase — source of truth is `lib/defenseTools.ts`]

- **Adding dismiss/localStorage to hint components:** D-12 says auto-hide only. Pure conditional render. No state persistence.

- **Using emoji anywhere:** Project rule — Lucide icons only, no emoji. [VERIFIED: project memory `feedback_lime_color.md`]

- **Using amber accent (`brand-amber`):** CSS variable `--brand-amber` is aliased to `#84cc16` (lime) in `globals.css` (lines 90 and 43). Use `var(--brand-lime)` directly. [VERIFIED: codebase — globals.css line 106: `--brand-lime: #84cc16`; line 90: `--brand-amber: #84cc16`]

- **Adding `'use client'` to the how-it-works page:** It is a pure Server Component with no interactivity. The root `app/layout.tsx` provides fonts, global CSS, and Toaster. No client directive needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typewriter animation | Custom recursive setTimeout | `setInterval` + char index | Already proven in codebase (`HowItWorksDemo`); simpler cleanup |
| CSS entrance transition | Canvas / Web Animations API | `useState` bool + CSS `transition` | Matches project pattern; zero deps |
| Tool data | Hardcoded copy in how-it-works | `DEFENSE_TOOLS` from `lib/defenseTools.ts` | Single source of truth; stays in sync with Phase 8 tools |

---

## Common Pitfalls

### Pitfall 1: DemoAnimation — Interval Leak on Unmount

**What goes wrong:** `setInterval` for the typewriter keeps running after the component unmounts (e.g., user navigates away from landing page), causing state updates on an unmounted component — React warning + potential memory leak.
**Why it happens:** `useEffect` return cleanup is not wired to the interval ref.
**How to avoid:** Always return cleanup from every `useEffect` that starts an interval or timeout:
```tsx
useEffect(() => {
  const id = setInterval(...)
  return () => clearInterval(id)
}, [step])
```
**Warning signs:** React DevTools warns "Can't perform a React state update on an unmounted component."

### Pitfall 2: DemoAnimation — Stale Closure in setTimeout Chain

**What goes wrong:** The next step's `setTimeout` captures a stale value of `step` state, causing the loop to get stuck or skip states.
**Why it happens:** `setTimeout` callback closes over the initial value of `step` unless using a ref or functional state update.
**How to avoid:** Use a `useRef` for the current step value, or drive the sequence entirely by chaining effects with `step` as a dependency, or use a single `useEffect` with a cleanup pattern. The existing `HowItWorksDemo` in `app/page.tsx` uses a `timers` ref (`useRef<{t?: ..., interval?: ...}>({})`) — follow the same approach. [VERIFIED: app/page.tsx lines 128–163]

### Pitfall 3: how-it-works — Missing `Link` import for Server Component

**What goes wrong:** `/how-it-works/page.tsx` is a Server Component. If it uses the dashboard's `Link`-based patterns but forgets the import, TypeScript error at build.
**Why it happens:** Server Components don't auto-import anything.
**How to avoid:** Import `Link from 'next/link'` and `DEFENSE_TOOLS from '@/lib/defenseTools'` at the top of the file. Follow `app/privacy/page.tsx` as the pattern for a public static page with marketing branding.

### Pitfall 4: Footer — Replacing the Anchor Hash Link

**What goes wrong:** The Footer currently has `{ label: 'How it works', href: '/#how-it-works' }` in `PRODUCT_LINKS` (line 8 of `Footer.tsx`). If the planner adds a second "How it works" entry instead of replacing the existing one, the footer shows a duplicate.
**Why it happens:** The entry already exists as an anchor link to a landing page section, not a separate page.
**How to avoid:** Replace the existing `/#how-it-works` entry with `/how-it-works`. [VERIFIED: codebase — Footer.tsx line 8]

### Pitfall 5: Navbar — Lucide Icon Import

**What goes wrong:** Adding a new icon to Navbar without importing it from `lucide-react` causes a runtime error.
**Why it happens:** The Navbar has a curated import list. The `HelpCircle` or `LifeBuoy` icon must be added to the import line.
**How to avoid:** Add the chosen icon to the existing destructured import on line 6 of `Navbar.tsx`. The icon should also be added to `NAV_SECTIONS` items array and the `LucideIcon` type is already imported. [VERIFIED: codebase — Navbar.tsx lines 6–32]

### Pitfall 6: DefenseDashboard hint — Condition precision

**What goes wrong:** Showing the hint even when `analysisResult` is set (i.e., analysis just ran but no tool selected yet). The existing divider line "or pick from the left" already handles the empty state; the hint should only show in the pre-interaction empty state.
**Why it happens:** `showAnalyzePanel` is `!selectedTool && !response` — it's still true immediately after analysis completes while `analysisResult` is being shown.
**How to avoid:** Gate the hint on `showAnalyzePanel && !analysisResult` (not just `showAnalyzePanel`). This matches D-13. [VERIFIED: codebase — DefenseDashboard.tsx `showAnalyzePanel` defined at line 269]

---

## Code Examples

Verified patterns from official codebase sources:

### Landing Page Section Wrapper (for DemoAnimation)

```tsx
// Source: 13-PLAN.md exact section wrapper JSX; consistent with app/page.tsx section pattern
<section className="py-20 border-t border-[#1c1c1e]">
  <div className="max-w-3xl mx-auto px-6 text-center">
    <p className="text-xs tracking-widest text-[#84cc16] uppercase mb-3">See it in action</p>
    <h2 className="text-3xl font-semibold text-white mb-4">From contract to response in seconds</h2>
    <p className="text-[#71717a] mb-10 max-w-lg mx-auto">
      Paste a clause, get a risk score, pick your situation, and copy a professional response — no legal knowledge required.
    </p>
    <DemoAnimation />
  </div>
</section>
```

### Vignette Overlay

```tsx
// Source: 13-PLAN.md / 13-CONTEXT.md specifics section
<div
  style={{
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.85) 100%)',
    pointerEvents: 'none',
    zIndex: 10,
  }}
/>
```

### Risk Badge Style

```tsx
// Source: 13-PLAN.md animation styles
<span style={{
  backgroundColor: 'rgba(132,204,22,0.1)',
  color: '#84cc16',
  border: '1px solid rgba(132,204,22,0.3)',
  borderRadius: '4px',
  padding: '0 0.5rem',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
}}>
  8/10
</span>
```

### Active Tool Card Style

```tsx
// Source: 13-PLAN.md animation styles
<div style={{
  border: '1px solid #84cc16',
  boxShadow: '0 0 12px rgba(132,204,22,0.15)',
}}>
  Rate Negotiation
</div>
```

### Step Label Style

```tsx
// Source: 13-PLAN.md
<p className="text-[10px] tracking-widest text-[#84cc16] uppercase">
  Pick your situation
</p>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `app/(dashboard)/how-it-works/page.tsx` | `app/how-it-works/page.tsx` | CONTEXT.md D-05 (this discussion) | Page is public — no auth required; outside dashboard layout |
| Anchor hash `/#how-it-works` in Footer | `/how-it-works` dedicated page | This phase | Footer PRODUCT_LINKS entry must be replaced, not added |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `how-it-works/page.tsx` should render a marketing-style page logo header (like `app/privacy/page.tsx`) rather than a standalone nav | Code Examples | If wrong, page would appear header-less on direct visit; easy to fix |
| A2 | `HelpCircle` or `LifeBuoy` from lucide-react is suitable for the Navbar Help link icon — final icon choice is Claude's discretion | Standard Stack / Patterns | Low risk; any lucide icon works |

---

## Open Questions

1. **DemoAnimation placement in `app/page.tsx`**
   - What we know: The plan specifies a new `<section>` between hero and features/pricing. The existing page has: Hero → Ticker → "How It Works" (HowItWorksDemo) → Tool Carousel → Before/After → Pricing → Footer.
   - What's unclear: The plan says "between hero and features/pricing sections" — the existing HowItWorksDemo section already fills that slot. Does DemoAnimation replace HowItWorksDemo, or does it come after it as a second section?
   - Recommendation: Based on 13-PLAN.md, the "See it in action" section describes a different UI (contract paste → risk score → tool card → response) vs. the existing HowItWorksDemo (tool selection → response generation). They are complementary. The DemoAnimation section should be inserted between the Ticker and the existing HowItWorksDemo section. The planner should make this call explicit in the plan.

2. **how-it-works page — standalone logo/nav header**
   - What we know: `app/privacy/page.tsx` includes a minimal centered Pushback logo + back-to-home link at the top. D-06 says marketing layout.
   - What's unclear: Whether "marketing layout" means including `PushbackHero` (full hero) or just a minimal logo header + Footer.
   - Recommendation: Use the `app/privacy/page.tsx` minimal logo pattern at the top + `<Footer />` at the bottom, no full hero. The how-it-works page is informational, not a marketing conversion page.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes. No external tool dependencies (no CLI tools, no databases, no new services).

---

## Sources

### Primary (HIGH confidence)
- `lib/defenseTools.ts` — verified all 20 tools, labels, descriptions, types [VERIFIED: codebase]
- `app/page.tsx` — verified existing animation patterns (HowItWorksDemo `timers` ref, typewriter, `setInterval`) [VERIFIED: codebase]
- `components/shared/Navbar.tsx` — verified NAV_SECTIONS structure, existing imports, Help link insertion point [VERIFIED: codebase]
- `components/shared/Footer.tsx` — verified PRODUCT_LINKS array, existing `/#how-it-works` anchor entry [VERIFIED: codebase]
- `components/defense/DefenseDashboard.tsx` — verified `showAnalyzePanel` condition, `CATEGORIES` pattern for group mapping [VERIFIED: codebase]
- `components/project/ProjectDetailClient.tsx` — verified `responses` array, conditional render location for hint [VERIFIED: codebase]
- `app/layout.tsx` — verified root layout provides fonts, globals.css, Toaster — sufficient for /how-it-works [VERIFIED: codebase]
- `app/privacy/page.tsx` — verified pattern for public page outside route groups [VERIFIED: codebase]
- `app/globals.css` — verified CSS vars, animation keyframes, existing utility classes [VERIFIED: codebase]
- `.planning/phases/13-how-to/13-CONTEXT.md` — locked decisions source of truth [VERIFIED: planning]
- `.planning/phases/13-how-to/13-PLAN.md` — exact content strings and styling values [VERIFIED: planning]

### Secondary (MEDIUM confidence)
- `components/hero/PushbackHero.tsx` referenced in CONTEXT.md as existing hero; not read but existence confirmed [VERIFIED: filesystem]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; zero new dependencies
- Architecture: HIGH — all patterns verified against live codebase
- Pitfalls: HIGH — identified from reading actual component code, not assumptions
- Content strings: HIGH — exact strings locked in CONTEXT.md D-04 and 13-PLAN.md

**Research date:** 2026-04-26
**Valid until:** 2026-06-01 (stable codebase, no external deps)
