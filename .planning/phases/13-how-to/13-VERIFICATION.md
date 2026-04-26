---
phase: 13-how-to
verified: 2026-04-26T14:19:41Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visit / in browser — confirm animation auto-starts, cycles through 5 states (idle->pasting->analyzing->selecting->responding), loops back, and no console errors about unmounted state updates appear when navigating away"
    expected: "Animation begins within 1.5s, completes full ~12s cycle, loops continuously, zero console warnings on nav away"
    why_human: "Timer cleanup preventing React unmounted-state warnings cannot be verified by grep or static analysis; requires live browser observation"
  - test: "Log out, then visit /how-it-works directly in browser"
    expected: "Page loads fully with all content (3 use modes, full tool directory, FAQ) — no auth redirect"
    why_human: "Server Component auth-gating behavior requires an actual request through the Next.js middleware stack; static analysis cannot confirm no auth redirect occurs"
  - test: "In the dashboard analyze panel, paste a message and click Analyze — verify 'Not sure which tool?' hint disappears once analysisResult populates, and reappears when user clicks 'Start over'"
    expected: "Hint visible in empty state, hidden after analysis result shows, restored after reset"
    why_human: "Conditional render gated on runtime React state (!analysisResult) — behavior cannot be confirmed without running the app"
  - test: "Open a project with zero defense_responses — verify onboarding hint is visible; generate one response, refresh — hint should be gone"
    expected: "Hint shows for new projects, auto-hides once a response exists"
    why_human: "responses.length === 0 is evaluated at render from DB data; cannot verify hide behavior without live data"
  - test: "Hover any defense tool card on the dashboard for ~1 second"
    expected: "Native browser tooltip appears showing the tool's description text"
    why_human: "Native HTML title attribute tooltip rendering is a browser behavior that cannot be confirmed statically"
---

# Phase 13: How-To & In-App Guidance Verification Report

