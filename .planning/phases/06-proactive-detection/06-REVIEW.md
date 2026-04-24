---
phase: 06-proactive-detection
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - app/api/projects/[id]/analyze-message/route.ts
  - components/defense/DefenseDashboard.tsx
  - components/defense/SituationPanel.tsx
  - lib/anthropic.ts
  - types/index.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Phase 6 Proactive Detection additions: the `analyze-message` API route, the `DefenseDashboard` analyze UX, the `SituationPanel` component, the `lib/anthropic.ts` prompt constants, and `types/index.ts`. The API route and type definitions are clean and correct — the compensating-decrement pattern was verified against the RPC SQL (the RPC returns pre-increment `current_count`, so the rollback target is accurate). No security vulnerabilities found. Two warnings and two info items.

---

## Warnings

### WR-01: Result banner `borderLeft` is overwritten by `border` shorthand — lime accent never renders

**File:** `components/defense/DefenseDashboard.tsx:193-195`

**Issue:** In React inline styles, properties are applied in object key order. The result banner sets `borderLeft: '3px solid var(--brand-lime)'` on line 193, then immediately sets `border: '1px solid var(--bg-border)'` on line 195. CSS shorthand `border` resets all four sides including `border-left`, so the lime left accent is completely overwritten and never visible.

**Fix:** Reorder the properties so `border` comes first and `borderLeft` overrides it:

```tsx
style={{
  border: '1px solid var(--bg-border)',
  borderLeft: '3px solid var(--brand-lime)',   // must come AFTER border shorthand
  backgroundColor: 'var(--bg-surface)',
  borderRadius: '0.875rem',
  padding: '1rem 1.25rem',
  marginBottom: '0.5rem',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  flexWrap: 'wrap',
}}
```

---

### WR-02: `SituationPanel` ignores `initialSituation` prop changes after mount — stale textarea on re-analysis

**File:** `components/defense/SituationPanel.tsx:16`

**Issue:** `useState(initialSituation ?? '')` only uses the prop value at initial mount. If the user analyzes a second message without first dismissing `SituationPanel` (e.g., by editing the textarea mid-flow and then re-analyzing), the new `situation_context` from the second analysis will not populate the textarea because `useState` ignores prop updates after mount.

The current "Start over" flow unmounts the panel before the new analysis runs, which sidesteps this in the happy path. But if any future flow keeps the panel mounted across analyses, the stale value will silently pre-fill the wrong context.

**Fix:** Add a `useEffect` to sync the prop into state when it changes:

```tsx
import { useState, useEffect } from 'react'

export default function SituationPanel({ tool, onGenerate, onClose, loading, initialSituation }: SituationPanelProps) {
  const [situation, setSituation] = useState(initialSituation ?? '')

  useEffect(() => {
    if (initialSituation !== undefined) {
      setSituation(initialSituation)
    }
  }, [initialSituation])
  // ...
}
```

---

## Info

### IN-01: Frontend `maxLength` (3000) and character counter do not match backend Zod limit (5000)

**File:** `components/defense/DefenseDashboard.tsx:157,166` / `app/api/projects/[id]/analyze-message/route.ts:32`

**Issue:** The `<textarea>` enforces `maxLength={3000}` and the counter displays `/ 3000`, but the Zod schema accepts up to `max(5000)`. A user submitting via the UI can never send more than 3000 characters, but the backend would silently accept up to 5000 from any direct API caller. The mismatch means either the UI cap or the server cap is wrong, and the character counter is misleading.

**Fix:** Pick one value and apply it consistently. If 3000 is the intended product cap:

```ts
// route.ts
message: z.string().min(10).max(3000),
```

If 5000 is the cap:

```tsx
// DefenseDashboard.tsx
<textarea maxLength={5000} ... />
<p>...{messageInput.length} / 5000</p>
```

---

### IN-02: Project ID in URL is not validated — any authenticated user can call any project's endpoint

**File:** `app/api/projects/[id]/analyze-message/route.ts:43`

**Issue:** The route extracts `id` from `params` but never verifies the project belongs to the authenticated user (the variable is aliased to `_id` to silence the linter). Since no project data is read and no DB row is written, there is no data leak or cross-user exposure today. However, the project-scoped URL implies ownership verification, and the pattern diverges from the sibling `defend` route which does enforce `.eq('user_id', user.id)`.

**Fix:** Either validate project ownership (consistent with `defend`) or acknowledge the route is user-scoped only and move it to `/api/analyze-message` to remove the misleading project ID parameter. If keeping the URL shape, add a lightweight ownership check:

```ts
const { data: project } = await supabase
  .from('projects')
  .select('id')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()
if (!project) {
  // compensating decrement here too
  return Response.json({ error: 'Not found' }, { status: 404 })
}
```

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
