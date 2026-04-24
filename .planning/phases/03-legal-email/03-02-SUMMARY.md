---
phase: 03-legal-email
plan: 02
subsystem: api
tags: [resend, email, transactional, typescript]

# Dependency graph
requires:
  - phase: 03-legal-email
    provides: Phase context and email design decisions (CONTEXT.md, UI-SPEC.md, RESEARCH.md)
provides:
  - lib/email.ts with sendWelcomeEmail(to) and sendUpgradeEmail(to, billing) exports
  - BillingDetails interface for use in Plans 03 and 04
  - Module-scope Resend singleton (fire-and-forget compatible, throw-on-error contract)
affects:
  - 03-03 (welcome email trigger — imports sendWelcomeEmail from lib/email.ts)
  - 03-04 (upgrade email trigger — imports sendUpgradeEmail from lib/email.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-scope Resend singleton (single new Resend() at module level, not per-call)
    - Throw-on-error send helper pattern (throw if error in destructured response so callers can .catch())
    - Inline table-layout HTML email templates (dark-themed, amber accent, no React Email dependency)

key-files:
  created:
    - lib/email.ts
  modified: []

key-decisions:
  - "lib/email.ts uses #f59e0b for amber (matches globals.css --brand-amber, not #f5a623 stale value in D-10)"
  - "BillingDetails interface exported from lib/email.ts so Plans 03/04 consumers share the same type"
  - "RESEND_API_KEY passed without ! to Resend constructor (accepts undefined, surfaces error at send time); FROM and APP_URL use ! per CONVENTIONS.md"
  - "Upgrade billing fallback triggers when EITHER amount OR nextBillingDate is null (not just both)"

patterns-established:
  - "Pattern: Email module exports typed async functions; internal HTML generators are private functions"
  - "Pattern: resend.emails.send() — use emails.send(), not sendEmail() (v1 removed API)"
  - "Pattern: Inline HTML email templates use table layout with inline styles for Outlook/Gmail compat"

requirements-completed: [EMAIL-01, EMAIL-02]

# Metrics
duration: 2min
completed: 2026-04-24
---

# Phase 3 Plan 02: Email Helper Summary

**Resend SDK v6 email helper lib/email.ts with dark-themed table-layout templates for welcome and upgrade transactional emails**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-24T08:36:14Z
- **Completed:** 2026-04-24T08:37:26Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `lib/email.ts` with module-scope Resend singleton and two typed export functions
- Welcome email template with dark/amber branding, free-tier copy, and dashboard CTA
- Upgrade email template with conditional billing block (amount + next billing date) or Stripe dashboard fallback
- Both helpers throw on Resend error, enabling fire-and-forget `.catch()` at call sites

## Task Commits

1. **Task 1: Create lib/email.ts with Resend client and both template helpers** - `684ce62` (feat)

## Files Created/Modified
- `lib/email.ts` - Resend helper module: BillingDetails interface, sendWelcomeEmail, sendUpgradeEmail, private welcomeHtml() and upgradeHtml() template functions

## Decisions Made
- Used `#f59e0b` for amber (globals.css actual value), not `#f5a623` from CONTEXT.md D-10 (typo — plan explicitly required ignoring D-10's hex)
- `billing.amount !== null && billing.nextBillingDate !== null` for billing block (both must be present for details; either null triggers fallback)
- `RESEND_API_KEY` passed without `!` to Resend constructor so missing key surfaces as SDK error on send(), not a module-load crash

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan (lib/email.ts is the helper only; consumer wiring in Plans 03 and 04).

Note: End-to-end email testing requires `RESEND_API_KEY` (from resend.com dashboard) and `RESEND_FROM_EMAIL` (verified domain address) in `.env.local`. This is an ops prerequisite documented in RESEARCH.md, not a code blocker.

## Next Phase Readiness
- `sendWelcomeEmail(to: string)` ready for import in 03-03 (auth callback welcome trigger)
- `sendUpgradeEmail(to: string, billing: BillingDetails)` ready for import in 03-04 (Stripe webhook upgrade trigger)
- No callers wired yet — Plans 03 and 04 inject the calls
- `npx tsc --noEmit` exits 0 — Resend SDK types resolve cleanly

---
*Phase: 03-legal-email*
*Completed: 2026-04-24*
