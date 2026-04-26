---
phase: 13-how-to
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - app/how-it-works/page.tsx
  - app/page.tsx
  - components/defense/DefenseDashboard.tsx
  - components/defense/DefenseToolCard.tsx
  - components/hero/DemoAnimation.tsx
  - components/project/ProjectDetailClient.tsx
  - components/shared/Footer.tsx
  - components/shared/Navbar.tsx
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Eight files reviewed covering the new How-It-Works page, landing page updates, the defense dashboard and tool card, demo animation components, the project detail client, footer, and navbar. Three blockers were found — one missing icon that silently breaks a tool card, one non-functional CTA button, and content that materially misrepresents the free-plan limits to users. Five warnings cover stale state display, a dead code branch with a type mismatch cast, and a cursor rendering issue. Three info-level items round out the report.

---

## Critical Issues

### CR-01: `disputed_hours` tool renders no icon in both sidebar and tool card

**File:** `lib/defenseTools.ts:219` / `components/defense/DefenseDashboard.tsx:23-27` / `components/defense/DefenseToolCard.tsx:12-33`

**Issue:** The `disputed_hours` tool specifies `icon: 'Timer'`, but `Timer` is not imported from `lucide-react` and is absent from `ICON_MAP` in both `DefenseDashboard` and `DefenseToolCard`. Both components guard with `{Icon && <Icon .../>}`, so no crash occurs — but the icon silently renders nothing. Every other tool has a working icon. This is a regression introduced when `disputed_hours` was added to `defenseTools.ts` without updating either component's icon map.

**Fix:** Add `Timer` to the lucide-react import and to `ICON_MAP` in both components:

```tsx
// components/defense/DefenseDashboard.tsx — line 7 import
import {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt, Timer,   // <-- add Timer
  type LucideIcon,
} from 'lucide-react'

// ICON_MAP — add:
Timer,
```

Apply the same change in `components/defense/DefenseToolCard.tsx`.

---

### CR-02: "Copy Message" button in Before/After section has no `onClick` handler

**File:** `app/page.tsx:729-738`

**Issue:** The "Copy Message" button in the Before/After landing section (`line 737`) has no `onClick` handler. It looks functional — same lime style as the working copy button in `HowItWorksDemo` — but clicking it does nothing. Users who click it while exploring the landing page get no feedback and no copy action, damaging trust in the product demo.

**Fix:**

```tsx
<button
  onClick={() => navigator.clipboard.writeText(AFTER_MESSAGE).catch(() => {})}
  className="hover:opacity-90 transition-opacity"
  style={{
    backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
    fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem',
    border: 'none', cursor: 'pointer',
  }}
>
  Copy Message
</button>
```

---

### CR-03: FAQ falsely states the free plan gives "3 AI-generated responses"

**File:** `app/how-it-works/page.tsx:143`

**Issue:** The FAQ answer reads: *"3 AI-generated responses and 1 contract analysis, total — not per month."* The actual free-plan limit defined in `lib/plans.ts` is `defense_responses: 1`. The landing page (`app/page.tsx:770`) correctly shows "1 defense tool response." The How-It-Works FAQ contradicts both the source of truth and the landing page. Users who sign up based on the FAQ will be surprised by the real limit, which constitutes a material misrepresentation.

The same FAQ entry also states "Pro accounts get unlimited responses and contract analyses," which is also incorrect: Pro is capped at `defense_responses: 150` and `contracts: 50` per `lib/plans.ts`.

**Fix:** Correct both statements to match `lib/plans.ts`:

```tsx
a: '1 AI-generated defense response and 1 contract analysis, total — not per month. Pro accounts get 150 defense responses and 50 contract analyses per month.',
```

Also update line 130 in the "How contract analysis works" section which says "Pro accounts can analyze unlimited contracts" — change to "50 contract analyses per month."

---

## Warnings

### WR-01: ToolSidebar displays stale "responses left" count after generating a response

**File:** `components/defense/DefenseDashboard.tsx:282`

**Issue:** `DefenseDashboard` maintains `localResponsesUsed` (line 189) which increments on each successful generation (line 225). However, `ToolSidebar` at line 282 receives the original `responsesUsed` prop — not `localResponsesUsed`. After a free-plan user generates a response, the sidebar counter still shows the pre-generation count for the remainder of the session (until a server round-trip from `router.refresh()` completes). A user at limit may see "1 left" and attempt another tool, triggering the upgrade wall unexpectedly.

**Fix:**

```tsx
<ToolSidebar
  selectedType={selectedTool?.type ?? null}
  loadingType={loading ? (selectedTool?.type ?? null) : null}
  onSelect={selectTool}
  plan={plan}
  responsesUsed={localResponsesUsed}   // was: responsesUsed
/>
```

---

### WR-02: `UpgradePrompt` receives stale `responsesUsed` prop

**File:** `components/defense/DefenseDashboard.tsx:259`

