# Roadmap: Pushback

## Overview

The scaffold is complete. All pages, routes, and components exist. Phases 1–5 harden, secure, and complete the missing pieces between the current scaffold and first paying customers. Phases 6–7 add the two features that close the main competitive gap: proactive client message analysis and lightweight payment tracking — both confirmed missing from every competing tool as of 2026.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Route Handler Hardening** - Atomic plan gating, try/catch error handling, Zod input validation, and robust JSON extraction for all AI routes
- [x] **Phase 2: Infrastructure & Security** - Service-role client fix, webhook secret guard, middleware rename to proxy.ts, settings route protection, and security headers
- [x] **Phase 3: Legal & Email** - Privacy Policy, Terms of Service, signup page links, and transactional emails on signup and upgrade
- [x] **Phase 4: Missing UI** - Project edit form, project delete, contract delete, and pre-wall upgrade nudge at 2/3 usage (completed 2026-04-24)
- [ ] **Phase 5: Types & Observability** - Supabase type generation, Sentry error capture, and Anthropic spend alert
- [x] **Phase 6: Proactive Detection** - Analyze a raw client message, identify the situation type, pre-fill the right defense tool (completed 2026-04-24)
- [ ] **Phase 7: Payment Tracking** - Add payment due date per project, dashboard overdue badge, one-click Late Payment tool pre-fill

## Phase Details

### Phase 1: Route Handler Hardening
**Goal**: All AI route handlers are safe under real conditions — concurrent users cannot exceed free-tier limits, Anthropic errors surface to the user, and malformed input is rejected before reaching the API
**Depends on**: Nothing (first phase)
**Requirements**: RELY-01, RELY-02, RELY-03, RELY-04, GATE-01, GATE-02, GATE-03, VALID-01, VALID-02, VALID-03
**Success Criteria** (what must be TRUE):
  1. When Anthropic is unreachable, the defend route returns a readable error message to the user — not a blank 500 or unhandled promise rejection
  2. When contract analysis returns truncated or preamble-wrapped JSON, the route extracts what it can and reports a clear failure state instead of throwing
  3. When two concurrent requests from the same free user hit the defend route simultaneously, exactly one succeeds and one is blocked — the usage counter never exceeds 3
  4. When a free user's AI response fails to save, their usage counter is not incremented — they do not lose a credit
  5. Submitting a defend request with an invalid tool type or a situation over 2000 characters returns a 400 error with a description of what failed
**Plans**: 7 plans
Plans:
- [x] 01-01-PLAN.md — Install Zod and write + apply atomic RPC migration (Wave 0, prerequisite)
- [x] 01-02-PLAN.md — Fix auth callback error handling, login error banner, off-topic system prompt guard (Wave 1)
- [x] 01-03-PLAN.md — Harden defend route: Zod + atomic RPC gate + try/catch + credit-safe insert (Wave 2)
- [x] 01-04-PLAN.md — Harden contracts analyze route: file validation + atomic RPC + extractJson + credit-safe update (Wave 2)
- [x] 01-05-PLAN.md — Add Zod schema to projects POST route (Wave 2)
- [x] 01-06-PLAN.md — Response history gating: history page plan fetch + ResponseHistory locked cards (Wave 3)
- [x] 01-07-PLAN.md — GATE-03 gap closure: server-side response slicing + count-only placeholder card (gap closure)

### Phase 2: Infrastructure & Security
**Goal**: The payment webhook reliably upgrades accounts, the app is protected from basic web attacks, and the Next.js 16 breaking change is addressed before it breaks production
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Deploying without a CREEM_WEBHOOK_SECRET env var causes the webhook handler to fail loudly with an explicit error — paid upgrades are never silently dropped
  2. The app sets Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy, and poweredByHeader: false on all responses
  3. The /settings page requires authentication — unauthenticated access redirects to login
  4. The middleware file is proxy.ts with a proxy export, compatible with Next.js 16
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — Add createAdminSupabaseClient() to server.ts; add secret guard + admin client to webhook handler (Wave 1)
- [x] 02-02-PLAN.md — Create proxy.ts (rename middleware.ts, export proxy, add /settings to isDashboardRoute) (Wave 1)
- [x] 02-03-PLAN.md — Add security headers to next.config.ts: CSP, HSTS, X-Frame-Options, Referrer-Policy, poweredByHeader: false (Wave 1)

### Phase 3: Legal & Email
**Goal**: The app is legally compliant enough to activate live Stripe payments, and users receive email confirmation of key account events
**Depends on**: Phase 2
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, EMAIL-01, EMAIL-02
**Success Criteria** (what must be TRUE):
  1. /privacy returns a full Privacy Policy page — not a 404 — that names Anthropic as data processor for uploaded contract PDFs
  2. /terms returns a Terms of Service page with an AI output disclaimer and subscription cancellation terms
  3. The signup page links to /privacy and /terms with working hyperlinks
  4. New signups receive a welcome email that states free-tier limits and links to the dashboard
  5. After a Stripe subscription activates, the user receives an upgrade confirmation email with billing confirmation and a dashboard link
