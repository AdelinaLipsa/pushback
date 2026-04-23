---
phase: 01-route-handler-hardening
verified: 2026-04-24T00:00:00Z
status: gaps_found
score: 9/12 must-haves verified
overrides_applied: 0
gaps:
  - truth: "GATE-03: Response history consistently gated — free users see only last 3 responses"
    status: failed
    reason: "All response data (including locked responses) is fetched from the DB and rendered into the DOM. The blur is CSS-only (filter: blur(4px)). Full response text is in <pre>{r.response}</pre> inside the blurred div — accessible via DevTools. Server-side data slicing is absent. This was flagged in CR-02 of 01-REVIEW.md and is the exact gap described in the requirements: 'free users see last 3 responses' is not enforced at the data layer."
    artifacts:
      - path: "app/(dashboard)/projects/[id]/history/page.tsx"
        issue: "Fetches all defense_responses from DB with no .limit() or .range() for free users. All response rows are sent to the client regardless of plan."
      - path: "components/defense/ResponseHistory.tsx"
        issue: "isLocked = plan === 'free' && index >= 3 applies CSS blur but full r.response text is rendered in the DOM inside the blurred div (line 89). A user who removes the CSS filter can read all locked content without any network request."
    missing:
      - "In history/page.tsx: slice responses to 3 for free users before passing to ResponseHistory (or query with .limit(3) when plan === 'free'). Pass only a lockedCount integer for locked entries."
      - "In ResponseHistory.tsx: render placeholder cards for lockedCount (no real response text in DOM) instead of blurring real content."

  - truth: "RELY-03: REQUIREMENTS.md marks this requirement as complete in the codebase but the tracking document still shows [ ] and 'Pending'"
    status: partial
    reason: "The code is fully implemented and correct: auth/callback/route.ts captures exchangeCodeForSession error and redirects to /login?error=auth_failed; login/page.tsx reads the param via useSearchParams and shows the banner. However, REQUIREMENTS.md still has [ ] checkmark and Pending status for RELY-03. This is a documentation tracking gap, not a code gap."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Line 18 shows '[ ] **RELY-03**' (unchecked) and the traceability table at line 117 shows 'RELY-03 | Phase 1 | Pending'. The implementation is complete."
    missing:
      - "Update REQUIREMENTS.md: change [ ] to [x] for RELY-03 and change traceability status from 'Pending' to 'Complete (01-02)'"

  - truth: "VALID-02: REQUIREMENTS.md marks this requirement as complete in the codebase but the tracking document still shows [ ] and 'Pending'"
    status: partial
    reason: "The code is fully implemented and correct: app/api/projects/route.ts has the full projectSchema with title/client_name max(200), email format, positive project_value, currency enum, notes max(2000), and safeParse with first-issue 400 response. However, REQUIREMENTS.md still has [ ] and 'Pending' status."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Line 29 shows '[ ] **VALID-02**' (unchecked) and the traceability table at line 122 shows 'VALID-02 | Phase 1 | Pending'. The implementation is complete."
    missing:
      - "Update REQUIREMENTS.md: change [ ] to [x] for VALID-02 and change traceability status from 'Pending' to 'Complete (01-05)'"

human_verification:
  - test: "GATE-03 server-side slicing — confirm locked response text is absent from the HTML source"
    expected: "Free user with 4+ responses: view-source or DevTools shows only 3 response cards with real text. Card 4+ shows placeholder content only (no r.response text in the DOM)."
    why_human: "Requires a real browser session as a free user with seeded response data. Cannot verify DOM content programmatically without running the server."

  - test: "RELY-03 end-to-end OAuth error flow"
    expected: "Using an expired or replayed OAuth code (or a manually crafted callback URL with an invalid code) redirects to /login?error=auth_failed and displays the red 'Sign-in link expired — please try again.' banner."
    why_human: "Requires a real Supabase OAuth session and an expired code — cannot simulate without a live auth provider."
---

# Phase 01: Route Handler Hardening — Verification Report

