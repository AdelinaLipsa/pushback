# Phase 2: Infrastructure & Security - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 02-infrastructure-security
**Areas discussed:** Service-role client fix, CSP policy depth, Middleware scope

---

## Service-role client fix

| Option | Description | Selected |
|--------|-------------|----------|
| New createAdminSupabaseClient() | Add bare createClient export alongside existing function — no cookie hooks, no session management. Existing callers unaffected. | ✓ |
| Replace existing function | Remove cookie hooks from createServiceSupabaseClient everywhere. Simpler API but requires auditing all callers. | |

**User's choice:** New `createAdminSupabaseClient()` (recommended)
**Notes:** Keeps existing `createServiceSupabaseClient` intact; webhook switches to new admin client.

---

## CSP policy depth

| Option | Description | Selected |
|--------|-------------|----------|
| Pragmatic — unsafe-inline allowed | script-src + style-src allow unsafe-inline. Works immediately with Next.js + Tailwind. Blocks third-party scripts and unlisted connect-src. | ✓ |
| Strict — nonce-based | No unsafe-inline. Requires nonce generation in middleware, threading through layout. Stronger but out of scope for Phase 2. | |

**User's choice:** Pragmatic — `unsafe-inline` allowed (recommended)
**Notes:** Nonce-based CSP deferred to a future hardening phase if needed.

---

## Middleware scope

| Option | Description | Selected |
|--------|-------------|----------|
| Just /settings + rename | Add /settings to isDashboardRoute, rename file and export. Minimal diff. | ✓ |
| Restructure route groups | Also refactor isDashboardRoute into a config array. More maintainable but beyond phase scope. | |

**User's choice:** Just /settings + rename (recommended)
**Notes:** No structural changes to the middleware logic.

---

## Claude's Discretion

- Exact CSP directive completeness (img-src, frame-ancestors, font-src) — planner determines from app's actual usage
- Whether to add a deprecation comment on createServiceSupabaseClient

## Deferred Ideas

None.
