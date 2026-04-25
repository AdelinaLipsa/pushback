# Phase 7: Payment Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 07-payment-tracking
**Areas discussed:** Tool tier selection, Payment amount field, Due date + received UI, Overdue badge scope, Payment edit entry point, Pre-fill flow

---

## Tool Tier Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-pick by days overdue | App calculates days overdue and auto-selects: payment_first (0–7 days), payment_second (8–14), payment_final (15+). Pre-fills invoice amount, due date, and days overdue. | ✓ |
| Always open payment_first | Always start with the friendly reminder; user manually switches to a firmer tool. | |
| Show all three, pre-fill each | Handle Late Payment CTA opens defense tool grid with all three payment tools highlighted. | |

**User's choice:** Auto-pick by days overdue
**Notes:** Thresholds match the existing tool descriptions in defenseTools.ts.

---

## Payment Amount Field

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse project_value | No new column; existing project value pre-fills invoice_amount context field. | |
| Add a separate payment_amount | New column; lets user set an amount that differs from project total (e.g. milestone payment). | ✓ |

**User's choice:** Add a separate payment_amount field
**Notes:** Results in new DB columns: payment_due_date, payment_amount, payment_received_at.

---

## Due Date + Received UI Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Project detail page — separate section | Dedicated Payment card below DefenseDashboard with inline edit, status display, and CTAs. | ✓ |
| Folded into edit form | Payment fields in existing ProjectHeader edit form; Payment section is display-only. | |
| Dashboard card quick-action | Overdue badge with inline CTAs on ProjectCard; due date/amount still via edit form. | |

**User's choice:** Project detail page — separate section

---

## Mark Received — Date vs Boolean

| Option | Description | Selected |
|--------|-------------|----------|
| Simple toggle (boolean) | One click marks it received; no date captured. | |
| Capture received date | payment_received_at timestamptz nullable; non-null = received, value = date received. | ✓ |

**User's choice:** Capture received date
**Notes:** payment_received_at IS the flag — no separate boolean column needed.

---

## Overdue Badge Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard cards only | Overdue badge on ProjectCard only. | |
| Dashboard + project header | Overdue badge on ProjectCard AND ProjectHeader on detail page. | ✓ |

**User's choice:** Dashboard + project header

---

## Payment Edit Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in the Payment section | Input fields directly in the Payment section when no due date is set; Edit toggle when one exists. | ✓ |
| Via the main edit form | Payment fields added to ProjectHeader edit form; Payment section is display-only. | |

**User's choice:** Inline in the Payment section

---

## Pre-fill Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in DefenseDashboard | Clicking CTA scrolls to DefenseDashboard, pre-selects tier, pre-fills context fields. | ✓ |
| Open project page with params | Navigate with query params to trigger pre-fill on load. | |

**User's choice:** Inline in DefenseDashboard
**Notes:** Extends Phase 6's initialSituation pattern to also pre-fill context fields.

---

## Claude's Discretion

- Exact date input type for payment due date
- Smooth scroll vs. jump to DefenseDashboard on "Handle Late Payment"
- Exact button copy and sizing in PaymentSection
- Whether PaymentSection uses same card style as DefenseDashboard analyze section

## Deferred Ideas

None.