**Phase Goal:** All AI route handlers are safe under real conditions — concurrent users cannot exceed free-tier limits, Anthropic errors surface to the user, and malformed input is rejected before reaching the API
**Verified:** 2026-04-24T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Anthropic errors on defend route return `{ error: 'AI generation failed — please try again' }` with status 500 | VERIFIED | `defend/route.ts:128` — catch block returns exact D-01 string; compensating decrement also applied |
| 2 | DB insert failure on defend route returns credit-safe error and restores preIncrementCount | VERIFIED | `defend/route.ts:111-118` — saveError check with compensating decrement + D-02 exact string |
| 3 | Two concurrent free-tier defend requests: exactly one succeeds, one gets UPGRADE_REQUIRED | VERIFIED | `defend/route.ts:33-39` — `supabase.rpc('check_and_increment_defense_responses')` with FOR UPDATE row lock in SQL (002_atomic_gating.sql:11-15) |
| 4 | Defend route rejects invalid tool_type or situation <10/>2000 chars with 400 | VERIFIED | `defend/route.ts:17-24` — Zod schema with z.enum(Object.keys(TOOL_LABELS)), z.string().min(10).max(2000); safeParse returns 400 |
| 5 | Contract analysis: Claude preamble-wrapped JSON is extracted, not rejected | VERIFIED | `analyze/route.ts:7-17` — extractJson helper: try JSON.parse, fallback to /\{[\s\S]*\}/ regex, throws 'No valid JSON found in response' |
| 6 | Contract analysis: both JSON.parse and regex fail → returns specific malformed output error | VERIFIED | `analyze/route.ts:133-136` — catch block detects 'No valid JSON found in response' message, returns exact D-13 string |
| 7 | Non-PDF uploads rejected 400 before Anthropic Files API call | VERIFIED | `analyze/route.ts:61-65` — file.type !== 'application/pdf' check before arrayBuffer/upload |
| 8 | Files over 10 MB rejected with 400 before Anthropic Files API call | VERIFIED | `analyze/route.ts:66-70` — file.size > 10 * 1024 * 1024 check before upload |
| 9 | Two concurrent free-tier contract analysis requests: one succeeds, one gets UPGRADE_REQUIRED | VERIFIED | `analyze/route.ts:25-31` — `supabase.rpc('check_and_increment_contracts')` with FOR UPDATE lock |
| 10 | Expired/replayed OAuth code redirects to /login?error=auth_failed | VERIFIED | `auth/callback/route.ts:10-13` — const { error } = await exchangeCodeForSession(code); on error returns NextResponse.redirect(origin/login?error=auth_failed) |
| 11 | Login page displays red error banner on ?error=auth_failed | VERIFIED | `login/page.tsx:52-64` — authError === 'auth_failed' conditional with styled red banner, text 'Sign-in link expired — please try again.' |
| 12 | Free users see only 3 responses in history; additional responses are gated | FAILED | CSS blur only — full response data rendered in DOM for all fetched rows. Server fetches all rows unconditionally. CR-02 of REVIEW.md explicitly identified this gap. |

**Score: 9/12 truths verified (GATE-03 fails; RELY-03 and VALID-02 implementation correct but REQUIREMENTS.md tracking is stale)**

---

### Deferred Items

