# Requirements: Pushback

**Defined:** 2026-04-23
**Core Value:** A freelancer in an uncomfortable client situation gets a professional, ready-to-send response in under 30 seconds.

---

> **Note — Brownfield baseline:** Core app is scaffold-complete. Auth, all 8 defense tools, contract analysis, free/pro gating, response history, and all pages/routes exist. Requirements below cover what must be built or fixed before launch.

---

## v1 Requirements

### Reliability

- [ ] **RELY-01**: User gets a meaningful error message (not a blank 500) when the defend tool fails due to an Anthropic outage or rate limit
- [ ] **RELY-02**: User sees a clear error state when contract analysis fails due to malformed AI output (JSON extraction handles preambles and truncation)
- [ ] **RELY-03**: User is redirected to login with an error message when Google OAuth callback fails (expired or replayed code)
- [ ] **RELY-04**: User's free-tier credit is never consumed when the AI response save to the database fails

### Plan Gating

- [ ] **GATE-01**: Free-tier defense response limit is enforced atomically — concurrent requests cannot both succeed past the 3-response cap
- [ ] **GATE-02**: Free-tier contract analysis limit is enforced atomically — concurrent requests cannot both succeed past the 1-analysis cap
- [ ] **GATE-03**: Response history is consistently gated (free users see last 3 responses; Pro users see full history) — matches what `lib/plans.ts` advertises

### Validation

- [ ] **VALID-01**: Defend route rejects invalid `tool_type` values and `situation` inputs over 2000 characters with a 400 error
- [ ] **VALID-02**: Projects POST route validates `title`, `client_name`, and `project_value` with schema-level type and length checks (not just truthiness)
- [ ] **VALID-03**: Contracts analyze route validates file type and size before calling the Anthropic Files API

### Infrastructure

- [ ] **INFRA-01**: Webhook service-role Supabase client uses cookie-free transport — no session refresh hooks in webhook context
- [ ] **INFRA-02**: Missing `CREEM_WEBHOOK_SECRET` env var fails loudly at the webhook handler (explicit error, not silent HMAC mismatch)
- [ ] **INFRA-03**: `middleware.ts` renamed to `proxy.ts` with `proxy` export (Next.js 16 breaking change)
- [ ] **INFRA-04**: `/settings` route is included in the protected-routes matcher in `proxy.ts`
- [ ] **INFRA-05**: App sets security headers (Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy, `poweredByHeader: false`) via `next.config.ts`

### Legal

- [ ] **LEGAL-01**: `/privacy` page exists with full Privacy Policy — names Anthropic as data processor for contract PDFs, includes data retention and deletion rights
- [ ] **LEGAL-02**: `/terms` page exists with Terms of Service — includes AI output disclaimer (outputs are not legal advice), subscription terms, cancellation policy
- [ ] **LEGAL-03**: Signup page links to `/privacy` and `/terms` with working hyperlinks

### Email

- [ ] **EMAIL-01**: User receives a welcome email after signup that sets free-tier expectations and links to the dashboard
- [ ] **EMAIL-02**: User receives an upgrade confirmation email after a Creem subscription activates — confirms billing, states what changed, includes a back-to-dashboard CTA

### UI — Missing Surfaces

- [ ] **UI-01**: User can edit an existing project (title, client name, project value, situation context)
- [ ] **UI-02**: User can delete a project with a confirmation dialog — deletes project and all associated defense responses
- [ ] **UI-03**: User can delete a contract with a confirmation dialog — also deletes the stored Anthropic Files API PDF
- [ ] **UI-04**: Upgrade nudge appears when a free user has used 2 of 3 defense responses (pre-wall, before the hard block)

### Types & Observability

- [ ] **TYPES-01**: Supabase types generated from schema and applied to server clients — eliminates `as any` casts on joined queries in defend route, project detail page, and ProjectCard
- [ ] **OBS-01**: Sentry (or equivalent) is configured and captures unhandled errors in Route Handlers with request context
- [ ] **OBS-02**: Anthropic spend alert is configured in the Anthropic dashboard (billing threshold notification)

