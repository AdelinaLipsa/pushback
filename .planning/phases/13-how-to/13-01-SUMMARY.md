---
phase: 13-how-to
plan: "01"
subsystem: landing-page
tags: [animation, demo, client-component, state-machine, typewriter]
dependency_graph:
  requires: []
  provides: [DemoAnimation component, landing page "See it in action" section]
  affects: [app/page.tsx]
tech_stack:
  added: []
  patterns: [timers-ref cleanup pattern, requestAnimationFrame entrance, CSS transition spring easing]
key_files:
  created:
    - components/hero/DemoAnimation.tsx
  modified:
    - app/page.tsx
decisions:
  - "timers.current ref pattern (clearTimeout + clearInterval) replicates HowItWorksDemo — no stale-closure or interval-leak risk"
  - "requestAnimationFrame toggles entered state on mount for scale(0.92)→scale(1) cinematic entrance"
  - "Inline style objects only — no Tailwind layout classes per project convention"
  - "blink keyframe animation already declared in app/globals.css — not redeclared in DemoAnimation.tsx"
metrics:
  duration: "8min"
  completed: "2026-04-26"
  tasks: 2
  files: 2
---

# Phase 13 Plan 01: DemoAnimation Component and Landing Page Section Summary

**One-liner:** Cinematic 5-state animation machine (idle/pasting/analyzing/selecting/responding, ~12s loop) with typewriter, entrance spring, and radial vignette; hosted in a new "See it in action" landing page section.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create DemoAnimation component | 6026cfc | components/hero/DemoAnimation.tsx (new, 211 lines) |
| 2 | Add "See it in action" section to app/page.tsx | 9f87672 | app/page.tsx (+13 lines) |

## What Was Built

### Task 1: DemoAnimation Component

`components/hero/DemoAnimation.tsx` is a self-contained `'use client'` React component implementing:

- **State machine:** 5 states (`idle | pasting | analyzing | selecting | responding`) driven by `useState<Step>('idle')`
- **Typewriter:** `setInterval` at 28ms/char for `CONTRACT_CLAUSE` (pasting step) and `RESPONSE_TEXT` (responding step), matching HowItWorksDemo interval pattern
- **Cinematic entrance:** `requestAnimationFrame(() => setEntered(true))` inside the mount `useEffect` toggles CSS transition from `scale(0.92) opacity(0)` to `scale(1) opacity(1)` over 600ms `cubic-bezier(0.16,1,0.3,1)`
- **Timers cleanup:** `useEffect` return clears both `timers.current.t` and `timers.current.interval` — no React "state update on unmounted component" warnings
- **Vignette overlay:** absolutely positioned `div` with `radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.85) 100%)`, `pointer-events: none`, `z-index: 10`
- **All exact content strings per D-04:** `CONTRACT_CLAUSE` ("Contractor waives all rights to claim additional compensation..."), `RISK_SCORE` ("8/10"), `ACTIVE_TOOL_LABEL` ("Rate Negotiation"), `RESPONSE_TEXT` ("I appreciate you raising this...")
- **Lime accent only:** risk badge, active tool card border/glow, typewriter cursor, step eyebrow labels all use `#84cc16` / `var(--brand-lime)`; no `var(--brand-amber)`
- **`blink` keyframe** reused from `app/globals.css` — not redeclared

### Task 2: Landing Page Section

`app/page.tsx` changes:
- **Import added** (line 10): `import DemoAnimation from '@/components/hero/DemoAnimation'`
- **New section inserted** between Ticker close (`</div>`) and existing `{/* How It Works */}` section
- **Exact copy per UI-SPEC Copywriting Contract:**
  - Eyebrow: "See it in action" (`text-[#84cc16] uppercase tracking-widest`)
  - Heading: "From contract to response in seconds"
  - Subheading: "Paste a clause, get a risk score, pick your situation, and copy a professional response — no legal knowledge required."
- **`<DemoAnimation />`** invoked with zero props inside `max-w-3xl mx-auto px-6 text-center` wrapper
- **HowItWorksDemo** function and `{/* How It Works */}` section are untouched — both co-exist

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Status |
|-----------|--------|
| T-13.01-01 (XSS — hardcoded strings) | Accepted — all strings are module-scope literals, no dangerouslySetInnerHTML |
| T-13.01-02 (DoS — memory leak) | Mitigated — clearTimeout + clearInterval both present in useEffect cleanup |
| T-13.01-03 (Info disclosure) | Accepted — public marketing page, no PII |
| T-13.01-04 (CSS injection) | Accepted — gradient is literal JSX style prop |
| T-13.01-05 (Open redirect) | Accepted — no Link/href in DemoAnimation |
| T-13.01-06 (Repudiation) | Accepted — pure presentation, no mutations |

## Known Stubs

None — all content strings are hardcoded module-scope constants, all panels render from state machine, DemoAnimation is fully wired.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `components/hero/DemoAnimation.tsx` exists: FOUND
- `app/page.tsx` modified: FOUND (DemoAnimation import at line 10, new section at line 634-644)
- Task 1 commit `6026cfc` exists: FOUND
- Task 2 commit `9f87672` exists: FOUND
- TypeScript: 0 errors for DemoAnimation.tsx, 0 errors for app/page.tsx
