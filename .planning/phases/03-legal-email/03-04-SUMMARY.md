---
phase: 03-legal-email
plan: 04
subsystem: payments
tags: [email, resend, stripe, webhook, upgrade]

requires:
  - phase: 03-02
    provides: lib/email.ts with sendUpgradeEmail export and BillingDetails type

provides:
  - Upgrade confirmation email fires after checkout.session.completed DB update
  - Graceful billing detail extraction with Stripe v22 SubscriptionItem field path

affects: [email delivery, stripe webhook, subscription lifecycle]

tech-stack:
  added: []
  patterns: [fire-and-forget email in webhook, graceful Stripe v22 SubscriptionItem field path, null-fallback billing details]

key-files:
  created: []
  modified: [app/api/webhooks/stripe/route.ts]

key-decisions:
  - "current_period_end from sub.items.data[0].current_period_end not sub root — Stripe v22 breaking change"
  - "Wrap subscription retrieve in try/catch; BillingDetails falls back to null on any failure"
  - "Reused existing supabase admin client — no second createAdminSupabaseClient() instance"
  - "Fire-and-forget sendUpgradeEmail(...).catch() — email failure never causes non-2xx webhook response"

requirements-completed:
  - EMAIL-02

duration: 4min
completed: 2026-04-24
---

# Phase 3 Plan 04: Upgrade Email Trigger Summary

**Stripe webhook now sends a branded upgrade confirmation email with billing amount and next billing date after every successful checkout — fire-and-forget, Stripe v22 SubscriptionItem field path, null-safe fallback.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-24T08:40:00Z
- **Completed:** 2026-04-24T08:44:13Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments

- `app/api/webhooks/stripe/route.ts`: added `sendUpgradeEmail` import, email injection block after successful DB update in `checkout.session.completed`
- Fetches user email from `user_profiles` via the existing admin client (no second instance)
- Billing amount formatted from `session.amount_total` + `session.currency`; next billing date from `sub.items.data[0].current_period_end` (Stripe v22 path)
- Try/catch around subscription retrieve; any failure or missing field uses `null` billing details — email still sends with Stripe dashboard fallback copy
- Fire-and-forget `.catch(console.error)` — webhook always returns 2xx regardless of email outcome

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
