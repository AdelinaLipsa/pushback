# Phase 7: Payment Tracking - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add payment tracking to each project: a due date, a separate expected payment amount, and a received date. The dashboard shows an overdue badge on projects where the due date has passed and payment is not yet marked received. An overdue project offers a "Handle Late Payment" CTA that auto-selects the right payment tool tier and pre-fills context fields in the DefenseDashboard — no re-typing required. The user can mark payment as received (with a date) to clear the overdue state.

Four requirements:
- **PAY-01:** User can set a payment due date and expected amount on any project
- **PAY-02:** Dashboard shows an overdue badge on projects where payment due date has passed and payment_received_at is null
- **PAY-03:** Overdue projects show a "Handle Late Payment" CTA that auto-selects the tier and pre-fills invoice_amount, due_date, and days_overdue context fields
- **PAY-04:** User can mark a payment as received (with date) — clears the overdue badge immediately

</domain>

<decisions>
## Implementation Decisions

### DB Migration (PAY-01, PAY-04)
- **D-01:** New migration adds three nullable columns to `public.projects`:
  - `payment_due_date date` — the invoice due date
  - `payment_amount numeric` — the expected payment amount (separate from `project_value`; a project may be invoiced in stages)
  - `payment_received_at timestamptz` — non-null means payment was received; value = the date/time the user marked it received
- **D-02:** Overdue logic: `payment_due_date < today AND payment_received_at IS NULL`. No separate "payment_received" boolean — the timestamp IS the flag.
- **D-03:** The PATCH route for projects (`app/api/projects/[id]/route.ts`) must add `payment_due_date`, `payment_amount`, and `payment_received_at` to the `allowed` fields list.

### Payment Section UI (PAY-01, PAY-04)
- **D-04:** A dedicated "Payment" section renders on the project detail page below the DefenseDashboard. It is a new client component — call it `PaymentSection`.
- **D-05:** When no due date is set: the section shows inline input fields for due date and payment amount with a "Save" button. Empty state is the entry point for PAY-01.
- **D-06:** When a due date is set: the section displays the due date, payment amount, and payment status. An "Edit" toggle reveals the inline form to update the values (same form as D-05, pre-filled).
- **D-07:** Payment status display:
  - Not yet due: "Due [date] · [currency] [amount]" in `--text-secondary`
  - Overdue: "OVERDUE · [N] days · [currency] [amount]" with urgency-high red accent
  - Received: "Received [date] · [currency] [amount]" in `--brand-green`
- **D-08:** When overdue: "Handle Late Payment" button (primary, lime) and "Mark as Received" button both appear in the section.
- **D-09:** "Mark as Received" sets `payment_received_at` to the current timestamp via a PATCH call. No datepicker shown — uses `new Date().toISOString()` automatically. This satisfies PAY-04: received date is captured, overdue badge clears immediately on success.

### Tool Tier Auto-Selection (PAY-03)
- **D-10:** Days overdue is calculated client-side: `Math.floor((today - payment_due_date) / 86400000)`.
- **D-11:** Tier selection thresholds (match the existing tool descriptions in `defenseTools.ts`):
  - 0–7 days → `payment_first`
  - 8–14 days → `payment_second`
  - 15+ days → `payment_final`
- **D-12:** Context field pre-fill per tier:
  - `payment_first`: `invoice_amount` = payment_amount, `due_date` = formatted payment_due_date
  - `payment_second`: `invoice_amount` = payment_amount, `days_overdue` = calculated days
  - `payment_final`: `invoice_amount` = payment_amount, `days_overdue` = calculated days
- **D-13:** "Handle Late Payment" is a button inside `PaymentSection`. Clicking it calls a prop callback (e.g. `onHandleLatePayment({ tool, contextFields })`) that lives in the parent server component or passed down to `DefenseDashboard`. The callback sets pre-selected tool + pre-filled context fields in `DefenseDashboard` state, then scrolls to the dashboard.

### Extending DefenseDashboard Pre-fill (PAY-03)
- **D-14:** Phase 6 added `initialSituation` prop to `SituationPanel` for text pre-fill. Phase 7 extends this: `DefenseDashboard` gains a new optional prop `initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }`.
- **D-15:** When `initialPaymentPrefill` is set on mount (or when the "Handle Late Payment" callback fires), `DefenseDashboard` sets `selectedTool` from `initialPaymentPrefill.tool` and passes `initialContextFields` to `SituationPanel` for the context field inputs. `SituationPanel` initialises its context field state from these values.
- **D-16:** The `situation` textarea is NOT pre-filled by the payment CTA — the user types their situation as normal. Only context fields (amount, date, days) are pre-populated.

### Overdue Badge Placement (PAY-02)
- **D-17:** Overdue badge appears in two places:
  1. **`ProjectCard`** (dashboard) — a red "OVERDUE" pill badge in the top-right chip cluster, alongside the existing status and risk badges. Uses `--urgency-high` color.
  2. **`ProjectHeader`** (project detail page) — same red "OVERDUE" pill badge alongside the existing status badge.
- **D-18:** Badge only renders when `payment_due_date` is set, `payment_received_at` is null, and `payment_due_date < today`. The `Project` type needs to include the three new payment columns.

