---
phase: 02-infrastructure-security
fixed_at: 2026-04-24T00:00:00Z
review_path: .planning/phases/02-infrastructure-security/02-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-04-24
**Source review:** .planning/phases/02-infrastructure-security/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: HMAC signature compared with `!==` — timing attack vulnerability

**Files modified:** `app/api/webhooks/creem/route.ts`
**Commit:** ad78fd2
**Applied fix:** Replaced plain string `!==` comparison with `crypto.timingSafeEqual` on Buffer values. Added a buffer length check before calling `timingSafeEqual` to avoid the exception-path timing leak when lengths differ.

---

### CR-02: Supabase write operations have no error handling — silent data loss

**Files modified:** `app/api/webhooks/creem/route.ts`
**Commit:** 2d3385c
**Applied fix:** Destructured `{ error }` from both `.update()` calls (subscription.active/updated and subscription.canceled/expired branches). Added early return of `Response.json({ error: 'Database update failed' }, { status: 500 })` on failure so Creem retries rather than treating a failed write as a successful delivery.

---

### WR-01: `createServiceSupabaseClient` is dead code — service role key exposed unnecessarily

**Files modified:** `lib/supabase/server.ts`
**Commit:** fa31546
**Applied fix:** Removed `createServiceSupabaseClient` entirely. Confirmed zero call sites with grep before removal. `createAdminSupabaseClient` covers the service-role use case; `createServerSupabaseClient` covers the user-scoped use case.

---

### WR-02: JSON.parse on unvalidated webhook body can throw and produce unhandled 500

**Files modified:** `app/api/webhooks/creem/route.ts`
**Commit:** b920ba7
**Applied fix:** Wrapped `JSON.parse(body)` in a try/catch block. Returns `Response.json({ error: 'Invalid JSON body' }, { status: 400 })` on parse failure, preventing unhandled exceptions and log flooding from Creem retries.

---

### WR-03: Missing `X-Content-Type-Options` security header

**Files modified:** `next.config.ts`
**Commit:** 625b841
**Applied fix:** Added `{ key: 'X-Content-Type-Options', value: 'nosniff' }` to the headers array in `next.config.ts`, alongside the existing CSP, HSTS, X-Frame-Options, and Referrer-Policy entries.

---

_Fixed: 2026-04-24_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
