---
phase: 04-missing-ui
fixed_at: 2026-04-24T12:18:37Z
review_path: .planning/phases/04-missing-ui/04-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-04-24T12:18:37Z
**Source review:** .planning/phases/04-missing-ui/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (WR-01 through WR-05)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: `contract` field may be an array — unchecked `.title`/`.id` access crashes at runtime

**Files modified:** `app/(dashboard)/projects/[id]/page.tsx`
**Commit:** b85287d
**Applied fix:** Replaced `(project as any).contracts` with a typed `ProjectWithContract` cast and explicit array-first-element extraction (`Array.isArray(contractsRaw) ? contractsRaw[0] ?? null : contractsRaw ?? null`). Also moved `RISK_LABEL` and `RISK_COLORS` constants to module scope (addresses IN-02 and IN-03 as a side-effect).

---

### WR-02: `handleGenerate` silently swallows non-403 API errors — no user feedback on failure

**Files modified:** `components/defense/DefenseDashboard.tsx`
**Commit:** d9a0098
**Applied fix:** Added `generateError` state; non-ok, non-403 responses now call `setGenerateError(data?.error ?? 'Something went wrong. Please try again.')` and an error paragraph is rendered below the tool grid. On success `generateError` is cleared.

---

### WR-03: Near-limit nudge strip hardcodes "2 of 3" — diverges from `responsesUsed` prop

**Files modified:** `components/defense/DefenseDashboard.tsx`
**Commit:** d9a0098
**Applied fix:** Replaced the hardcoded string `"2 of 3 responses used"` with `{responsesUsed} of {FREE_LIMIT} responses used` so the label stays accurate if the limit or threshold changes.

---

### WR-04: Contract delete does not call `router.refresh()` — stale UI after success

**Files modified:** `components/contract/ContractDeleteButton.tsx`
**Commit:** 3735906
**Applied fix:** Added `router.refresh()` immediately before `router.push('/contracts')` in `handleDelete`, matching the pattern used in `ProjectHeader`.

---

### WR-05: Dialog close button has no accessible label when `showCloseButton` prop is combined with a custom `render`

**Files modified:** `components/ui/dialog.tsx`
**Commit:** 0ab4075
**Applied fix:** Added `aria-label="Close"` directly on the rendered `Button` element and removed the now-redundant `<span className="sr-only">Close</span>` sibling. The accessible name is now reliably on the button element regardless of Base UI render prop reconciliation.

---

_Fixed: 2026-04-24T12:18:37Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
