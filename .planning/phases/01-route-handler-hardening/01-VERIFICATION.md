---
phase: 01-route-handler-hardening
verified: 2026-04-24T12:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/12
  gaps_closed:
    - "GATE-03: Server-side slicing now present (allResponses.slice(0, 3)); lockedCount integer passed instead of response data; ResponseHistory.tsx has no isLocked, no filter:blur, no plan prop, and renders a placeholder card with no real response text"
    - "RELY-03 tracking: REQUIREMENTS.md now shows [x] for RELY-03 with 'Complete (01-02)' in traceability table"
    - "VALID-02 tracking: REQUIREMENTS.md now shows [x] for VALID-02 with 'Complete (01-05)' in traceability table"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "GATE-03 DOM inspection — locked response text absent from HTML"
    expected: "Free user with 4+ responses navigates to /projects/{id}/history. View-source or DevTools shows exactly 3 response cards with real text. Card 4+ does not exist in the DOM. A single placeholder card shows 'N response(s) hidden — Upgrade to Pro' with the amber button — no r.response text anywhere in the DOM."
    why_human: "Requires a real browser session as a free user with 4+ seeded defense_responses for a project. DOM content cannot be verified programmatically without running the server."
  - test: "RELY-03 OAuth error redirect end-to-end"
    expected: "Using an expired or replayed OAuth callback code redirects to /login?error=auth_failed and displays the red 'Sign-in link expired — please try again.' banner."
    why_human: "Requires a real Supabase OAuth session with a genuinely expired/replayed code — cannot simulate without a live auth provider."
---

# Phase 01: Route Handler Hardening — Verification Report

**Phase Goal:** All AI route handlers are safe under real conditions — concurrent users cannot exceed free-tier limits, Anthropic errors surface to the user, and malformed input is rejected before reaching the API
**Verified:** 2026-04-24T12:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after GATE-03 gap closure (plan 01-07)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Anthropic errors on defend route return `{ error: 'AI generation failed — please try again' }` with status 500 | VERIFIED | `defend/route.ts:128` — catch block returns exact D-01 string; compensating decrement applied |
| 2 | DB insert failure on defend route returns credit-safe error and restores preIncrementCount | VERIFIED | `defend/route.ts:111-118` — saveError check with compensating decrement + D-02 exact string |
| 3 | Two concurrent free-tier defend requests: exactly one succeeds, one gets UPGRADE_REQUIRED | VERIFIED | `defend/route.ts:34` — `supabase.rpc('check_and_increment_defense_responses')` with FOR UPDATE row lock in `002_atomic_gating.sql:14` |
| 4 | Defend route rejects invalid tool_type or situation <10/>2000 chars with 400 | VERIFIED | `defend/route.ts:17-24` — Zod schema with z.enum(Object.keys(TOOL_LABELS)), z.string().min(10).max(2000); safeParse returns 400 |
| 5 | Contract analysis: Claude preamble-wrapped JSON is extracted, not rejected | VERIFIED | `analyze/route.ts:7-17` — extractJson helper: try JSON.parse, fallback to /\{[\s\S]*\}/ regex, throws 'No valid JSON found in response' |
| 6 | Contract analysis: both JSON.parse and regex fail → returns specific malformed output error with status 500 | VERIFIED | `analyze/route.ts:133-136` — catch block detects 'No valid JSON found in response' message, returns exact D-13 string |
| 7 | Non-PDF uploads rejected 400 before Anthropic Files API call | VERIFIED | `analyze/route.ts:61-65` — `file.type !== 'application/pdf'` check before arrayBuffer/upload |
| 8 | Files over 10 MB rejected with 400 before Anthropic Files API call | VERIFIED | `analyze/route.ts:66-70` — `file.size > 10 * 1024 * 1024` check before upload |
| 9 | Two concurrent free-tier contract analysis requests: one succeeds, one gets UPGRADE_REQUIRED | VERIFIED | `analyze/route.ts:26` — `supabase.rpc('check_and_increment_contracts')` with FOR UPDATE lock |
| 10 | Expired/replayed OAuth code redirects to /login?error=auth_failed | VERIFIED | `auth/callback/route.ts:10-12` — `const { error } = await exchangeCodeForSession(code)`; on error returns `NextResponse.redirect(origin/login?error=auth_failed)` |
| 11 | Login page displays red error banner on ?error=auth_failed | VERIFIED | `login/page.tsx:52` — `authError === 'auth_failed'` conditional with styled red banner, text 'Sign-in link expired — please try again.' |
| 12 | Free users see only 3 responses in history; locked response text is never transmitted to the client | VERIFIED | `history/page.tsx:23-24` — `allResponses.slice(0, 3)` for free users; `lockedCount` integer passed; `ResponseHistory.tsx` has no isLocked, no filter:blur, no plan prop, no r.response text in placeholder card |

**Score: 12/12 truths verified**

---

### Deferred Items