### Claude's Discretion
- Exact date input type (`<input type="date">` vs a styled text input) for payment due date
- Whether "Handle Late Payment" scrolls smoothly or jumps to the DefenseDashboard
- Exact button copy and sizing within the PaymentSection
- Whether the PaymentSection card uses the same `--bg-surface` / `--bg-border` card style as the DefenseDashboard analyze section

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to Modify
- `app/(dashboard)/projects/[id]/page.tsx` — Add `<PaymentSection>` client component below DefenseDashboard; pass payment fields from the project fetch
- `app/api/projects/[id]/route.ts` — Add `payment_due_date`, `payment_amount`, `payment_received_at` to the `allowed` PATCH fields list
- `components/defense/DefenseDashboard.tsx` — Add `initialPaymentPrefill` prop; set `selectedTool` + initial context fields when prop is provided
- `components/defense/SituationPanel.tsx` — Add `initialContextFields?: Record<string, string>` prop to pre-fill context field inputs on mount
- `components/project/ProjectCard.tsx` — Add overdue badge logic + OVERDUE pill
- `components/project/ProjectHeader.tsx` — Add overdue badge logic + OVERDUE pill

### Files to Create
- `supabase/migrations/005_payment_tracking.sql` — Add `payment_due_date date`, `payment_amount numeric`, `payment_received_at timestamptz` to `public.projects`
- `components/project/PaymentSection.tsx` — New client component; inline edit form for due date + amount; displays status; "Handle Late Payment" + "Mark as Received" CTAs

### Files to Reference (do not modify)
- `lib/defenseTools.ts` — All three payment tools and their `contextFields` keys (`invoice_amount`, `due_date`, `days_overdue`); tier descriptions confirm the 0-7/8-14/15+ thresholds
- `components/defense/DefenseDashboard.tsx` — Phase 6 `initialSituation` pre-fill pattern; existing `selectedTool` state; `selectTool()` logic to mirror
- `components/defense/SituationPanel.tsx` — Phase 6 `initialSituation` prop implementation; extend same pattern for `initialContextFields`
- `supabase/migrations/001_initial.sql` — Confirms `projects` table schema before adding columns
- `lib/ui.ts` — `btnStyles.primary` (lime CTA) and shared style constants
- `types/index.ts` — `Project` type and `DefenseTool` union — both need updating for new columns and pre-fill
- `.planning/codebase/STACK.md` — Next.js 16 async params pattern before touching page components
- `.planning/codebase/CONVENTIONS.md` — CSS custom property naming; error response format
- `node_modules/next/dist/docs/` — Read before writing any route or layout code

### Prior Phase Decisions That Apply
- Phase 4: `btnStyles.primary` uses `var(--brand-lime)` for primary CTAs — apply to "Handle Late Payment"
- Phase 4: `showCloseButton={false}` on Dialog for confirmations — apply if any confirm dialog is needed
- Phase 6: `initialSituation` prop pattern on SituationPanel — extend to `initialContextFields`
- Project-level: inline dark styling via CSS custom properties (`--urgency-high`, `--brand-green`, `--text-secondary`, etc.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `btnStyles.primary` from `lib/ui.ts` — lime primary button for "Handle Late Payment" CTA
- `SituationPanel.tsx` `initialSituation` prop pattern (Phase 6) — extend to support `initialContextFields`
- `ProjectHeader.tsx` status badge (existing pill) — add OVERDUE pill alongside it using same pill pattern
- `ProjectCard.tsx` status + risk badge chips — add OVERDUE chip using `--urgency-high` color

### Established Patterns
- Inline edit toggle: Phase 4 `ProjectHeader` shows edit form inline with "Cancel" to restore read view — reuse this toggle pattern for the PaymentSection edit form
- `router.refresh()` after data mutations (PATCH) — established in Phase 4 edit form
- `console.error` + continue for non-critical failures — established in Phase 3 and Phase 4
- CSS custom properties for color: `--urgency-high` (red), `--brand-green`, `--brand-lime`, `--text-secondary`, `--bg-surface`, `--bg-border`

### Integration Points
- Project detail page (`page.tsx`) fetches project with joined data server-side — the three new payment columns will come through the existing query once the migration runs; pass them to `PaymentSection` and `ProjectHeader`
- `DefenseDashboard` already receives `plan` and `responsesUsed` as props — `initialPaymentPrefill` follows the same prop-passing pattern from the page
- `ProjectCard` receives `Project` type — once `Project` type includes payment columns, overdue detection is client-side arithmetic with no additional fetch

</code_context>

<specifics>
## Specific Ideas

- Overdue badge copy: "OVERDUE" (all-caps pill, matches existing status badge casing style)
- PaymentSection status line when overdue: "OVERDUE · 12 days · EUR 3,000" — urgency-high red, same weight as status badge
- "Handle Late Payment" should scroll to the DefenseDashboard section (`scrollIntoView({ behavior: 'smooth' })`) after setting the pre-fill state
- Context field pre-fill: format `due_date` as a human-readable string (e.g. "April 15") for the `payment_first` tool's `due_date` field — not an ISO string
- Days overdue calculation uses client-side `new Date()` to avoid server/client hydration mismatch

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-payment-tracking*
*Context gathered: 2026-04-24*
