---
status: partial
phase: 13-how-to
source: [13-VERIFICATION.md]
started: 2026-04-26T00:00:00Z
updated: 2026-04-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Animation loop and cleanup
expected: Animation cycles ~12s, loops continuously, and no React unmounted-state console warnings appear when navigating away mid-cycle

result: [pending]

### 2. Unauthenticated access to /how-it-works
expected: Opening incognito window and visiting /how-it-works shows the page with no auth redirect

result: [pending]

### 3. DefenseDashboard hint auto-hide
expected: "See the tool guide" hint disappears when analysisResult populates, reappears after reset

result: [pending]

### 4. ProjectDetailClient hint auto-hide
expected: "New to Pushback?" hint is gone after the first defense response exists on a project

result: [pending]

### 5. Tool card native tooltip
expected: Hovering a defense tool card for ~1s shows a browser-native tooltip with the tool's description text

result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
