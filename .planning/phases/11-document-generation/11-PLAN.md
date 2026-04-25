# Phase 11: Document Generation

## Goal
For situations that need more than an email — scope change amendments, dispute timelines, kill fee invoices — generate a structured document the freelancer can copy, save, or attach. This is something no generic Claude prompt produces in one click.

## What Changes

### 1. New API route: `POST /api/projects/[id]/document`
**New file:** `app/api/projects/[id]/document/route.ts`

Accepts:
```ts
{
  document_type: 'sow_amendment' | 'dispute_package' | 'kill_fee_invoice',
  context: Record<string, string | number>  // additional fields specific to doc type
}
```

Auth + rate limit same pattern as defend route. Does NOT use the plan gate RPC (document generation is a Pro-only feature — gate by checking `profile.plan === 'pro'`; return 403 with `{ error: 'PRO_REQUIRED' }` for free users).

Fetches the full project including contracts(analysis) and all defense_responses.

For each document type, builds a structured prompt and calls Claude (claude-sonnet-4-6, max_tokens: 2048).

Returns `{ document: string }` — formatted plain text / markdown document.

**Document type prompts:**

`sow_amendment`:
Generate a professional Scope of Work Amendment document. Include:
- Amendment number and date
- Original project reference
- Description of original agreed scope
- Description of what the client is requesting
- Additional cost for the new scope
- Revised timeline if applicable
- Signature lines for both parties
Format as a proper business document with clear sections.

`dispute_package`:
Generate a professional dispute summary document. Include:
- Project overview (title, client, dates, value)
- Timeline of key events (pulled from defense_responses sorted by created_at)
- Summary of original agreement
- List of issues that arose
- Evidence of delivery / communications
- Your position statement
Format as a factual, professional record suitable for mediation or small claims.

`kill_fee_invoice`:
Generate a kill fee invoice. Include:
- Invoice header (your business, client, date, invoice number)
- Project reference
- Work completed percentage
- Kill fee calculation (% of project value per contract or standard 25-50%)
- Payment terms
- Bank/payment details section (leave as [YOUR PAYMENT DETAILS])
Format as a proper invoice.

### 2. New UI: Document generation button in ResponseOutput
**File:** `components/defense/ResponseOutput.tsx`

For tool types that have a natural document companion, show a secondary button "Generate document" below the main actions:
- `scope_change` or `moving_goalposts` → "Generate SOW Amendment"
- `kill_fee` → "Generate Kill Fee Invoice"
- `dispute_response` or `chargeback_threat` or `review_threat` → "Generate Dispute Package"

Button triggers a new `onGenerateDocument(type)` callback prop.

### 3. New component: `DocumentOutput.tsx`
**New file:** `components/defense/DocumentOutput.tsx`

Shows the generated document in a full-width code/pre block with:
- "Copy document" button (reuse CopyButton pattern)
- A note: "Edit before sending — update [YOUR NAME], [YOUR PAYMENT DETAILS] etc."
- "Back" button to return to the message view

### 4. Document generation state in DefenseDashboard
**File:** `components/defense/DefenseDashboard.tsx`

Add state:
```ts
const [documentLoading, setDocumentLoading] = useState(false)
const [documentOutput, setDocumentOutput] = useState<string | null>(null)
const [documentError, setDocumentError] = useState<string | null>(null)
```

`handleGenerateDocument(type)`:
- POST to `/api/projects/${projectId}/document`
- Set documentOutput on success
- Show DocumentOutput component when documentOutput is set

If user is on free plan, show UpgradePrompt instead of calling the API.

## Files to Change
1. New: `app/api/projects/[id]/document/route.ts`
2. `components/defense/ResponseOutput.tsx` — add document generation button for applicable tools
3. New: `components/defense/DocumentOutput.tsx`
4. `components/defense/DefenseDashboard.tsx` — add document state + handler + DocumentOutput render

## Success Criteria
1. After generating a scope_change message, "Generate SOW Amendment" button appears
2. Clicking it calls the API and renders a formatted amendment document
3. Free users see the upgrade prompt instead
4. The document includes the project title, client name, and relevant contract data when available
5. A "Copy document" button works the same as the existing copy button