No items deferred to later phases. GATE-03 is a Phase 1 requirement with no later-phase coverage.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/002_atomic_gating.sql` | Atomic RPC functions with FOR UPDATE | VERIFIED | Both check_and_increment_defense_responses and check_and_increment_contracts present with FOR UPDATE row lock, jsonb_build_object return |
| `app/api/projects/[id]/defend/route.ts` | Hardened: Zod, RPC gate, try/catch, credit-safe insert | VERIFIED | All four hardening elements present and wired |
| `app/api/contracts/analyze/route.ts` | Hardened: file validation, RPC gate, extractJson, credit-safe update | VERIFIED | All four hardening elements present and wired |
| `app/auth/callback/route.ts` | Error detection on exchangeCodeForSession | VERIFIED | Error captured and redirected correctly |
| `app/(auth)/login/page.tsx` | Auth error banner via useSearchParams | VERIFIED | useSearchParams, authError check, styled banner all present |
| `lib/anthropic.ts` | DEFENSE_SYSTEM_PROMPT with off-topic guard | VERIFIED | OFF-TOPIC GUARD block present before 'Return only the message text.' |
| `app/api/projects/route.ts` | Zod schema validation on POST | VERIFIED | projectSchema with all required fields, safeParse wired |
| `app/(dashboard)/projects/[id]/history/page.tsx` | Fetches plan, passes to ResponseHistory | VERIFIED (partial) | Plan fetched from user_profiles, passed as prop — but all rows fetched regardless of plan |
| `components/defense/ResponseHistory.tsx` | Plan prop, isLocked logic, blur + overlay | VERIFIED (partial) | isLocked, blur, overlay, and CTA all present — but locked content text is in DOM |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| defend/route.ts | check_and_increment_defense_responses | supabase.rpc() | WIRED | Line 34, exact function name match |
| analyze/route.ts | check_and_increment_contracts | supabase.rpc() | WIRED | Line 26, exact function name match |
| defend/route.ts | defense_responses insert | saveError check | WIRED | Lines 105-118, saveError check with compensating decrement |
| analyze/route.ts | extractJson(rawText) | replaces bare JSON.parse | WIRED | Line 100, extractJson called with rawText; function defined at line 7 |
| auth/callback/route.ts | login/page.tsx | redirect to /login?error=auth_failed | WIRED | Line 12 in callback; line 52 in login page |
| login/page.tsx | useSearchParams | searchParams.get('error') | WIRED | Line 5 import, line 10-11 hook call and .get('error') |
| history/page.tsx | ResponseHistory.tsx | plan prop from fetched profile | WIRED | Line 30 — plan={(profile?.plan ?? 'free') as Plan} |
| ResponseHistory.tsx | /api/checkout | handleUpgrade POST | WIRED | Lines 28-36 — fetch('/api/checkout', { method: 'POST' }) |
| history/page.tsx | DOM exposure of locked content | server-side slice | NOT WIRED | No .limit() or .slice() for free users before passing responses array; all rows reach client |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| ResponseHistory.tsx | responses (locked cards) | history/page.tsx DB query — all rows | Yes, real data — but sent to client for ALL rows | HOLLOW_PROP for locked entries — r.response text rendered inside blurred div; plan-locked content in DOM |
| defend/route.ts | gateResult | supabase.rpc() | Yes — DB transaction with FOR UPDATE | FLOWING |
| analyze/route.ts | gateResult | supabase.rpc() | Yes — DB transaction with FOR UPDATE | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — all AI-touching checks require live Anthropic API and live Supabase. Static file checks cover the implementation patterns.

Grep-based pattern checks run manually:

| Pattern | File | Result | Status |
|---------|------|--------|--------|
| `check_and_increment_defense_responses` | defend/route.ts:34 | Found | PASS |
| `preIncrementCount` | defend/route.ts | Found 4 times (lines 41, 52, 68, 126) | PASS |
| `saveError` | defend/route.ts:105,111 | Found | PASS |
| `AI generation failed — please try again` | defend/route.ts:128 | Found | PASS |
| `check_and_increment_contracts` | analyze/route.ts:26 | Found | PASS |
| `extractJson(rawText)` | analyze/route.ts:100 | Found | PASS |
| `application/pdf` | analyze/route.ts:61 | Found | PASS |
| `10 * 1024 * 1024` | analyze/route.ts:66 | Found | PASS |
| `error=auth_failed` | auth/callback/route.ts:12 | Found | PASS |
| `useSearchParams` | login/page.tsx:5 | Found | PASS |
| `auth_failed` | login/page.tsx:52 | Found | PASS |
| `This tool is designed for freelancer-client situations only` | lib/anthropic.ts:133 | Found | PASS |
| `projectSchema.safeParse` | projects/route.ts:34 | Found | PASS |
| `z.string().email()` | projects/route.ts:9 | Found | PASS |
| `plan === 'free' && index >= 3` | ResponseHistory.tsx:47 | Found | PASS |
| Server-side limit/slice for free users | history/page.tsx | Not found | FAIL — all rows fetched |
| `for update` (row lock) | 002_atomic_gating.sql:14,45 | Found both | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RELY-01 | 01-03 | Meaningful error on Anthropic failure | SATISFIED | catch block in defend/route.ts:121-129, returns D-01 string |
| RELY-02 | 01-04 | Clear error on contract analysis malformed AI output | SATISFIED | extractJson helper + D-13 error string in analyze/route.ts |
| RELY-03 | 01-02 | Redirect to login with error on OAuth failure | SATISFIED (code) / STALE (docs) | auth/callback/route.ts implements correctly; REQUIREMENTS.md still shows [ ] Pending |
| RELY-04 | 01-03 | Free-tier credit never consumed on DB save failure | SATISFIED | preIncrementCount compensating decrement on all failure paths in defend/route.ts |
| GATE-01 | 01-01 + 01-03 | Atomic free-tier defend limit enforcement | SATISFIED | RPC with FOR UPDATE, called in defend/route.ts |
| GATE-02 | 01-01 + 01-04 | Atomic free-tier contract analysis limit enforcement | SATISFIED | RPC with FOR UPDATE, called in analyze/route.ts |
| GATE-03 | 01-06 | Response history gating — free users see last 3 only | BLOCKED | CSS blur only; full response data in DOM; server sends all rows to client |
| VALID-01 | 01-03 | Defend route rejects invalid tool_type, oversized situation | SATISFIED | Zod schema in defend/route.ts validates both |
| VALID-02 | 01-05 | Projects POST schema-level validation | SATISFIED (code) / STALE (docs) | projectSchema.safeParse in projects/route.ts; REQUIREMENTS.md still shows [ ] Pending |
| VALID-03 | 01-04 | Contracts route validates file type and size | SATISFIED | file.type and file.size checks before Anthropic upload in analyze/route.ts |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `components/defense/ResponseHistory.tsx:89` | `{r.response}` inside blurred div — full text in DOM for all fetched rows | Blocker | Free users can read locked history by inspecting DOM; GATE-03 not enforced at data layer |
| `app/(dashboard)/projects/[id]/history/page.tsx:15` | All defense_responses fetched with no plan-based limit | Blocker | All row data sent to client regardless of plan |
| `app/auth/callback/route.ts:5,16` | `origin` extracted from request.url, used directly in redirect without validation | Warning (security, CR-01) | Open redirect — attacker can craft a callback URL with evil.com as origin; not a Phase 1 requirement but documented in REVIEW.md |
| `supabase/migrations/002_atomic_gating.sql:11,42` | No COALESCE on plan column — NULL plan falls through to allowed = false | Warning (WR-03) | Users with NULL plan silently get UPGRADE_REQUIRED instead of 'free' behavior; edge case |
| `app/api/contracts/analyze/route.ts:41-54` | Contract DB row inserted before input validation runs (file type/size checked after insert) | Warning (WR-04) | Failed validation leaves orphan 'error' status rows; WR-04 from REVIEW.md |
| `.planning/REQUIREMENTS.md` | RELY-03 and VALID-02 marked [ ] Pending — both are implemented in code | Info | Stale tracking — does not affect code behavior but creates false impression of incomplete work |

---

### Human Verification Required

#### 1. GATE-03 DOM Inspection Test

**Test:** As a free user with 4+ defense responses in a project, navigate to `/projects/{id}/history`, right-click any blurred card (index 3+), and inspect the DOM. Look inside the `<div style="filter: blur(4px)...">` element.

**Expected (current — FAILING):** The `<pre>` element inside the blurred div contains the full response text — visible in DevTools source.

**Expected (after fix):** No `<pre>` element with response text exists for locked cards. Only a placeholder card (e.g., "1 response hidden — Upgrade to Pro") is in the DOM.

**Why human:** Requires a real browser session with a free-tier user account and seeded response data to confirm DOM content vs. CSS visibility.

#### 2. RELY-03 OAuth Error Redirect

**Test:** Trigger an expired or replayed OAuth callback by navigating to `/auth/callback?code=INVALID_OR_EXPIRED_CODE` or waiting for a code to expire after first use.

**Expected:** Browser redirects to `/login?error=auth_failed` and the red banner "Sign-in link expired — please try again." is displayed.

**Why human:** Requires a real Supabase project OAuth code — cannot simulate without a live auth provider and valid-then-expired token.

---

### Gaps Summary

**One code gap blocks full goal achievement:**

**GATE-03 is not enforced at the data layer.** The plan's decision D-04 explicitly accepted CSS blur as cosmetic gating ("A determined user could inspect the DOM/network response") and the threat model at T-06-01 and T-06-02 accepted this. However, the GATE-03 requirement as written in REQUIREMENTS.md says "free users see last 3 responses" — which implies the data is unavailable, not merely obscured. The code review (CR-02) flagged this as a critical issue. The blur + overlay is a UX affordance; it is not a security control. Any free user can reveal all history without any elevated capability.

**Root cause:** The fix requires two coordinated changes: (1) slice responses to 3 in history/page.tsx before passing to the component (or use a server-side DB limit), and (2) render a non-data placeholder for locked slots in ResponseHistory.tsx.

**Two documentation tracking gaps** (RELY-03 and VALID-02 marked Pending in REQUIREMENTS.md) do not affect code behavior but will create confusion for future phases if not corrected.

**Additional warnings from REVIEW.md** (CR-01 open redirect, WR-03 NULL plan edge case, WR-04 orphan rows) are documented above. They were noted as out-of-phase-scope issues in the review but are surfaced here for completeness. None of them are Phase 1 requirements.

---

_Verified: 2026-04-24T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
