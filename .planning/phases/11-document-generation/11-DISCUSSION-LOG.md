# Phase 11: Document Generation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 11-document-generation
**Areas discussed:** Pro Gate UX, Document View Layout, Trigger Scope, Document Type Expansion

---

## Pro Gate UX

| Option | Description | Selected |
|--------|-------------|----------|
| Show button, upgrade prompt on click | Button visible to all users; free users see UpgradePrompt on click | ✓ |
| Hide button entirely | Free users never see document generation UI | |
| Show disabled button with Pro badge | Button renders disabled with a 'Pro' badge | |

**User's choice:** Show button, upgrade prompt on click
**Notes:** Creates discoverability and conversion moment at the exact time the user understands the feature's value.

---

## Document View Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Replace message view | DocumentOutput replaces ResponseOutput; Back button returns to message | ✓ |
| Stacked below message | Document appears below existing message in same scrollable panel | |
| Side-by-side split | Message left, document right (cramped given 220px tool sidebar) | |

**User's choice:** Replace message view (with Back to message button)
**Notes:** Clean, focused, one thing at a time. Matches the mockup preview selected.

---

## Trigger Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Response-gated only | Button only appears after a message is generated | ✓ |
| Also accessible from tool selection | Two parallel actions (message + document) from tool selection | |
| Standalone from project page | Independent Documents section on project page | |

**User's choice:** Response-gated only
**Notes:** Preserves the natural flow: pick tool → generate message → optionally generate document.

---

## Document Type Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 3 types as planned | SOW amendment, kill fee invoice, dispute package | ✓ |
| Add formal demand letter | 4 types — payment_final also gets a document | |
| Add demand letter + IP dispute doc | 5 types total | |

**User's choice:** Keep 3 types as planned
**Notes:** Ship clean, validate demand. payment_final demand letter deferred to post-launch.

---

## Claude's Discretion

- Exact loading text for document generation button
- Whether documentError shows inline or as toast
- Minor styling of the secondary document button in ResponseOutput

## Deferred Ideas

- payment_final → formal payment demand letter (future phase or post-launch)
- ip_dispute → IP assignment dispute document (future phase)
- Download as .txt / .docx (post-launch)
- Document storage in DB (post-launch)
