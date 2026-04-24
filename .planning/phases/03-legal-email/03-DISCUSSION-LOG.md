# Phase 3: Legal & Email - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 03-legal-email
**Areas discussed:** Legal content depth, Welcome email trigger, Email design/styling, Upgrade email content

---

## Legal content depth

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder-quality | AI-generated content covering all required clauses. [Your Company Name] filled as-is. Enough for Creem to activate — refine with a lawyer post-launch. | |
| Real but basic | Solid policies with actual company name, contact email, jurisdiction. Requires user's real details. | |
| Full production quality | Detailed, jurisdiction-specific policies. Requires lawyer review. | ✓ |

**User's choice:** Full production quality
**Notes:** User followed up selecting "Use smart defaults" — entity name: Pushback, contact: adelina.lipsa@gmail.com, no jurisdiction specified, standard 30-day cancellation. Claude writes complete prose.

---

## Legal page styling

| Option | Description | Selected |
|--------|-------------|----------|
| App theme — dark | Same dark background and typography as the rest of the app. | |
| Plain light prose | White background, standard body text. | |
| Match login/signup style | Same centered card layout as the auth pages. | ✓ |

**User's choice:** Match login/signup style

---

## Welcome email trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Auth callback, post-confirmation | After exchangeCodeForSession. Detect new users by created_at ≤ 60s. Covers both Google OAuth + email/password. | ✓ |
| Signup form submit, immediately | Right when supabase.auth.signUp() succeeds. Email/password only, not Google OAuth. User gets email before activating. | |
| Supabase auth webhook | HTTP hook on user.created. Covers all paths but requires Supabase dashboard config. | |

**User's choice:** Auth callback, post-confirmation (recommended)

---

## Email design/styling

| Option | Description | Selected |
|--------|-------------|----------|
| Branded HTML — dark + amber | Dark background, amber accent, Pushback wordmark. Inline HTML strings, no extra dependency. | ✓ |
| Plain text only | No HTML. Maximally deliverable, zero design work. | |
| React Email templates | JSX templates with @react-email/components. Adds dependency. | |

**User's choice:** Branded HTML — dark + amber (recommended)

---

## Upgrade email content

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — plan change + dashboard link | "You're now Pro. Here's what changed." No Creem payload parsing needed. | |
| Include billing details | Pull amount and next billing date from Creem webhook payload. Requires verifying Creem payload field names. | ✓ |

**User's choice:** Include billing details

---

## Claude's Discretion

- Exact HTML/CSS structure of email templates
- Complete Privacy Policy and Terms of Service body text (written from smart defaults)
- Whether to use RESEND_FROM_EMAIL env var vs. hardcode sender address
- Precise Creem payload field paths for billing amount/date (planner verifies against Creem docs)

## Deferred Ideas

None.
