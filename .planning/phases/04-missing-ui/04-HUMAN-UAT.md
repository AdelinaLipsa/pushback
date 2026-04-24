---
status: approved
phase: 04-missing-ui
source: [04-VERIFICATION.md]
started: 2026-04-24T12:30:00Z
updated: 2026-04-24T12:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Nudge Strip Visual Rendering and Checkout Flow
expected: A lime-accented strip ("2 of 3 responses used" left, "Upgrade to Pro →" right with lime color) appears above the tool grid. The strip cannot be dismissed. Clicking "Upgrade to Pro →" redirects to Stripe checkout.
result: [pending]

### 2. Project Edit Form Interaction
expected: Form appears pre-filled with current project data; input focus rings turn lime (#84cc16) on focus; save calls PATCH, replaces form with read view showing updated data, and shows toast "Project updated".
result: [pending]

### 3. Project Delete End-to-End
expected: Confirmation dialog shows "Delete this project? This will permanently delete all defense responses too." After confirm, project and its defense_responses are removed from DB, browser redirects to /projects.
result: [pending]

### 4. Contract Delete with Anthropic Cleanup
expected: Dialog shows correct copy. After confirm, redirects to /contracts. Anthropic Files API delete is attempted (may succeed or log error silently). Contract row is removed from Supabase.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
