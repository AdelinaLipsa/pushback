---
status: partial
phase: 03-legal-email
source: [03-VERIFICATION.md]
started: 2026-04-24T09:00:00Z
updated: 2026-04-24T09:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Privacy page renders in browser
expected: Full Privacy Policy page renders with dark theme, readable prose, working back-to-home link, and Anthropic-as-processor section visible
result: [pending]

### 2. Terms page renders in browser
expected: Full Terms of Service page renders with AI output disclaimer section visible, cancellation terms visible, Stripe billing section visible
result: [pending]

### 3. Signup — click Terms link
expected: Navigates to /terms without a 404; link is styled amber
result: [pending]

### 4. Signup — click Privacy Policy link
expected: Navigates to /privacy without a 404; link is styled amber
result: [pending]

### 5. Welcome email delivers after signup
expected: Within 60 seconds of completing email confirmation via auth callback: a 'Welcome to Pushback' email arrives at the signup address, states 3 free AI-powered responses and 1 contract analysis, and includes a Go to Dashboard link
result: [pending]

### 6. Upgrade email delivers after Stripe checkout
expected: After completing Stripe checkout (test card 4242 4242 4242 4242): a 'You're on Pushback Pro' email arrives with billing amount and next billing date (or Stripe dashboard fallback), plus a dashboard link
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
