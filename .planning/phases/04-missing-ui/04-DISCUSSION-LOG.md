# Phase 4: Missing UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 04-missing-ui
**Areas discussed:** Project edit UX, Delete confirmation pattern, Upgrade nudge at 2/3, Contract delete + file cleanup

---

## Gray Area Selection

| Area | Selected |
|------|----------|
| Project edit UX | ✓ |
| Delete confirmation pattern | ✓ |
| Upgrade nudge at 2/3 | ✓ |
| Contract delete + file cleanup | ✓ |

---

## Project Edit UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline on detail page | Edit button toggles in-place form on project detail page. No new route. | ✓ |
| Modal dialog | Requires installing shadcn Dialog or building custom modal. | |
| Dedicated /edit page | Separate route mirroring /projects/new. | |

**User's choice:** Inline on detail page

---

| Option | Description | Selected |
|--------|-------------|----------|
| Core 4 only | Title, client name, project value, notes | |
| All editable fields | Title, client name, client email, project value, currency, status, notes | ✓ |

**User's choice:** All editable fields

---

## Delete Confirmation Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Inline two-step | Click Delete → button changes to "Are you sure? / Cancel" in place. No new dependencies. | ✓ |
| Install shadcn Dialog | Proper modal overlay via @radix-ui/react-dialog. | |

**User's choice:** Inline two-step

---

## Upgrade Nudge at 2/3

| Option | Description | Selected |
|--------|-------------|----------|
| Usage counter strip | Slim strip above tool grid: "2 of 3 responses used · Upgrade to Pro →" | ✓ |
| Soft inline banner | More visible amber-accented banner, dismissible. | |
| Same UpgradePrompt at 2/3 | Reuse existing component triggered one step earlier. Replaces tool panel. | |

**User's choice:** Usage counter strip

---

## Contract Delete + File Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Best-effort | Log Anthropic failure, continue with DB delete regardless. | ✓ |
| Strict | Fail the whole delete if Anthropic file delete fails. | |

**User's choice:** Best-effort

---

## Claude's Discretion

- Exact inline styles for edit form and delete confirmation states
- Component structure (single ProjectActions vs. separate EditProjectForm + DeleteProjectButton)
- Exact copy for delete confirmation messages
- Minor wording adjustments to upgrade strip copy

## Deferred Ideas

None.
