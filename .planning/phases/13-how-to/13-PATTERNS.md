# Phase 13: How-To & In-App Guidance - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 6
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/hero/DemoAnimation.tsx` | component | event-driven (state machine) | `app/page.tsx` → `HowItWorksDemo` function (lines 123–323) | exact |
| `app/how-it-works/page.tsx` | page (Server Component) | transform (static) | `app/privacy/page.tsx` | exact |
| `app/page.tsx` (add section) | page | request-response | self — existing section structure (lines 633–644, 647–660) | self-match |
| `components/shared/Navbar.tsx` (add link) | component | request-response | self — `NAV_SECTIONS` Account block (lines 16–33) | self-match |
| `components/shared/Footer.tsx` (replace link) | component | transform (static) | self — `PRODUCT_LINKS` array (lines 4–9) | self-match |
| `components/defense/DefenseDashboard.tsx` (hint) | component | event-driven | self — `showAnalyzePanel` block (lines 288–329) | self-match |
| `components/project/ProjectDetailClient.tsx` (hint) | component | event-driven | self — escalation nudge block (lines 105–137) | self-match |

---

## Pattern Assignments

### `components/hero/DemoAnimation.tsx` (new, component, event-driven state machine)

**Analog:** `app/page.tsx`, `HowItWorksDemo` function (lines 123–323)

**Directive:** `'use client'` — uses `useState`, `useEffect`, `useRef`.

**Imports pattern** (analog lines 3–9):
```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
// No external animation library — zero new deps
```

**Timers ref pattern — prevents stale closure and interval leak** (analog lines 128–155):
```tsx
// Store both setTimeout and setInterval handles in a single ref object.
// Clear both on every new step entry and on unmount.
const timers = useRef<{ t?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({})

function beginStep(index: number) {
  if (timers.current.t) clearTimeout(timers.current.t)
  if (timers.current.interval) clearInterval(timers.current.interval)
  // ... set new timeout / interval
}

useEffect(() => {
  timers.current.t = setTimeout(() => beginStep(0), 600)
  return () => {
    if (timers.current.t) clearTimeout(timers.current.t)
    if (timers.current.interval) clearInterval(timers.current.interval)
  }
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

**Typewriter via setInterval** (analog lines 142–153):
```tsx
let i = 0
timers.current.interval = setInterval(() => {
  i++
  setTyped(response.slice(0, i))
  if (i >= response.length) {
    clearInterval(timers.current.interval)
    timers.current.t = setTimeout(() => beginStep((index + 1) % STEPS.length), 4500)
  }
}, 18)
```

**Cinematic entrance via requestAnimationFrame + inline style state** (pattern from RESEARCH.md):
```tsx
const [entered, setEntered] = useState(false)

useEffect(() => {
  requestAnimationFrame(() => setEntered(true))
}, [])

// On wrapper div:
style={{
  transform: entered ? 'scale(1)' : 'scale(0.92)',
  opacity: entered ? 1 : 0,
  transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms cubic-bezier(0.16,1,0.3,1)',
}}
```

**Vignette overlay** (from RESEARCH.md / 13-PLAN.md, consistent with analog lines 543–544 side vignettes):
```tsx
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

**Active tool card style** (analog lines 441–462 for active card border + glow):
```tsx
// Active card — lime border + glow
style={{
  border: '1px solid #84cc16',
  boxShadow: '0 0 12px rgba(132,204,22,0.15)',
}}
// Inactive card — subdued
style={{
  border: '1px solid var(--bg-border)',
}}
```

**Risk badge style** (analog lines 243–246 for READY badge, adapted for 8/10):
```tsx
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

**Step label style** (analog lines 309–321):
```tsx
<div className="font-mono text-brand-lime text-[0.65rem] font-bold tracking-[0.12em] mb-1">{num}</div>
<div className="text-text-secondary text-[0.8rem]">{label}</div>
```

**Typing cursor** (analog line 279):
```tsx
<span className="inline-block w-0.5 h-[0.9em] bg-brand-lime align-text-bottom ml-px [animation:blink_0.9s_step-end_infinite]" />
```

---

### `app/how-it-works/page.tsx` (new, Server Component, public)

**Analog:** `app/privacy/page.tsx` (full file)

**Key facts:** No `'use client'`. No auth. Inherits root `app/layout.tsx` (fonts, `globals.css`, Toaster). Follows `app/privacy/` and `app/terms/` precedent for public pages outside route groups.

**Shell pattern** (analog lines 1–16):
```tsx
import Link from 'next/link'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import Footer from '@/components/shared/Footer'

// No 'use client' directive — Server Component

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* Minimal logo header — same as privacy/terms pages */}
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
          <span style={{ color: 'var(--brand-lime)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>
        </Link>
      </div>

      {/* Page content */}
      <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {/* ... sections */}
      </div>

      <Footer />
    </div>
  )
}
```

**Tool directory — static group mapping pattern** (analog `DefenseDashboard.tsx` lines 30–47):
```tsx
// Module-scope constant — UPPER_SNAKE_CASE per project convention
const TOOL_GROUPS: { heading: string; types: string[] }[] = [
  {
    heading: 'Payment Issues',
    types: ['payment_first', 'payment_second', 'payment_final', 'retroactive_discount', 'disputed_hours'],
  },
  {
    heading: 'Scope & Delivery',
    types: ['scope_change', 'revision_limit', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    heading: 'Client Behavior',
    types: ['ghost_client', 'feedback_stall', 'chargeback_threat', 'review_threat', 'dispute_response', 'spec_work_pressure'],
  },
  {
    heading: 'Pricing & Rates',
    types: ['discount_pressure', 'rate_increase_pushback', 'rush_fee_demand', 'kill_fee', 'ip_dispute'],
  },
]

// In render — filter DEFENSE_TOOLS by each group's types
{TOOL_GROUPS.map(group => (
  <div key={group.heading} style={{ marginBottom: '2rem' }}>
    <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
      {group.heading}
    </h3>
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {group.types.map(type => {
        const tool = DEFENSE_TOOLS.find(t => t.type === type)
        if (!tool) return null
        return (
          <li key={type}>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tool.label}</strong>
            {' '}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{tool.description}</span>
          </li>
        )
      })}
    </ul>
  </div>
))}
```

**Inline style + CSS vars pattern** (analog lines 5–22 of `app/privacy/page.tsx`):
```tsx
// All layout via inline style objects with CSS vars — no Tailwind layout classes
style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2.5rem' }}
// Tailwind utility classes are acceptable for transitions only (e.g., className="hover:text-white transition-colors")
```

**Section eyebrow label style** (from `app/page.tsx` lines 637–638):
```tsx
<p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>
  How it works
</p>
```

---

### `app/page.tsx` — add "See it in action" section

**Analog:** Self — existing section structure (lines 633–644, 647–660)

**New section wrapper** (exact JSX from 13-PLAN.md, consistent with existing section pattern):
```tsx
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

**Insertion point:** Between the Ticker block (ends ~line 631) and the existing `/* How It Works */` section (starts ~line 633). The new section goes between them — DemoAnimation is a different UI (contract paste → risk → tool → response) from the existing HowItWorksDemo (tool selection → response typing).

**Import to add at top of file:**
```tsx
import DemoAnimation from '@/components/hero/DemoAnimation'
```

---

### `components/shared/Navbar.tsx` — add Help link

**Analog:** Self — `NAV_SECTIONS` Account block (lines 16–33) and `NavLink` component (lines 35–50)

**Current Account section** (lines 28–33):
```tsx
{
  label: 'Account',
  items: [
    { href: '/settings', label: 'Settings', Icon: Settings },
  ],
},
```

**Updated Account section — add Help after Settings:**
```tsx
{
  label: 'Account',
  items: [
    { href: '/settings', label: 'Settings', Icon: Settings },
    { href: '/how-it-works', label: 'Help', Icon: HelpCircle },
  ],
},
```

**Icon import line to update** (line 6):
```tsx
// Before:
import { LayoutDashboard, Briefcase, FileText, Settings, BarChart2, ArrowUpCircle, CreditCard, ShieldCheck, LogOut, BookOpen, type LucideIcon } from 'lucide-react'
// After — add HelpCircle:
import { LayoutDashboard, Briefcase, FileText, Settings, BarChart2, ArrowUpCircle, CreditCard, ShieldCheck, LogOut, BookOpen, HelpCircle, type LucideIcon } from 'lucide-react'
```

**The `NavLink` component (lines 35–50) already handles active state, hover, and styling — no changes needed there.**

---

### `components/shared/Footer.tsx` — replace anchor hash with page link

**Analog:** Self — `PRODUCT_LINKS` array (lines 4–9)

**Current entry to replace** (line 8):
```tsx
{ label: 'How it works', href: '/#how-it-works' },
```

**Replacement:**
```tsx
{ label: 'How it works', href: '/how-it-works' },
```

**No other changes.** The link renders via the existing `PRODUCT_LINKS.map` loop (lines 113–125) — no template changes needed.

---

### `components/defense/DefenseDashboard.tsx` — empty-state hint

**Analog:** Self — `showAnalyzePanel` block (lines 288–329) and divider "or pick from the left" (lines 322–328)

**Condition to use** (line 269):
```tsx
const showAnalyzePanel = !selectedTool && !response
```

**Hint placement:** Below the divider line inside the `showAnalyzePanel` block, after line 328 (the closing `</div>` of the divider). Gate on `showAnalyzePanel && !analysisResult` per D-13 — hint must not appear when analysis result is being shown.

**Hint pattern:**
```tsx
{showAnalyzePanel && !analysisResult && (
  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
    Not sure which tool?{' '}
    <Link href="/how-it-works" style={{ color: 'var(--brand-lime)', textDecoration: 'none' }}>
      See the tool guide →
    </Link>
  </p>
)}
```

**`Link` is already imported at the top** — verify line 4 (`import Link from 'next/link'` is NOT in DefenseDashboard.tsx currently; it uses `useRouter` from next/navigation). Add `import Link from 'next/link'` to the import block.

**Existing analogous inline-link style** (from `ProjectDetailClient.tsx` line 84):
```tsx
<Link href={`/contracts/${contract.id}`} style={{ color: 'var(--brand-lime)', textDecoration: 'none', fontWeight: 500 }}>
  View analysis →
</Link>
```

---

### `components/project/ProjectDetailClient.tsx` — new-project onboarding hint

**Analog:** Self — escalation nudge block (lines 105–137) and contract strip (lines 69–96)

**Condition:** `responses.length === 0` — `responses` is already defined at line 49:
```tsx
const responses = project.defense_responses ?? []
```

**Placement:** Below `<ProjectHeader project={project} />` (line 66), before the contract strip block (line 69). Insert directly in the JSX return.

**Hint pattern — matches `fade-up` animation class used on contract strip (line 69):**
```tsx
{responses.length === 0 && (
  <p
    className="fade-up"
    style={{
      animationDelay: '0.05s',
      fontSize: '0.75rem',
      color: '#3f3f46',
      marginBottom: '0.5rem',
    }}
  >
    New to Pushback? Paste a message from your client above — we&apos;ll figure out what you&apos;re dealing with.
  </p>
)}
```

---

## Shared Patterns

### Inline style objects with CSS vars (applies to ALL files)
**Source:** `app/page.tsx` (throughout), `app/privacy/page.tsx` (throughout)

All layout uses inline `style` objects with `var(--bg-base)`, `var(--bg-surface)`, `var(--bg-border)`, `var(--bg-elevated)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--brand-lime)`, `var(--font-mono)`. Tailwind classes are permitted only for responsive utilities, transitions, and hover states.

### Brand lime accent (applies to ALL files)
**Source:** `app/globals.css` line 106: `--brand-lime: #84cc16`

Always use `var(--brand-lime)` or the literal `#84cc16` / `rgba(132,204,22,...)`. Never use `var(--brand-amber)` (it is aliased to the same value but `--brand-lime` is the canonical name per RESEARCH.md).

### UPPER_SNAKE_CASE for module-scope constants (applies to `DemoAnimation.tsx`, `how-it-works/page.tsx`)
**Source:** `DefenseDashboard.tsx` lines 28–47 (`TOOL_MAP`, `CATEGORIES`)

Any module-scope data constant must be `UPPER_SNAKE_CASE`: `TOOL_GROUPS`, `STEP_DURATIONS`, etc.

### No emoji anywhere (applies to ALL files)
**Source:** Project memory `feedback_lime_color.md`

Use Lucide React icons. Never use emoji characters in JSX, copy, or inline strings.

### `Link` from `next/link` for internal navigation (applies to `DemoAnimation.tsx`, `DefenseDashboard.tsx`, `how-it-works/page.tsx`)
**Source:** All existing components — `Footer.tsx` line 1, `ProjectDetailClient.tsx` line 4, `Navbar.tsx` line 4

```tsx
import Link from 'next/link'
// Usage:
<Link href="/how-it-works" style={{ color: 'var(--brand-lime)', textDecoration: 'none' }}>
  See the tool guide →
</Link>
```

---

## No Analog Found

All 6 files have analogs. No entries needed here.

---

## Metadata

**Analog search scope:** `app/`, `components/hero/`, `components/shared/`, `components/defense/`, `components/project/`
**Files scanned:** 7 (app/page.tsx, app/privacy/page.tsx, components/shared/Navbar.tsx, components/shared/Footer.tsx, components/defense/DefenseDashboard.tsx, components/project/ProjectDetailClient.tsx, components/hero/ listing)
**Pattern extraction date:** 2026-04-26
