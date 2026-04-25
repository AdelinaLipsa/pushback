# Phase 10: Smart Escalation - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the proactive layer to Pushback: every generated defense message shows a tool-type-aware "what to do if they don't respond" card, and the dashboard surfaces projects needing attention (overdue payments, ghost clients, stalled projects) without the freelancer having to remember to check.

**In scope:**
- `ResponseOutput` — new `toolType` prop + `NextStepCard` below action buttons (all 20 tool types)
- `DefenseDashboard` — pass `selectedTool.type` to `ResponseOutput` when setting response state
- Dashboard page — "Needs Attention" section: overdue payments, due-soon payments, ghost clients, stalled projects
- Dashboard query — add `was_sent` to `defense_responses` join
- Project page query — extend to include `defense_responses(id, tool_type, created_at, was_sent)` for escalation nudge
- `ProjectDetailClient` — escalation nudge for payment chain (payment_first/second sent >7 days ago)
- URL-param tool pre-selection: `/projects/[id]?tool=<DefenseTool>` auto-selects tool in `DefenseDashboard`
- New components: `NextStepCard`, `AttentionAlert`

**Out of scope:**
- Ghost client / stalled detection on the project detail page (only the dashboard section surfaces these)
- Any changes to the contract analysis or upload flows
- Document generation (Phase 11)

</domain>

<decisions>
## Implementation Decisions

### Dashboard: Needs Attention scope
- **D-01:** Surface ALL THREE alert types: overdue payments, ghost clients, and stalled projects. This is the full scope from the roadmap success criteria — not just payment overdue.
- **D-02:** Detection logic:
  - **Overdue payment:** `payment_due_date < today` AND `payment_received_at IS NULL`
  - **Payment due soon:** `payment_due_date` within 3 days AND `payment_received_at IS NULL`
  - **Ghost client:** most recent defense_response with `tool_type = 'ghost_client'` AND `was_sent = true` AND `created_at` > 5 business days ago
  - **Stalled:** most recent defense_response with `tool_type IN ('payment_first', 'payment_second')` AND `was_sent = true` AND `created_at` > 7 days AND `payment_received_at IS NULL`
- **D-03:** Dashboard Supabase query must add `was_sent` to the `defense_responses` join: `defense_responses(id, tool_type, created_at, was_sent)`. The project `*` select already includes `payment_due_date` and `payment_received_at`.
- **D-04:** Show section only when items exist. Each row: project name, client name, description of issue, days overdue/remaining, "Handle now →" link. UI: compact alert row, lime left border for due-soon, red left border for overdue, a distinct border color (amber or muted) for ghost/stalled.

### "Handle now →" deep-link
- **D-05:** "Handle now →" links to `/projects/[id]?tool=<DefenseTool>`. Tool pre-selection examples:
  - Payment overdue → `?tool=payment_first` (or `payment_second` if `payment_first` already sent)
  - Ghost client → `?tool=ghost_client`
  - Stalled (payment_first sent) → `?tool=payment_second`
  - Stalled (payment_second sent) → `?tool=payment_final`
- **D-06:** `DefenseDashboard` reads a new `autoSelectTool?: DefenseTool` prop. The project page passes this from the URL search param. On mount, if `autoSelectTool` is set, `selectTool()` is called with the matching `DefenseToolMeta`. This is a generalization of the existing `initialPaymentPrefill` pattern.

### Escalation nudge (project detail)
- **D-07:** Project page query extended server-side: `select('*, contracts(id, risk_score, risk_level, title), defense_responses(id, tool_type, created_at, was_sent)')`. No separate client fetch.
- **D-08:** Escalation nudge shows in `ProjectDetailClient` when: most recent `payment_first` or `payment_second` where `was_sent = true` was created >7 days ago AND `payment_received_at IS NULL`.
- **D-09:** Nudge button uses `autoSelectTool` prop on `DefenseDashboard`. Clicking the nudge button sets state in `ProjectDetailClient` → passed to `DefenseDashboard` via `autoSelectTool`. Chain: `payment_first` → selects `payment_second`, `payment_second` → selects `payment_final`.

### NextStepCard UI
- **D-10:** Single card style for all 20 tool types. No distinction between "come back to Pushback" and "document and wait" guidance — same subtle card UI.
- **D-11:** Card placement: below the action buttons row in `ResponseOutput`. Dark surface (`var(--bg-surface)`), thin border (`var(--bg-border)`), small text in `text-[#52525b]`. No lime accent — informational, not a CTA.
- **D-12:** No dismiss button. Card stays visible as long as the response is visible. Disappears naturally when user clicks Regenerate (response clears).
- **D-13:** No button inside the card for non-action tools (`ghost_client`, `review_threat`, `chargeback_threat`, etc.) — text-only guidance. The text itself for payment tools mentions coming back to Pushback (e.g., "Come back and use 'Payment Follow-Up'") — no explicit button needed.
- **D-14:** `NextStepCard` is a new extracted component (`components/defense/NextStepCard.tsx`) accepting `toolType: DefenseTool`.

