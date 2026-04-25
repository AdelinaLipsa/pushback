# Phase 10: Smart Escalation & Proactive Alerts

## Goal
Make Pushback proactive — it surfaces what needs attention without the freelancer having to remember to check. And after generating a message, it tells them what to do next if the client ignores it.

## What Changes

### 1. ResponseOutput: Next Step card
**File:** `components/defense/ResponseOutput.tsx`

After a message is generated, show a "What to do if they don't respond" card below the action buttons. This is tool-type-aware:

- `payment_first` → "If no payment in 7 days: send the firm follow-up. Come back and use 'Payment Follow-Up'."
- `payment_second` → "If still no payment in 7 more days: send the final notice. Come back and use 'Final Payment Notice'."
- `payment_final` → "If still unpaid: consider small claims or a collections agency. Keep all records."
- `ghost_client` → "If no response in 5 business days: project is formally paused. Document the silence."
- `scope_change` → "If they push back: stand firm or offer to quote the addition. Don't start the work."
- `moving_goalposts` → "If they insist: this is new scope. Do not continue without a revised agreement."
- `chargeback_threat` → "Immediately: gather and save all evidence of delivery — files sent, approvals received, communications."
- `review_threat` → "Do not negotiate under threat. Document everything. Your response is on record."
- All others → "Keep a record of this exchange. If the situation escalates, use 'Dispute Response'."

ResponseOutput needs to receive `toolType: DefenseTool` as a new prop. Pass it from DefenseDashboard where `response` state is set alongside `selectedTool`.

UI: subtle card below the action row. Dark surface (`var(--bg-surface)`), thin border, small text in `text-[#52525b]`. No lime accent — this is informational, not a CTA.

### 2. Dashboard: Proactive overdue payment alert section
**File:** `app/(dashboard)/dashboard/page.tsx`

The server page already fetches projects with `payment_due_date` and `payment_received_at`. Add a "Needs attention" section above the projects list that shows:
- Projects where payment is overdue (due date passed, not received)
- Projects where payment is due within 3 days

UI: a compact alert row per project, lime left border for "due soon", red left border for overdue. Each row: project name, client, amount, days overdue / days remaining, "Handle now →" link to the project.

Only show the section if there are items to show. Fade-up with `animationDelay: '0.05s'`.

### 3. Project detail: Escalation prompt
**File:** `components/project/ProjectDetailClient.tsx` or a new `EscalationPrompt.tsx`

If the project's most recent defense_response is a payment reminder and it was sent (`was_sent: true`) more than 7 days ago, show an escalation nudge: "Payment reminder sent X days ago — time to escalate?" with a button that selects the next payment tool.

Logic:
- Look at `project.defense_responses` (already in props via the page query)
- Find the most recent `payment_first` or `payment_second` where `was_sent === true`
- Compare `created_at` to today — if > 7 days, show nudge
- Button: scroll to defense dashboard and pre-select the next tool in the chain
  - `payment_first` → select `payment_second`
  - `payment_second` → select `payment_final`

This requires passing a `setSelectedTool` or trigger down through `ProjectDetailClient` → `DefenseDashboard`. The cleanest approach: add an `autoSelectTool?: DefenseTool` prop to `DefenseDashboard` (similar to existing `initialPaymentPrefill` pattern). The nudge button sets a state in `ProjectDetailClient` that passes the tool to `DefenseDashboard` via this prop.

## Files to Change
1. `components/defense/ResponseOutput.tsx` — add `toolType` prop + next-step card
2. `components/defense/DefenseDashboard.tsx` — pass `toolType` to ResponseOutput when setting response state
3. `app/(dashboard)/dashboard/page.tsx` — add "Needs attention" alert section
4. `components/project/ProjectDetailClient.tsx` — add escalation nudge logic
5. New component: `components/defense/NextStepCard.tsx` — the next-step card UI (extracted for clarity)
6. New component: `components/shared/AttentionAlert.tsx` — the overdue/due-soon alert row for dashboard

## Success Criteria
1. After generating a payment_first message, ResponseOutput shows "If no payment in 7 days: send the firm follow-up"
2. Dashboard shows an alert section listing projects with overdue or due-within-3-days payments
3. A project with a payment_first sent 8+ days ago shows an escalation nudge in the project detail
4. Clicking the escalation nudge pre-selects payment_second in the defense grid