**Phase Goal:** First-time users understand what Pushback does and how to use it without reading docs — a /how-it-works page, tool directory, and inline tooltips make the app self-teaching
**Verified:** 2026-04-26T14:19:41Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | /how-it-works page exists with 3 use modes, full tool directory (from DEFENSE_TOOLS), contract analysis explanation, and FAQ | VERIFIED | `app/how-it-works/page.tsx` confirmed at correct path, Server Component (no 'use client'), renders all 4 sections; 21 unique tool types in TOOL_GROUPS; DEFENSE_TOOLS.find() lookup confirmed; FAQ has 6 items; contract analysis section present |
| 2 | Each defense tool card has a tooltip/hover state showing "when to use this" guidance | VERIFIED | `title={tool.description}` confirmed on line 50 of `DefenseToolCard.tsx`, placed between onClick and style props; inline description also preserved at line 84 |
| 3 | Empty states on the dashboard and project page include guidance copy pointing to /how-it-works | VERIFIED | DefenseDashboard: `Link href="/how-it-works"` with "See the tool guide →" gated by `!analysisResult` inside `showAnalyzePanel` block (line 330-337); ProjectDetailClient: "New to Pushback?" hint gated by `responses.length === 0` before contract strip (lines 68-83) |
| 4 | DemoAnimation component exists with 5-state machine and auto-starts on mount | VERIFIED | `components/hero/DemoAnimation.tsx` is 211 lines, 'use client', exports default DemoAnimation; all 5 states (idle/pasting/analyzing/selecting/responding) confirmed; useEffect with requestAnimationFrame starts on mount; timers ref pattern with clearTimeout+clearInterval cleanup confirmed |
| 5 | Landing page has "See it in action" section invoking DemoAnimation | VERIFIED | Import at line 10 of `app/page.tsx`; section at lines 634-644 with exact eyebrow/heading/subheading copy; `<DemoAnimation />` invoked; HowItWorksDemo preserved at line 124 |
| 6 | Footer links to /how-it-works (not /#how-it-works) | VERIFIED | `components/shared/Footer.tsx` line 8: `href: '/how-it-works'`; no `/#how-it-works` remains in the file; PRODUCT_LINKS still has exactly 4 entries |
| 7 | Navbar Account section shows Help link to /how-it-works | VERIFIED | `components/shared/Navbar.tsx` line 6: HelpCircle imported; Account section has `{ href: '/how-it-works', label: 'Help', Icon: HelpCircle }` after Settings entry; mobile bottom bar unchanged with 4 items |
| 8 | All 4 D-04 exact content strings present in DemoAnimation | VERIFIED | CONTRACT_CLAUSE ("Contractor waives all rights to claim additional compensation"), RESPONSE_TEXT ("I appreciate you raising this. My rate reflects the full scope as outlined"), RISK_SCORE ("8/10"), ACTIVE_TOOL_LABEL ("Rate Negotiation") all confirmed present |
| 9 | No new state hooks or localStorage for hints; auto-hide only | VERIFIED | grep for dismissedHint/hintDismissed/localStorage in DefenseDashboard.tsx and ProjectDetailClient.tsx returns 0; hints are pure conditional renders |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/hero/DemoAnimation.tsx` | Self-contained client component with 5-state animation machine | VERIFIED | 211 lines; 'use client'; correct timers ref pattern; vignette; entrance animation; all content strings |
| `app/page.tsx` | Landing page with DemoAnimation section | VERIFIED | Import at line 10; section at lines 634-644; HowItWorksDemo untouched |
| `app/how-it-works/page.tsx` | Public Server Component at /how-it-works | VERIFIED | Outside (dashboard); no 'use client'; default export HowItWorksPage; imports DEFENSE_TOOLS + Footer + Link |
| `components/shared/Footer.tsx` | Footer with /how-it-works link | VERIFIED | Line 8: `href: '/how-it-works'`; old anchor `/#how-it-works` absent |
| `components/shared/Navbar.tsx` | Sidebar Navbar with Help link | VERIFIED | HelpCircle imported; Account section has Help entry |
| `components/defense/DefenseDashboard.tsx` | Empty-state guide hint | VERIFIED | Link import added; hint paragraph with "See the tool guide →" gated by !analysisResult inside showAnalyzePanel |
| `components/project/ProjectDetailClient.tsx` | Onboarding hint above contract strip | VERIFIED | "New to Pushback?" hint at line 68-83; gated by responses.length === 0; placed after ProjectHeader, before Contract strip |
| `components/defense/DefenseToolCard.tsx` | Native hover tooltip via title={tool.description} | VERIFIED | title={tool.description} on line 50 of button root; between onClick and style props |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/page.tsx` | `components/hero/DemoAnimation.tsx` | `import DemoAnimation from '@/components/hero/DemoAnimation'` | WIRED | Import confirmed on line 10; `<DemoAnimation />` invoked on line 642 |
| `DemoAnimation.tsx useEffect cleanup` | `timers.current.t / timers.current.interval` | clearTimeout + clearInterval | WIRED | clearTimeout(timers.current.t) appears 2x; clearInterval(timers.current.interval) appears 4x (in branches and cleanup) |
| `app/how-it-works/page.tsx` | `lib/defenseTools.ts` | `import { DEFENSE_TOOLS } from '@/lib/defenseTools'` | WIRED | Import on line 2; DEFENSE_TOOLS.find(t => t.type === type) used in tool directory render |
| `app/how-it-works/page.tsx` | `components/shared/Footer` | `import Footer from '@/components/shared/Footer'` | WIRED | Import on line 3; `<Footer />` rendered at line 185 |
| `components/shared/Footer.tsx` | `app/how-it-works/page.tsx` | PRODUCT_LINKS entry `href: '/how-it-works'` | WIRED | Line 8 confirmed; no anchor hash |
| `components/shared/Navbar.tsx` | `app/how-it-works/page.tsx` | NAV_SECTIONS Account item with HelpCircle | WIRED | Lines 31-32 confirmed; HelpCircle imported on line 6 |
| `components/defense/DefenseDashboard.tsx` | `app/how-it-works/page.tsx` | Link href="/how-it-works" in empty-state hint | WIRED | Line 333 confirmed; gated by !analysisResult |
| `components/defense/DefenseToolCard.tsx` | `tool.description` | `title={tool.description}` on button root | WIRED | Line 50 confirmed; between onClick (49) and style (51) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DemoAnimation.tsx` | typedClause, typedResponse | MODULE_SCOPE constants (CONTRACT_CLAUSE, RESPONSE_TEXT) | Yes — hardcoded string literals, not empty | FLOWING |
| `app/how-it-works/page.tsx` | tool.label, tool.description | DEFENSE_TOOLS import from lib/defenseTools.ts; DEFENSE_TOOLS.find() per group type | Yes — real module-scope data | FLOWING |
| `DefenseToolCard.tsx` | tool.description in title attr | Passed via props from caller | Yes — tool prop from DEFENSE_TOOLS | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| DemoAnimation file exists and is substantive | `wc -l components/hero/DemoAnimation.tsx` | 211 lines | PASS |
| All 21 tool types in how-it-works TOOL_GROUPS | grep unique tool types — count | 21 | PASS |
| Footer no longer uses anchor hash | `grep -c "/#how-it-works" Footer.tsx` | 0 | PASS |
| Navbar HelpCircle imported | `grep -c "HelpCircle" Navbar.tsx` | 2 (import + usage) | PASS |
| DefenseToolCard title attribute | `grep -c "title={tool.description}" DefenseToolCard.tsx` | 1 | PASS |
| No new hint dismiss state | grep for dismissedHint/localStorage in hint files | 0 in both files | PASS |
| Live animation/tooltip behavior | Requires browser | N/A | SKIP — see Human Verification |

### Requirements Coverage

No explicit requirement IDs mapped to this phase (REQUIREMENTS field is TBD in ROADMAP). ROADMAP Success Criteria serve as the authoritative contract:

| Success Criterion | Status | Evidence |
|-------------------|--------|----------|
| SC-1: /how-it-works page with 3 use modes, full tool directory, contract analysis explanation, FAQ | SATISFIED | app/how-it-works/page.tsx confirmed with all sections; 21 tools in 4 groups from DEFENSE_TOOLS |
| SC-2: Each defense tool card has tooltip/hover showing "when to use this" guidance | SATISFIED | title={tool.description} on DefenseToolCard button root |
| SC-3: Empty states on dashboard and project page include guidance copy pointing to /how-it-works | SATISFIED | DefenseDashboard "See the tool guide →" link + ProjectDetailClient "New to Pushback?" hint |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | — |

No TODO/FIXME/placeholder comments found. No empty return statements. No hardcoded empty arrays flowing to render. No `var(--brand-amber)` in new files. No emoji in any new or modified file. All content strings are substantive module-scope constants.

### Human Verification Required

#### 1. DemoAnimation — loop and cleanup behavior

**Test:** Open the landing page (`/`) in a browser. Wait for the animation to begin (within ~1.5s of load). Watch for a complete 5-state cycle (~12s). Confirm it loops back to idle automatically. Then navigate away to another page while the animation is mid-cycle.
**Expected:** Animation starts automatically, runs idle->pasting->analyzing->selecting->responding->idle with no gaps, loops indefinitely, and zero "Can't perform a React state update on an unmounted component" warnings appear in the browser console after navigating away.
**Why human:** Timer cleanup (clearTimeout + clearInterval in useEffect return) prevents the warning only at runtime. Static analysis confirms the code pattern is correct but cannot execute JS to confirm the warning does not appear.

#### 2. /how-it-works unauthenticated access

**Test:** Open an incognito/private window, visit `/how-it-works` directly without logging in.
**Expected:** Page loads fully with logo header, 3 use modes, full 21-tool directory, contract analysis section, FAQ, and Footer — no auth redirect to /login.
**Why human:** Next.js middleware auth-gating cannot be verified statically. The file is outside `(dashboard)` route group, which is the correct placement, but only a live request confirms middleware does not intercept it.

#### 3. DefenseDashboard hint — auto-hide after analysis

**Test:** Open the dashboard. In the analyze panel, confirm the "Not sure which tool? See the tool guide →" hint is visible. Type a message and click Analyze. Confirm the hint disappears once the analysis result shows. Click "Start over" or equivalent — confirm the hint returns.
**Expected:** Hint visible in empty state, hidden when analysisResult is set, restored when analysis is cleared.
**Why human:** Conditional render gated on React state (`!analysisResult`) requires runtime interaction; static analysis confirms the code pattern is correct.

#### 4. ProjectDetailClient hint — auto-hide after first response

**Test:** Open a project with zero defense responses. Confirm "New to Pushback? Paste a message from your client above..." is visible below the project header. Generate a defense response. Refresh the page. Confirm the hint is gone.
**Expected:** Hint present for new projects, absent once defense_responses array is non-empty.
**Why human:** responses.length === 0 is evaluated from DB data at SSR time; requires a live project with and without responses to confirm.

#### 5. DefenseToolCard — native browser tooltip

**Test:** On the dashboard, hover any defense tool card and hold the cursor still for approximately 1 second.
**Expected:** Browser-native tooltip appears showing the tool's description text (e.g., hovering "Scope Change" should show the scope change description).
**Why human:** HTML title attribute tooltip rendering is entirely browser behavior — cannot be confirmed by static analysis.

### Gaps Summary

No blocking gaps found. All 9 must-have truths verified by static analysis and grep inspection. All committed artifacts are substantive (not stubs), properly wired, and data flows are confirmed. The 5 items in Human Verification are behavioral confirmation items — the underlying code is correct, but the behaviors require a running browser to observe.

---

_Verified: 2026-04-26T14:19:41Z_
_Verifier: Claude (gsd-verifier)_
