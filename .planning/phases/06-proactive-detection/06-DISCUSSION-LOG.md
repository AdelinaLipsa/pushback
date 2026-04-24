# Phase 6: Proactive Detection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 06-proactive-detection
**Areas discussed:** Entry point, Pre-fill content, Post-detection flow, Free tier limit clarification

---

## Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| Top of DefenseDashboard | Textarea + Analyze button above tool grid; "Or pick manually:" below. No new page sections. | ✓ |
| Separate section above tools | Distinct "Analyze Message" panel between contract strip and tool grid. Requires new project page section. | |
| Collapsible "Not sure?" toggle | Small secondary CTA that expands to show paste input. Opt-in, keeps tool grid primary. | |

**User's choice:** Top of DefenseDashboard
**Notes:** Keep everything within the existing DefenseDashboard component — no new page sections needed.

---

## Pre-fill Content

| Option | Description | Selected |
|--------|-------------|----------|
| Claude extracts situation context | API returns `{ tool_type, explanation, situation_context }` — distilled first-person description | ✓ |
| Raw message verbatim | API returns `{ tool_type, explanation }` only; raw message copied to situation field | |

**User's choice:** Claude extracts situation context
**Notes:** Clean pre-fill that matches the style of the situation field. Requires situation_context in classify API output.

---

## Post-Detection Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Land on pre-filled SituationPanel | Classification banner → SituationPanel opens pre-filled below; user reviews, edits, generates | ✓ |
| One-click generate | Classification result + single Generate button; defend called directly, no SituationPanel | |
| Result banner with two CTAs | "Generate now" + "Review & edit" — user picks pace | |

**User's choice:** Land on pre-filled SituationPanel
**Notes:** Follows existing tool → situation → generate flow. User sees pre-filled situation before generating.

---

## Free Tier Limit Clarification

| Option | Description | Selected |
|--------|-------------|----------|
| 1 — as in live code | Keep limit at 1; analysis + generation share same pool | ✓ |
| 3 — as in ROADMAP success criteria | Raise free limit to 3; update plans.ts + RPC | |
| You decide | Use live code limit (1), tune later | |

**User's choice:** 1 — as in the live code
**Notes:** Discrepancy noticed between ROADMAP (references "3 credits") and live code (limit = 1 via migration 003). User confirmed live code is correct. Free tier stays at 1 shared credit.

---

## Claude's Discretion

- Exact textarea rows/height for message input
- Character count visibility
- Loading state copy
- "Start over" affordance for clearing analysis result

## Deferred Ideas

None.
