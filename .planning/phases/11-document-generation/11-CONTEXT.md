# Phase 11: Document Generation - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

For situations requiring more than an email, Pro users can generate a structured document (SOW amendment, dispute package, kill fee invoice) from within the defense flow — one click after a message is generated, not a separate product or page.

</domain>

<decisions>
## Implementation Decisions

### Pro Gate UX
- **D-01:** The document generation button is **visible to all users** (free and Pro). Free users who click it see the existing `UpgradePrompt` — the same flow already used in DefenseDashboard for the message generation gate. Do NOT hide the button from free users. This creates discoverability and a conversion moment at the exact time the user understands why they'd want to upgrade.
- **D-02:** Pro plan check: `profile.plan === 'pro'`. Free users hitting the API directly receive a 403 with `{ error: 'PRO_REQUIRED' }` as an additional server-side guard.

### Document View Layout
- **D-03:** The generated document **replaces** the ResponseOutput view in the right panel. DocumentOutput renders where ResponseOutput was. A "← Back to message" button returns the user to the message view without regenerating.
- **D-04:** This is a state toggle in DefenseDashboard — `documentOutput` state set → renders DocumentOutput instead of ResponseOutput. No routing or page navigation needed.

### Trigger Scope
- **D-05:** Document generation is **response-gated** — the "Generate SOW Amendment" / "Generate Kill Fee Invoice" / "Generate Dispute Package" button only appears inside ResponseOutput after a defense message has been generated in the current session. No standalone entry point, no tool-list shortcut. The flow is: pick tool → generate message → optionally generate document.
- **D-06:** The button is a **secondary action** in ResponseOutput, below the primary Copy + Mark as sent row. Uses the ghost/outline button style (not lime/primary) to signal it's an optional follow-on action, not a required step.

### Document Types (3 types, no expansion)
- **D-07:** Exactly 3 document types in v1:
  - `sow_amendment` — triggered by `scope_change` or `moving_goalposts` tool responses → "Generate SOW Amendment"
  - `kill_fee_invoice` — triggered by `kill_fee` tool response → "Generate Kill Fee Invoice"
  - `dispute_package` — triggered by `dispute_response`, `chargeback_threat`, or `review_threat` tool responses → "Generate Dispute Package"
- **D-08:** No expansion for `payment_final` demand letter or `ip_dispute` doc in this phase. Keep 3 types, ship clean, validate demand.

### API Route
- **D-09:** `POST /api/projects/[id]/document` — new route. Accepts `{ document_type, context }`. Pro-only gate by checking profile plan (not RPC — document generation has no usage counter). Returns `{ document: string }`.
- **D-10:** Fetches full project including `contracts(analysis)` and `defense_responses` to populate the document content. Same auth pattern as the defend route.

### DocumentOutput Component
- **D-11:** `components/defense/DocumentOutput.tsx` — new component. Displays document in a `<pre>` / monospace block (not rendered markdown). Includes: Copy button (reuse CopyButton pattern), "Edit before sending — replace [YOUR NAME], [YOUR PAYMENT DETAILS] etc." note, and "← Back to message" button.
- **D-12:** The "← Back to message" button calls an `onBack()` callback prop which clears `documentOutput` state in DefenseDashboard.

### DefenseDashboard State
- **D-13:** Add 3 new state fields to DefenseDashboard:
  - `documentLoading: boolean`
  - `documentOutput: string | null`
  - `documentError: string | null`
- **D-14:** `handleGenerateDocument(type)` function: calls POST route, sets `documentOutput` on success, shows UpgradePrompt for free users (same pattern as `handleGenerate`).

### Claude's Discretion
- Exact loading text for document generation button (e.g. "Generating…")
- Whether `documentError` displays inline in DocumentOutput or as a toast notification
- Minor styling details of the secondary document button in ResponseOutput

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Patterns
- `.planning/phases/09-contract-intelligence/09-CONTEXT.md` — ResponseOutput props shape (`contractClausesUsed`), response state structure in DefenseDashboard
- `.planning/phases/10-smart-escalation/10-CONTEXT.md` — NextStepCard placement (D-10 to D-14), secondary card style (dark surface, no lime accent), ResponseOutput layout decisions

### No External Specs
No external specs or ADRs for this phase — all requirements captured in decisions above and in the existing plan file.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/shared/CopyButton.tsx` — accepts `text` and optional `responseId`; DocumentOutput should reuse this for the copy action
- `components/shared/UpgradePrompt.tsx` — already used in DefenseDashboard when free user hits response limit; same component for document generation gate
- `components/defense/ResponseOutput.tsx` — action button row at bottom (`CopyButton` + `Mark as sent`); document generation button goes here as a secondary row
- `components/defense/DefenseDashboard.tsx` — owns all response state; `documentOutput` state + `handleGenerateDocument` go here; state toggle controls ResponseOutput vs DocumentOutput render

### Established Patterns
- Inline styles with CSS variables (`var(--bg-surface)`, `var(--bg-border)`) — match existing component style in DefenseDashboard and ResponseOutput
- `btnStyles` from `lib/ui.ts` — `.primary`, `.ghost` variants used throughout
- API calls via `lib/api.ts` functions — new `generateDocument(projectId, type, context)` function follows the `generateDefense` pattern
- Pro gate check: `plan === 'pro'` in component + 403 `PRO_REQUIRED` in route handler

### Integration Points
- `components/defense/DefenseDashboard.tsx` — state hub; pass `documentOutput`, `documentLoading`, `onGenerateDocument`, `onDocumentBack` down to ResponseOutput
- `components/defense/ResponseOutput.tsx` — receives `onGenerateDocument(type)` callback prop + `documentGenerating` loading state
- `app/api/projects/[id]/document/route.ts` — new file, follows `app/api/projects/[id]/defend/route.ts` pattern for auth + project fetch

</code_context>

<specifics>
## Specific Ideas

- Document output displayed as `<pre>` monospace block — not rendered markdown — so formatting (headers, dashes, spacing) is preserved exactly as Claude outputs it
- "Edit before sending" note is always visible below the document, not conditional — every generated document has placeholder text ([YOUR NAME], [YOUR PAYMENT DETAILS]) that must be filled in
- The "← Back to message" button must NOT clear the response state — user should return to seeing their original generated message, not a blank state

</specifics>

<deferred>
## Deferred Ideas

- `payment_final` → formal payment demand letter — noted for potential Phase 12 or post-launch
- `ip_dispute` → IP assignment dispute document — same
- Download as .txt or .docx — copy-to-clipboard is sufficient for v1; file download is a post-launch request
- Document storage in DB (save generated documents to a new `documents` table) — not in scope for Phase 11; documents are ephemeral, generated on demand

</deferred>

---

*Phase: 11-document-generation*
*Context gathered: 2026-04-25*
