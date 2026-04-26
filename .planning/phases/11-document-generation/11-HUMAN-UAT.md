---
status: partial
phase: 11-document-generation
source: [11-VERIFICATION.md]
started: 2026-04-26T00:00:00Z
updated: 2026-04-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Happy path — Pro user generates a document
expected: After generating a defense response (e.g. kill_fee tool), a "Generate Kill Fee Invoice" button appears below Copy + Mark as sent. Clicking it replaces ResponseOutput with DocumentOutput showing a formatted document in a monospace pre block.

result: [pending]

### 2. Free user gate
expected: Free user clicking the document button sees UpgradePrompt, not a document. No document generation API call fires.

result: [pending]

### 3. Unmapped tool — document button absent
expected: For tools with no document type (e.g. payment_first, ghost_client), no document button appears in ResponseOutput.

result: [pending]

### 4. Error state
expected: If the API returns an error, an error message appears below the button row in ResponseOutput. Button is re-enabled and user can retry.

result: [pending]

### 5. Back button behavior
expected: Clicking "← Back to message" on DocumentOutput restores ResponseOutput with the original generated message intact — response state is not cleared.

result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