### Claude's Discretion
- Exact wording/refinement of the next-step strings (the plan has a full mapping — use those strings as-is unless they need grammatical cleanup)
- Whether to show "Handle now →" link text or a full styled button (keep it as a link for visual consistency with the plan description)
- Fade-in animation timing for the Needs Attention section (match existing dashboard animation pattern)
- Whether `AttentionAlert` is a shared or local component (co-locate in dashboard if only used there)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types
- `types/index.ts` — `DefenseTool` union (all 20 values), `Project` type (includes `payment_due_date`, `payment_received_at`), `DefenseResponse` type (includes `was_sent`, `tool_type`, `created_at`)

### Key Source Files
- `components/defense/ResponseOutput.tsx` — Current props: `{ response, responseId, onRegenerate, contractClausesUsed? }`. Add `toolType: DefenseTool`.
- `components/defense/DefenseDashboard.tsx` — `selectedTool` is `DefenseToolMeta | null`. Response state is `{ text, id, contractClausesUsed? }`. Add `autoSelectTool?: DefenseTool` prop. Pass `selectedTool.type` to `ResponseOutput`.
- `app/(dashboard)/dashboard/page.tsx` — Current query: `defense_responses(id, tool_type, created_at)`. Extend to include `was_sent`. Add Needs Attention section above projects list.
- `app/(dashboard)/projects/[id]/page.tsx` — Current: `select('*, contracts(id, risk_score, risk_level, title)')`. Extend to include `defense_responses(id, tool_type, created_at, was_sent)`.
- `components/project/ProjectDetailClient.tsx` — Add escalation nudge logic reading `defense_responses` from project props.

### Prior Phase Patterns
- Phase 09 context (`09-CONTEXT.md`) — `contractClausesUsed` prop extension pattern for `ResponseOutput`; `autoSelectTool` follows the same prop-extension pattern as `hasContract`/`contractRiskLevel`
- Phase 07 context (`07-CONTEXT.md`) — `initialPaymentPrefill` pattern — `autoSelectTool` is the generalization of this
- Phase 04 context (`04-CONTEXT.md`) — `btnStyles.primary` (lime CTAs); `var(--brand-lime)` accent

### UI Reference
- `.planning/phases/10-smart-escalation/10-PLAN.md` — Full next-step string mapping for all 20 tool types; alert row UI spec

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/defense/ResponseOutput.tsx` — Add `toolType: DefenseTool` prop; render `<NextStepCard toolType={toolType} />` below action buttons
- `components/defense/DefenseDashboard.tsx` — `selectedTool.type` is available when `setResponse()` is called; add `autoSelectTool` prop following `initialPaymentPrefill` pattern
- `lib/ui.ts` → `btnStyles.primary` — lime CTA styling for any new buttons
- Dashboard `defense_responses` join — already exists, just extend columns to include `was_sent`

### Established Patterns
- Props flow: page.tsx (server) → ProjectDetailClient → DefenseDashboard → SituationPanel/ResponseOutput
- URL search params → `autoSelectTool` prop: read `searchParams.tool` in project page, validate against `DEFENSE_TOOLS`, pass as prop
- Compensating decrement on all failure paths in defend route — escalation nudge doesn't touch this
- `var(--bg-surface)` for subtle informational cards; `var(--urgency-high)` for red/overdue states; `#f59e0b` (amber) for warning states

### Integration Points
- `DefenseDashboard` `autoSelectTool` prop consumed on mount via `useEffect` — calls `selectTool(matchingMeta)` automatically
- Dashboard "Needs Attention" section computed server-side from the extended query result — pure derived state, no new API routes
- Project page `defense_responses` join feeds escalation nudge in `ProjectDetailClient` via project prop

</code_context>

<specifics>
## Specific Ideas

- The tool-type next-step strings are fully specified in `10-PLAN.md` — use those verbatim
- "Handle now →" is a link (`<Link href={...}>`), not a button — consistent with dashboard CTA style
- Needs Attention section header: "Needs attention" (lowercase 'n', consistent with existing dashboard heading style)
- Ghost client detection uses 5 business days (not calendar days) — the plan specifies "5 business days"
- Stalled project detection uses 7 calendar days (the plan specifies "> 7 days")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-smart-escalation*
*Context gathered: 2026-04-25*
