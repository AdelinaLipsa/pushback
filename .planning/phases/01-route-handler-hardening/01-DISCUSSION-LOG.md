# Phase 1: Route Handler Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 01-route-handler-hardening
**Areas discussed:** Error messages to client, Response history gating, Auth error redirect, Validation breadth on project creation

---

## Error Messages to Client

| Option | Description | Selected |
|--------|-------------|----------|
| Descriptive + actionable | `{ error: 'AI generation failed — please try again' }` — tells user what happened | ✓ |
| Generic | `{ error: 'Something went wrong' }` — minimal | |
| Pass Anthropic error through | Expose raw SDK error string — leaks internals | |

**User's choice:** Descriptive + actionable

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — credit-safe message | "Failed to save response — your credit was not used. Please try again." | ✓ |
| No — generic error is fine | `{ error: 'Failed to save response' }` | |

**User's choice:** Yes — credit-safe message when DB save fails for free users

---

## Response History Gating

| Option | Description | Selected |
|--------|-------------|----------|
| Hard truncation at DB query | `.limit(3)` at query level, page shows only 3 | |
| Soft teaser with upgrade nudge | Show 3 + blurred "X more — upgrade" row | |
| Full list but lock older entries | Fetch all, first 3 normal, rest blurred + overlay CTA | ✓ |

**User's choice:** Full list but lock older entries (fetch all, CSS blur + overlay on entries beyond index 3)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Blurred text + upgrade CTA overlay | `filter: blur` on content, absolute overlay with "Upgrade to Pro" button | ✓ |
| Placeholder row with lock icon | Replace content with locked card text | |

**User's choice:** Blurred text + upgrade CTA overlay

---

## Auth Error Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| /login?error=auth_failed | Redirect to login page with error param; login reads param and shows red banner | ✓ |
| Dedicated /auth-error page | Separate page with explanation + retry button | |

**User's choice:** `/login?error=auth_failed` — reuse existing login page with error banner

---

## Validation Breadth on Project Creation

| Option | Description | Selected |
|--------|-------------|----------|
| Core fields only | title (1-200), client_name (1-200), project_value (positive num), currency (enum), client_email (email) | ✓ |
| Strict required fields only | Just title + client_name, rest pass through unchecked | |

**User's choice:** Core fields — validate all user-controlled fields with Zod

---

| Option | Description | Selected |
|--------|-------------|----------|
| situation: min 10, max 2000 chars | Require meaningful input, cap at requirement limit | ✓ |
| situation: max 2000 only | Literal requirement, no minimum | |

**User's choice:** situation min 10, max 2000 + extra_context string values max 500 chars each

---

## Claude's Discretion

- JSON extraction strategy for malformed contract analysis output (RELY-02): try parse → regex fallback → fail gracefully
- Zod package installation (not yet in package.json)
- Supabase RPC function naming
- Exact error message text beyond the shape decided above
- Structure of try/catch blocks in defend route

## Deferred Ideas

None.
