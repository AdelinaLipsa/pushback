# Roadmap: Pushback

## Overview

The scaffold is complete. All pages, routes, and components exist. These 5 phases harden, secure, and complete the missing pieces that stand between the current scaffold and first paying customers. Phases execute in order — reliability first because broken AI calls affect every other phase, infrastructure second because a misconfigured webhook kills revenue from the first paid signup.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Route Handler Hardening** - Atomic plan gating, try/catch error handling, Zod input validation, and robust JSON extraction for all AI routes
- [ ] **Phase 2: Infrastructure & Security** - Service-role client fix, webhook secret guard, middleware rename to proxy.ts, settings route protection, and security headers
- [ ] **Phase 3: Legal & Email** - Privacy Policy, Terms of Service, signup page links, and transactional emails on signup and upgrade
- [ ] **Phase 4: Missing UI** - Project edit form, project delete, contract delete, and pre-wall upgrade nudge at 2/3 usage
- [ ] **Phase 5: Types & Observability** - Supabase type generation, Sentry error capture, and Anthropic spend alert

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
**Plans**: TBD

### Phase 2: Infrastructure & Security
**Goal**: The payment webhook reliably upgrades accounts, the app is protected from basic web attacks, and the Next.js 16 breaking change is addressed before it breaks production
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Deploying without a CREEM_WEBHOOK_SECRET env var causes the webhook handler to fail loudly with an explicit error — paid upgrades are never silently dropped
  2. The app sets Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy, and poweredByHeader: false on all responses
  3. The /settings page requires authentication — unauthenticated access redirects to login
  4. The middleware file is proxy.ts with a proxy export, compatible with Next.js 16
**Plans**: TBD

### Phase 3: Legal & Email
**Goal**: The app is legally compliant enough for Creem to activate live payments, and users receive email confirmation of key account events
**Depends on**: Phase 2
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, EMAIL-01, EMAIL-02
**Success Criteria** (what must be TRUE):
  1. /privacy returns a full Privacy Policy page — not a 404 — that names Anthropic as data processor for uploaded contract PDFs
  2. /terms returns a Terms of Service page with an AI output disclaimer and subscription cancellation terms
  3. The signup page links to /privacy and /terms with working hyperlinks
  4. New signups receive a welcome email that states free-tier limits and links to the dashboard
  5. After a Creem subscription activates, the user receives an upgrade confirmation email with billing confirmation and a dashboard link
**Plans**: TBD
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
**Plans**: TBD
**UI hint**: yes

### Phase 5: Types & Observability
**Goal**: Production errors are visible the moment they happen, Anthropic spend is monitored, and the codebase uses generated types instead of as-any casts on joined queries
**Depends on**: Phase 4
**Requirements**: TYPES-01, OBS-01, OBS-02
**Success Criteria** (what must be TRUE):
  1. Supabase types are generated from the live schema and applied — the defend route, project detail page, and ProjectCard compile without any as-any casts on joined query shapes
  2. Unhandled errors in Route Handlers are captured by Sentry with request context — errors are visible in the Sentry dashboard within seconds of occurring
  3. An Anthropic billing threshold alert is configured — a notification fires before unexpected spend becomes a problem
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Route Handler Hardening | 0/? | Not started | - |
| 2. Infrastructure & Security | 0/? | Not started | - |
| 3. Legal & Email | 0/? | Not started | - |
| 4. Missing UI | 0/? | Not started | - |
| 5. Types & Observability | 0/? | Not started | - |