**Plans**: 4 plans
Plans:
- [x] 03-01-PLAN.md — Create /privacy and /terms pages + convert signup legal footer to Link components (Wave 1)
- [x] 03-02-PLAN.md — Create lib/email.ts with Resend client + sendWelcomeEmail + sendUpgradeEmail helpers (Wave 1)
- [x] 03-03-PLAN.md — Wire welcome email into auth callback with new-signup detection and fire-and-forget (Wave 2)
- [x] 03-04-PLAN.md — Wire upgrade confirmation email into Stripe webhook checkout.session.completed block (Wave 2)
**UI hint**: yes

### Phase 4: Missing UI
**Goal**: Users can manage their projects and contracts fully — edit, delete, and see upgrade prompts before hitting the hard paywall
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. A user can open an existing project and edit its title, client name, project value, and situation context — changes persist on save
  2. A user can delete a project from a confirmation dialog — the project and all its defense responses are removed
  3. A user can delete a contract from a confirmation dialog — the record and the stored Anthropic Files API PDF are removed
  4. A free user who has used 2 of 3 defense responses sees an upgrade nudge before their next generation — not only after the hard block fires
**Plans**: 4 plans
Plans:
- [x] 04-01-PLAN.md — Install shadcn Dialog, create lib/ui.ts shared style constants, add --brand-lime to globals.css (Wave 0)
- [x] 04-02-PLAN.md — Update contracts DELETE route with Anthropic file cleanup; create ContractDeleteButton component; wire into contract detail page (Wave 1)
- [x] 04-03-PLAN.md — Create ProjectHeader client component with inline edit form + delete Dialog; wire into project detail page (Wave 1)
- [x] 04-04-PLAN.md — Add isNearLimit nudge strip to DefenseDashboard with lime accent and handleUpgrade CTA (Wave 1)
**UI hint**: yes

### Phase 5: Types & Observability
**Goal**: Production errors are visible the moment they happen, Anthropic spend is monitored, and the codebase uses generated types instead of as-any casts on joined queries
**Depends on**: Phase 4
**Requirements**: TYPES-01, OBS-01, OBS-02
**Success Criteria** (what must be TRUE):
  1. Supabase types are generated from the live schema and applied — the defend route, project detail page, and ProjectCard compile without any as-any casts on joined query shapes
  2. Unhandled errors in Route Handlers are captured by Sentry with request context — errors are visible in the Sentry dashboard within seconds of occurring
  3. An Anthropic billing threshold alert is configured — a notification fires before unexpected spend becomes a problem
**Plans**: 3 plans
Plans:
- [ ] 05-01-PLAN.md — Generate database.types.ts, apply Database generic to supabase server/client/admin factories, add gen:types + types:check scripts (Wave 1)
- [ ] 05-02-PLAN.md — Remove as-any casts in defend/route.ts, ProjectCard.tsx, and project detail page using typed client (Wave 2)
- [ ] 05-03-PLAN.md — Install @sentry/nextjs, create instrumentation.ts + instrumentation-client.ts + sentry.server.config.ts, wrap next.config.ts with withSentryConfig, extend CSP connect-src, configure Anthropic spend alert (Wave 1)

### Phase 6: Proactive Detection
**Goal**: Freelancers can paste any raw client message and immediately know what kind of situation they're dealing with and which response to send — closing the gap no competitor has addressed
**Depends on**: Phase 5
**Requirements**: DETECT-01, DETECT-02, DETECT-03
**Success Criteria** (what must be TRUE):
  1. A user can paste a client message into a project and receive a situation classification (e.g. "scope creep") with a 1-sentence explanation of why — in under 5 seconds
  2. After analysis, clicking through pre-selects the correct defense tool and pre-fills the situation field with context extracted from the message — no re-typing required
  3. Each message analysis counts against the free-tier limit; free users who have used all 3 credits see the upgrade prompt instead of the analyze button
**Plans**: 3 plans
Plans:
- [x] 06-01-PLAN.md — Add MessageAnalysis type to types/index.ts, CLASSIFY_SYSTEM_PROMPT to lib/anthropic.ts, initialSituation prop to SituationPanel.tsx (Wave 1)
- [x] 06-02-PLAN.md — Create POST /api/projects/[id]/analyze-message route: auth, RPC gate, Anthropic call, Zod validation, compensating decrement (Wave 2)
- [x] 06-03-PLAN.md — Update DefenseDashboard.tsx: analyze section card, result banner, Start over, divider, handleAnalyze, SituationPanel pre-fill (Wave 3)
**UI hint**: yes

### Phase 7: Payment Tracking
**Goal**: Freelancers can see at a glance which clients owe them money and jump directly to a pre-filled late payment response — closing the gap that FreshBooks partially covers but without requiring invoice management
**Depends on**: Phase 6
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):
  1. A user can set a payment due date and expected amount on any project — the fields save and persist
  2. The dashboard shows an overdue indicator on any project where the payment due date has passed and payment is not marked received
  3. An overdue project shows a "Handle Late Payment" button that opens the Late Payment defense tool with amount, due date, and days overdue already filled in
  4. A user can mark a payment as received — the overdue indicator clears immediately
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Route Handler Hardening | 6/6 | Complete | 2026-04-24 |
| 2. Infrastructure & Security | 3/3 | Complete | 2026-04-24 |
| 3. Legal & Email | 4/4 | Complete | 2026-04-24 |
| 4. Missing UI | 4/4 | Complete   | 2026-04-24 |
| 5. Types & Observability | 0/3 | Planned | - |
| 6. Proactive Detection | 3/3 | Complete | 2026-04-24 |
| 7. Payment Tracking | 0/? | Not started | - |