### Proactive Detection

- [ ] **DETECT-01**: User can paste a raw client message into a project and receive an AI-identified situation type (e.g. "scope creep", "late payment") with a brief explanation of why the message was flagged
- [ ] **DETECT-02**: After analysis, the identified defense tool is pre-selected and the situation context is pre-filled from the analyzed message — user can generate a response in one click without re-describing the situation
- [ ] **DETECT-03**: The analyze-message feature is plan-gated — each analysis counts toward the free-tier usage limit alongside defense responses

### Payment Tracking

- [ ] **PAY-01**: User can add a payment due date and expected amount to any project
- [ ] **PAY-02**: Dashboard shows an overdue badge on projects where the payment due date has passed and payment status is not marked as received
- [ ] **PAY-03**: Overdue projects show a one-click "Handle Late Payment" CTA that opens the Late Payment defense tool with payment context (amount, due date, days overdue) pre-filled
- [ ] **PAY-04**: User can mark a payment as received on a project, clearing the overdue badge

## v2 Requirements

### Retention

- **RET-01**: Free-tier users see a usage milestone email when they hit their first 3 responses (prompt to upgrade)
- **RET-02**: Pro users see a monthly usage summary email

### Operations

- **OPS-01**: Supabase connection uses pooler URL (port 6543) for Vercel serverless compatibility
- **OPS-02**: Per-user rate limiting on AI endpoints via Upstash or Vercel middleware (prevents authenticated abuse loops)
- **OPS-03**: Monthly usage counter reset for Pro users with a `usage_reset_at` timestamp and Supabase cron job

### Developer Experience

- **DEV-01**: Critical paths have integration tests (webhook HMAC verification, plan gating, contract JSON parse failure, auth callback expiry)
- **DEV-02**: Orphaned Anthropic Files API PDFs cleaned up when a contract is deleted

### GDPR

- **GDPR-01**: User can submit a data deletion request from the Settings page

## Out of Scope

| Feature | Reason |
|---------|--------|
| Team / agency plans | Post-launch; validate individual demand first |
| Contract template generation | Separate product scope; requires own UX research |
| Chrome extension | Significant platform work; not core to web product |
| Credits-based pricing | Decided against; subscription model chosen |
| Response editing | Responses are ephemeral copy — editing is lower priority than generation quality |
| Custom AI personas / tone settings | Post-launch differentiation feature |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RELY-01 | Phase 1 | Pending |
| RELY-02 | Phase 1 | Pending |
| RELY-03 | Phase 1 | Pending |
| RELY-04 | Phase 1 | Pending |
| GATE-01 | Phase 1 | Pending |
| GATE-02 | Phase 1 | Pending |
| GATE-03 | Phase 1 | Pending |
| VALID-01 | Phase 1 | Pending |
| VALID-02 | Phase 1 | Pending |
| VALID-03 | Phase 1 | Pending |
| INFRA-01 | Phase 2 | Pending |
| INFRA-02 | Phase 2 | Pending |
| INFRA-03 | Phase 2 | Pending |
| INFRA-04 | Phase 2 | Pending |
| INFRA-05 | Phase 2 | Pending |
| LEGAL-01 | Phase 3 | Pending |
| LEGAL-02 | Phase 3 | Pending |
| LEGAL-03 | Phase 3 | Pending |
| EMAIL-01 | Phase 3 | Pending |
| EMAIL-02 | Phase 3 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| TYPES-01 | Phase 5 | Pending |
| OBS-01 | Phase 5 | Pending |
| OBS-02 | Phase 5 | Pending |
| DETECT-01 | Phase 6 | Pending |
| DETECT-02 | Phase 6 | Pending |
| DETECT-03 | Phase 6 | Pending |
| PAY-01 | Phase 7 | Pending |
| PAY-02 | Phase 7 | Pending |
| PAY-03 | Phase 7 | Pending |
| PAY-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-23 after initial definition*
