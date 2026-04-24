---
phase: 02-infrastructure-security
plan: 03
subsystem: infra
tags: [next.config, security-headers, csp, hsts, x-frame-options, referrer-policy]

# Dependency graph
requires:
  - phase: 02-infrastructure-security
    provides: "Phase context — webhook hardening (02-01) and proxy.ts rename (02-02) already complete"
provides:
  - "Security headers on all HTTP responses via async headers() in next.config.ts"
  - "X-Powered-By header removed via poweredByHeader: false"
  - "CSP with Supabase connect-src, unsafe-inline for Next.js hydration, frame-ancestors none"
  - "HSTS with 2-year max-age, includeSubDomains, preload"
  - "X-Frame-Options: DENY on all routes"
  - "Referrer-Policy: strict-origin-when-cross-origin on all routes"
affects:
  - "all HTTP responses — headers apply to every route via source: '(/.*)''"
  - "03-legal-email — legal pages will also receive security headers"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Security headers pattern: declare CSP as module-level template literal, apply .replace(/\\n/g, '') in headers() return"
    - "All-routes header application: source: '(/.*)'  catches every path including root"

key-files:
  created: []
  modified:
    - next.config.ts

key-decisions:
  - "D-06: CSP uses unsafe-inline in script-src and style-src — required for Next.js 16 RSC hydration and Tailwind v4/next-themes; no unsafe-eval (not needed)"
  - "D-06: connect-src includes both https://*.supabase.co and wss://*.supabase.co — covers all Supabase subdomains including realtime WebSocket"
  - "D-06: frame-ancestors none in CSP plus X-Frame-Options: DENY — dual defense for maximum browser compat (modern + legacy)"
  - "D-06: cspHeader declared at module scope as template literal — newlines stripped at runtime via .replace(/\\n/g, '')"

patterns-established:
  - "CSP template literal pattern: multiline for readability, single-line at runtime via replace"

requirements-completed: [INFRA-05]

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 2 Plan 03: Security Headers Summary

**CSP, HSTS, X-Frame-Options, and Referrer-Policy added to all routes via next.config.ts async headers(); X-Powered-By removed with poweredByHeader: false**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-24T10:23:50Z
- **Completed:** 2026-04-24T10:29:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced placeholder next.config.ts with security-hardened config
- All HTTP responses now include CSP, HSTS, X-Frame-Options, and Referrer-Policy via source: '/(.*)'
- X-Powered-By header removed globally via poweredByHeader: false
- CSP correctly allows Next.js 16 hydration (unsafe-inline) and Supabase connections (connect-src with both https and wss subdomains) while blocking object-src, base-uri injection, and frame embedding
- TypeScript compilation passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace next.config.ts with security-hardened config** - `191c683` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `next.config.ts` - Complete replacement with poweredByHeader: false and async headers() applying CSP/HSTS/X-Frame-Options/Referrer-Policy to all routes

## Decisions Made

- CSP uses `unsafe-inline` in both script-src and style-src — required for Next.js 16 RSC inline script tags and Tailwind v4 inline styles; `unsafe-eval` is intentionally absent (not needed by this stack)
- `connect-src` covers both `https://*.supabase.co` and `wss://*.supabase.co` — handles Supabase realtime WebSocket connections alongside HTTPS API calls
- Dual clickjacking defense: `frame-ancestors 'none'` in CSP (modern browsers) plus `X-Frame-Options: DENY` (legacy browser compat)
- `cspHeader` declared at module scope as template literal with newlines stripped at runtime via `.replace(/\n/g, '')` — multiline for readability, compact for headers

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 (Infrastructure & Security) is now complete — all 3 plans done (02-01, 02-02, 02-03)
- Phase 3 (Legal & Email) is unblocked — /privacy and /terms pages plus transactional emails
- Security headers will apply automatically to all Phase 3 legal pages

---
*Phase: 02-infrastructure-security*
*Completed: 2026-04-24*
