# Phase 10: Smart Escalation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 10-smart-escalation
**Areas discussed:** Dashboard scope, Escalation nudge query, Handle now behavior, Next-step card

---

## Dashboard scope

| Option | Description | Selected |
|--------|-------------|----------|
| Payment alerts only | Overdue + due within 3 days. Clean, no ambiguity. | |
| Payment + ghost clients | Payments + ghost_client sent >5 business days with no follow-up. | |
| Full scope: payments + ghosts + stalled | Everything from roadmap: overdue, due soon, ghost clients, stalled (payment reminder sent >7 days). | ✓ |

**User's choice:** Full scope
**Notes:** User wants all three alert types per the roadmap success criteria. Ghost client = ghost_client tool sent + was_sent=true + >5 business days. Stalled = payment_first/second sent + was_sent=true + >7 days + no payment received.

---

## Escalation nudge query

| Option | Description | Selected |
|--------|-------------|----------|
| Extend project page query | Add defense_responses join server-side. Zero extra requests. | ✓ |
| Separate client fetch | useEffect on mount. Extra network request. | |
| Skip escalation nudge | Remove from Phase 10 scope. | |

**User's choice:** Extend project page query (recommended)
**Notes:** Consistent with server-first data fetching pattern. Project page gets `defense_responses(id, tool_type, created_at, was_sent)` added to its select.

---

## Handle now → behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Project page with tool pre-selected | /projects/[id]?tool=payment_second etc. — drops user into right flow. | ✓ |
| Project page only | /projects/[id] — no pre-selection, more clicks. | |
| Opens inline on dashboard | Expands panel on dashboard row. More complex. | |

**User's choice:** Project page with tool pre-selected (recommended)
**Notes:** Uses URL param `?tool=<DefenseTool>`. DefenseDashboard gets new `autoSelectTool?: DefenseTool` prop, generalization of existing `initialPaymentPrefill` pattern.

---

## Next-step card for non-action tools

| Option | Description | Selected |
|--------|-------------|----------|
| Same card, no button — text only | All 20 tools get same subtle card. No button for non-action tools. | ✓ |
| Different card style for non-action | Non-action tools get visually distinct (more muted) card. | |
| All cards identical | Same layout and style for all 20 types. | |

**User's choice:** Same card, no button — text only (recommended)
**Notes:** Uniform look, simpler implementation. Payment tool text naturally points back to Pushback (e.g., "Come back and use 'Payment Follow-Up'") without needing a button. Non-action tools show pure guidance text.

---

## Claude's Discretion

- Exact styling details (padding, font size) for NextStepCard — keep consistent with ResponseOutput's existing info sections
- Whether AttentionAlert is shared or co-located with dashboard page
- Fade-in animation timing for Needs Attention section

## Deferred Ideas

None.