**Issue:** Same root cause as WR-01. When `showUpgrade` is true, `UpgradePrompt` is rendered with the original `responsesUsed` prop (line 259), not `localResponsesUsed`. If a user generates their last free response mid-session, the upgrade prompt may display incorrect usage data.

**Fix:**

```tsx
<UpgradePrompt responsesUsed={localResponsesUsed} />
```

---

### WR-03: Dead code branch with unsound type cast in `ProjectDetailClient`

**File:** `components/project/ProjectDetailClient.tsx:43`

**Issue:** The `contracts` field is typed as `{ id: string; risk_score: number | null; ... } | null` (a single object or null, line 22-23). The runtime guard `Array.isArray(contractsRaw)` on line 43 can never be true against that type. The subsequent cast `contractsRaw as Array<typeof contractsRaw>` is unsound — `typeof contractsRaw` resolves to the whole union type, making it `Array<{ ... } | null>`. This pattern was probably left over from a schema change and misleads anyone reading the code about the data shape.

**Fix:** Remove the dead branch:

```tsx
const contract = project.contracts ?? null
```

---

### WR-04: `disputed_hours` is missing from `DefenseDashboard` `CATEGORIES` — tool is unreachable from the sidebar

**File:** `components/defense/DefenseDashboard.tsx:31-48`

**Issue:** `DEFENSE_TOOLS` has 21 entries including `disputed_hours`, but `CATEGORIES` in `DefenseDashboard` (lines 31-48) lists only 20 types — `disputed_hours` is absent. The tool exists and is reachable via the analyze flow (message routing) or via `autoSelectTool`, but it cannot be manually selected from the sidebar at all. A user who knows they have a billing dispute cannot navigate to the tool directly.

**Fix:** Add `disputed_hours` to an appropriate category in `CATEGORIES`:

```tsx
{
  label: 'Payment',
  types: ['payment_first', 'payment_second', 'payment_final', 'kill_fee', 'retroactive_discount', 'rush_fee_demand', 'disputed_hours'],
},
```

---

### WR-05: Blinking cursor remains visible after typing completes in `DemoAnimation`

**File:** `components/hero/DemoAnimation.tsx:185-194`

**Issue:** In the `responding` step, the blinking cursor span (lines 185-194) is rendered unconditionally whenever `step === 'responding'`. The typing interval clears when `i >= RESPONSE_TEXT.length`, then a 1500ms timeout fires to transition to `idle`. During that 1500ms window, the response is fully rendered but the cursor continues blinking at the end of completed text — which looks like a typing glitch to a first-time visitor expecting a polished demo.

**Fix:** Track completion separately or gate the cursor on a `typingDone` flag:

```tsx
const typingDone = typedResponse.length >= RESPONSE_TEXT.length

{!typingDone && (
  <span style={{ /* blink cursor styles */ }} />
)}
```

---

## Info

### IN-01: Free plan landing page feature list says "All 8 situation types" — there are 4 categories, not 8

**File:** `app/page.tsx:770`

**Issue:** The free plan feature list includes "All 8 situation types". There are 4 categories in the sidebar (`CATEGORIES`) and 21 individual tools. Neither "8" nor "situation types" is an accurate description. The copy appears to be placeholder text that was never reconciled with the final information architecture.

**Fix:** Change to "Access to all 21 defense tools" to match the Pro plan feature list and actual tool count.

---

### IN-02: `brand-amber` used throughout `Navbar` — semantically confusing given project convention

**File:** `components/shared/Navbar.tsx:43, 86, 150, 183`

**Issue:** The project's stated design convention (per memory context) is lime accent only, no amber. `globals.css` maps `--brand-amber` to `#84cc16` (the same hex as lime), making it render correctly. However, `--brand-amber-dim` maps to `#92400e` (a dark amber/brown), meaning any future use of `brand-amber-dim` in the navbar or elsewhere would produce an unexpected brown color. The `brand-amber` alias is a semantic trap.

**Fix:** Replace `brand-amber` with `brand-lime` throughout `Navbar.tsx` to use the canonical token and eliminate the alias confusion:

```tsx
// Replace all occurrences of brand-amber with brand-lime
// e.g. line 43: 'border-brand-lime' instead of 'border-brand-amber'
```

---

### IN-03: `eslint-disable-line react-hooks/exhaustive-deps` suppresses missing `beginTool` dependency in `HowItWorksDemo` and `DemoAnimation`

**File:** `app/page.tsx:164` / `components/hero/DemoAnimation.tsx:70`

**Issue:** Both components suppress the exhaustive-deps warning for their `useEffect` initialization hooks. `beginTool` is defined inside the component and therefore recreated on every render, but it is stable in practice because neither component has any state that changes before the effect fires. The suppression is low-risk here since both effects only run on mount. However, it masks the legitimate engineering question of whether `beginTool` should be wrapped in `useCallback` to make the dependency safe to declare.

**Fix (optional but clean):** Wrap `beginTool` in `useCallback` with appropriate deps, then remove the `eslint-disable` comment. Alternatively, move the function definition into a `useRef` to make it truly stable.

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
