---
phase: 03-legal-email
plan: 01
subsystem: ui
tags: [next.js, server-components, legal, privacy, terms]

# Dependency graph
requires:
  - phase: 02-infrastructure-security
    provides: dark-theme CSS custom properties, signup page layout pattern
provides:
  - Privacy Policy page at /privacy (Server Component, dark theme, Anthropic as processor clause)
  - Terms of Service page at /terms (Server Component, AI disclaimer, cancellation policy)
  - Signup page legal footer with clickable Next.js Link components to /terms and /privacy
affects: [stripe-payments, 03-02-email, 03-03-welcome-email, 03-04-upgrade-email]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component static pages at app/{route}/page.tsx with inline styles and CSS custom properties

key-files:
  created:
    - app/privacy/page.tsx
    - app/terms/page.tsx
  modified:
    - app/(auth)/signup/page.tsx

key-decisions:
  - "Legal pages placed at top-level app/privacy and app/terms (not inside route groups) to avoid inheriting auth/dashboard layouts"
  - "Server Components only (no 'use client') — static prose pages with no interactivity"
  - "680px container width for prose (wider than auth 400px per UI-SPEC)"
  - "JSX HTML entities used for quotes/apostrophes in prose (&quot; &apos;) to avoid linting issues"

patterns-established:
  - "Static legal page pattern: Server Component, import Link only, inline styles with CSS vars, 680px container, wordmark header, content card, back-to-home footer"

requirements-completed: [LEGAL-01, LEGAL-02, LEGAL-03]

# Metrics
duration: 15min
completed: 2026-04-24
---

# Phase 3 Plan 01: Legal Pages Summary

**Static /privacy and /terms Server Component pages with dark theme, Anthropic-as-processor clause, AI output disclaimer, and clickable signup footer links unblocking Stripe live payments**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-24T00:00:00Z
- **Completed:** 2026-04-24T00:15:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created full Privacy Policy at `/privacy` naming Anthropic, PBC as data processor for contract PDFs (LEGAL-01)
- Created Terms of Service at `/terms` with AI output disclaimer ("not legal advice") and 30-day cancellation/refund policy (LEGAL-02)
- Updated signup page legal footer to use `<Link>` components pointing to `/terms` and `/privacy` (LEGAL-03)
- Both legal pages match dark theme (var(--bg-base), var(--bg-surface)) and use 680px prose container

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /privacy Server Component page** - `ae3ac95` (feat)
2. **Task 2: Create /terms Server Component page** - `c6bc4b1` (feat)
3. **Task 3: Convert signup legal footer text to Link components** - `d3d7e9d` (feat)

## Files Created/Modified

- `app/privacy/page.tsx` - Privacy Policy static Server Component, dark theme, Anthropic processor clause, contact email link
- `app/terms/page.tsx` - Terms of Service static Server Component, AI disclaimer, cancellation policy, Stripe billing section
- `app/(auth)/signup/page.tsx` - Legal footer paragraph now uses `<Link href="/terms">` and `<Link href="/privacy">` with brand-amber style

## Decisions Made

- Legal pages placed at `app/privacy/page.tsx` and `app/terms/page.tsx` (top-level in app/) rather than inside route groups — avoids inheriting auth/dashboard layouts and keeps pages publicly accessible without auth checks
- No `'use client'` on legal pages — they are pure static prose, no interactivity needed
- JSX HTML entities (`&quot;`, `&apos;`) used for quotes and apostrophes in prose strings to prevent linting issues with unescaped characters

## Deviations from Plan

None — plan executed exactly as written. The privacy page was already committed in a prior session (`ae3ac95`); terms page and signup modification were completed in this session.

## Issues Encountered

None.

## Known Stubs

None — all content is fully written production-quality prose.

## Threat Flags

No new security surface introduced. Legal pages are static Server Components with no user input, no DB calls, and no external requests. Contact email links use `href="mailto:..."` which is intentional public disclosure (T-03-02, accepted).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Stripe legal prerequisite satisfied: `/privacy` and `/terms` are live and linkable from checkout
- Plan 03-02 (email helper lib) and 03-03/03-04 (welcome/upgrade email triggers) can proceed in Wave 2

---
*Phase: 03-legal-email*
*Completed: 2026-04-24*