None. All Phase 1 requirements are satisfied by the current codebase.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/002_atomic_gating.sql` | Atomic RPC functions with FOR UPDATE | VERIFIED | Both check_and_increment_defense_responses and check_and_increment_contracts present with FOR UPDATE row lock and jsonb_build_object return |
| `app/api/projects/[id]/defend/route.ts` | Hardened: Zod, RPC gate, try/catch, credit-safe insert | VERIFIED | All four hardening elements present and wired |
| `app/api/contracts/analyze/route.ts` | Hardened: file validation, RPC gate, extractJson, credit-safe update | VERIFIED | All four hardening elements present and wired |
| `app/auth/callback/route.ts` | Error detection on exchangeCodeForSession | VERIFIED | Error captured and redirected correctly |
| `app/(auth)/login/page.tsx` | Auth error banner via useSearchParams | VERIFIED | useSearchParams, authError check, styled banner all present |
| `lib/anthropic.ts` | DEFENSE_SYSTEM_PROMPT with off-topic guard | VERIFIED | OFF-TOPIC GUARD block present before 'Return only the message text.' |
| `app/api/projects/route.ts` | Zod schema validation on POST | VERIFIED | projectSchema with all required fields, safeParse wired |
| `app/(dashboard)/projects/[id]/history/page.tsx` | Server-side plan slicing before passing to ResponseHistory | VERIFIED | `allResponses.slice(0, 3)` for free users; `lockedCount` computed; `visibleResponses` + `lockedCount` passed to component — `plan=` prop removed |
| `components/defense/ResponseHistory.tsx` | lockedCount prop, placeholder card, no blur, no isLocked, no plan prop | VERIFIED | lockedCount:number prop, placeholder card with `lockedCount > 0` conditional, zero occurrences of isLocked / filter:blur / plan:Plan / Plan import |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| defend/route.ts | check_and_increment_defense_responses | supabase.rpc() | WIRED | Line 34, exact function name match |
| analyze/route.ts | check_and_increment_contracts | supabase.rpc() | WIRED | Line 26, exact function name match |
| defend/route.ts | defense_responses insert | saveError check | WIRED | saveError check with compensating decrement on all failure paths |
| analyze/route.ts | extractJson(rawText) | replaces bare JSON.parse | WIRED | Line 100, extractJson called with rawText; function defined at line 7 |
| auth/callback/route.ts | login/page.tsx | redirect to /login?error=auth_failed | WIRED | Line 12 in callback; line 52 in login page |
| login/page.tsx | useSearchParams | searchParams.get('error') | WIRED | Import at line 5, hook and .get('error') at lines 10-11 |
| history/page.tsx | ResponseHistory.tsx | visibleResponses + lockedCount props | WIRED | Line 35 — `responses={visibleResponses} lockedCount={lockedCount}`; slice computed server-side lines 23-24 |
| ResponseHistory.tsx | /api/checkout | handleUpgrade POST | WIRED | Lines 28-36 — `fetch('/api/checkout', { method: 'POST' })` |
| history/page.tsx | locked response text | server-side slice | WIRED | `allResponses.slice(0, 3)` for free users — locked rows never included in visibleResponses prop |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| ResponseHistory.tsx | responses | history/page.tsx — `allResponses.slice(0, 3)` for free users | Real data for visible responses only; locked rows excluded at server | FLOWING |
| ResponseHistory.tsx | lockedCount | history/page.tsx — `Math.max(0, allResponses.length - 3)` | Integer count only — no text content | FLOWING |
| defend/route.ts | gateResult | supabase.rpc('check_and_increment_defense_responses') | DB transaction with FOR UPDATE | FLOWING |
| analyze/route.ts | gateResult | supabase.rpc('check_and_increment_contracts') | DB transaction with FOR UPDATE | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — AI-touching checks require live Anthropic API and live Supabase. Static grep checks cover implementation patterns.

Pattern checks (re-verified against actual files):

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
| `allResponses.slice(0, 3)` | history/page.tsx:23 | Found | PASS |
| `lockedCount={lockedCount}` | history/page.tsx:35 | Found | PASS |
| `plan={(profile` | history/page.tsx | NOT found | PASS (old prop correctly removed) |
| `isLocked` | ResponseHistory.tsx | NOT found | PASS (fully removed) |
| `filter.*blur` | ResponseHistory.tsx | NOT found | PASS (fully removed) |
| `plan: Plan` | ResponseHistory.tsx | NOT found | PASS (old prop removed) |
| `import.*Plan.*from '@/types'` | ResponseHistory.tsx | NOT found | PASS (Plan no longer imported) |
| `lockedCount > 0` | ResponseHistory.tsx:91 | Found | PASS |
| `response.*hidden` | ResponseHistory.tsx:105 | Found ("response(s) hidden — Upgrade to Pro") | PASS |
| `for update` (row lock) | 002_atomic_gating.sql:15,46 | Found both | PASS |
| `zod` | package.json:29 | Found ("zod": "^4.3.6") | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RELY-01 | 01-03 | Meaningful error on Anthropic failure | SATISFIED | catch block in defend/route.ts returns 'AI generation failed — please try again' with status 500 |
| RELY-02 | 01-04 | Clear error on contract analysis malformed AI output | SATISFIED | extractJson helper + D-13 error string in analyze/route.ts |
| RELY-03 | 01-02 | Redirect to login with error on OAuth failure | SATISFIED | auth/callback/route.ts captures exchangeCodeForSession error and redirects; REQUIREMENTS.md now marked [x] |
| RELY-04 | 01-03 | Free-tier credit never consumed on DB save failure | SATISFIED | preIncrementCount compensating decrement on all failure paths in defend/route.ts |
| GATE-01 | 01-01 + 01-03 | Atomic free-tier defend limit enforcement | SATISFIED | RPC with FOR UPDATE in 002_atomic_gating.sql, called in defend/route.ts |
| GATE-02 | 01-01 + 01-04 | Atomic free-tier contract analysis limit enforcement | SATISFIED | RPC with FOR UPDATE in 002_atomic_gating.sql, called in analyze/route.ts |
| GATE-03 | 01-07 | Response history gating — free users see last 3 only, locked text never in DOM | SATISFIED | Server-side slice in history/page.tsx:23; lockedCount integer prop; ResponseHistory renders placeholder card only — no response text for locked entries |
| VALID-01 | 01-03 | Defend route rejects invalid tool_type, oversized situation | SATISFIED | Zod schema in defend/route.ts validates both |
| VALID-02 | 01-05 | Projects POST schema-level validation | SATISFIED | projectSchema.safeParse in projects/route.ts; REQUIREMENTS.md now marked [x] |
| VALID-03 | 01-04 | Contracts route validates file type and size | SATISFIED | file.type and file.size checks before Anthropic upload in analyze/route.ts |

All 10 Phase 1 requirement IDs are satisfied in code. REQUIREMENTS.md traceability table confirms all as Complete.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `app/auth/callback/route.ts` | `origin` extracted from request.url, used directly in redirect without validation | Warning (CR-01 from REVIEW.md) | Potential open redirect — out of Phase 1 scope; documented for Phase 2 |
| `supabase/migrations/002_atomic_gating.sql` | No COALESCE on plan column — NULL plan falls to `allowed := false` | Warning (WR-03 from REVIEW.md) | Users with NULL plan silently get UPGRADE_REQUIRED; edge case, not a Phase 1 requirement |
| `app/api/contracts/analyze/route.ts` | Contract DB row inserted before input validation in file branch (validation runs inside try after insert) | Warning (WR-04 from REVIEW.md) | Failed validation leaves orphan 'error' status rows; out of Phase 1 scope |

No blockers. All previously identified blockers (GATE-03 CSS blur, stale REQUIREMENTS.md tracking) are resolved.

---

### Human Verification Required

#### 1. GATE-03 DOM Inspection Test

**Test:** Sign in as a free-plan user who has 4+ defense responses for a project. Navigate to `/projects/{id}/history`. Open browser DevTools → Elements tab. Search the full DOM for any text fragment from the 4th (or later) response.

**Expected:** Exactly 3 response cards appear with real content. The 4th+ response text does not appear anywhere in the page HTML source. A single placeholder card appears below the 3 visible cards showing "N response(s) hidden — Upgrade to Pro" and an amber "Upgrade to Pro" button. No blurred divs, no hidden pre elements containing response text.

**Why human:** Requires a real browser session with a free-tier user account and seeded response data (4+ defense_responses for a project). DOM content and absence of data cannot be confirmed programmatically without running the full Next.js server.

#### 2. RELY-03 OAuth Error Redirect

**Test:** Trigger an expired or replayed OAuth callback by navigating to `/auth/callback?code=INVALID_OR_EXPIRED_CODE`, or by reusing an already-consumed OAuth code.

**Expected:** Browser redirects to `/login?error=auth_failed`. The red banner "Sign-in link expired — please try again." is displayed. No crash or blank page.

**Why human:** Requires a real Supabase OAuth session with a genuinely expired or replayed code — cannot simulate without a live auth provider.

---

### Gaps Summary

No gaps blocking goal achievement.

The previous GATE-03 gap is closed: `history/page.tsx` now slices `allResponses` to 3 entries for free users before passing to `ResponseHistory`, computes `lockedCount` as an integer, and passes only `visibleResponses` and `lockedCount` to the component. `ResponseHistory.tsx` has been rewritten to accept `lockedCount: number` and render a single placeholder card when `lockedCount > 0` — no locked response text appears anywhere in the component tree.

The previous REQUIREMENTS.md documentation tracking gaps (RELY-03 and VALID-02 marked Pending) are also resolved — both are now marked `[x]` with "Complete" status in the traceability table.

Two human verification items remain (GATE-03 DOM confirmation, RELY-03 OAuth end-to-end) — these require a live browser session and cannot be confirmed programmatically.

---

_Verified: 2026-04-24T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
