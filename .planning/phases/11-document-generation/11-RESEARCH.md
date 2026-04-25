# Phase 11: Document Generation - Research

**Researched:** 2026-04-25
**Domain:** React state management, Next.js route handlers, Anthropic SDK, Supabase auth — all in-codebase patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Document generation button is **visible to all users**. Free users who click it see the existing `UpgradePrompt`. Do NOT hide the button from free users.
- **D-02:** Pro plan check: `profile.plan === 'pro'`. Free users hitting the API directly receive a 403 with `{ error: 'PRO_REQUIRED' }`.
- **D-03:** The generated document **replaces** the ResponseOutput view in the right panel. No routing or page navigation needed.
- **D-04:** State toggle in DefenseDashboard — `documentOutput` state set → renders DocumentOutput instead of ResponseOutput.
- **D-05:** Document generation is **response-gated** — button only appears inside ResponseOutput after a defense message has been generated in the current session.
- **D-06:** The button is a **secondary action** in ResponseOutput, below the primary Copy + Mark as sent row. Uses ghost/outline button style (not lime/primary).
- **D-07:** Exactly 3 document types in v1:
  - `sow_amendment` — triggered by `scope_change` or `moving_goalposts` tool responses
  - `kill_fee_invoice` — triggered by `kill_fee` tool response
  - `dispute_package` — triggered by `dispute_response`, `chargeback_threat`, or `review_threat` tool responses
- **D-08:** No expansion for `payment_final` demand letter or `ip_dispute` doc in this phase.
- **D-09:** `POST /api/projects/[id]/document` — new route. Accepts `{ document_type, context }`. Pro-only gate by checking profile plan (not RPC). Returns `{ document: string }`.
- **D-10:** Fetches full project including `contracts(analysis)` and `defense_responses`. Same auth pattern as the defend route.
- **D-11:** `components/defense/DocumentOutput.tsx` — new component. Displays document in `<pre>` / monospace block. Includes: Copy button (reuse CopyButton), "Edit before sending" note, and "← Back to message" button.
- **D-12:** The "← Back to message" button calls an `onBack()` callback prop which clears `documentOutput` state in DefenseDashboard.
- **D-13:** 3 new state fields in DefenseDashboard: `documentLoading: boolean`, `documentOutput: string | null`, `documentError: string | null`.
- **D-14:** `handleGenerateDocument(type)` function: calls POST route, sets `documentOutput` on success, shows UpgradePrompt for free users (same pattern as `handleGenerate`).

### Claude's Discretion

- Exact loading text for document generation button (e.g. "Generating…")
- Whether `documentError` displays inline in DocumentOutput or as a toast notification
- Minor styling details of the secondary document button in ResponseOutput

### Deferred Ideas (OUT OF SCOPE)

- `payment_final` → formal payment demand letter
- `ip_dispute` → IP assignment dispute document
- Download as .txt or .docx — copy-to-clipboard is sufficient for v1
- Document storage in DB (save generated documents to a new `documents` table)
</user_constraints>

---

## Summary

Phase 11 is a tightly scoped, in-codebase feature addition. Every building block already exists: the auth/plan check pattern is in the defend route, the Anthropic call pattern is in the analyze-message route, the state machine lives in DefenseDashboard, and the output UI pattern comes from ResponseOutput. The only net-new artifacts are: one API route, one component, one `lib/api.ts` function, and state additions to two existing components plus a one-line `CopyButton` change.

The phase requires no new dependencies, no schema migrations, and no new Supabase tables. Documents are ephemeral — generated on demand, returned in the response body, never persisted. The Pro gate is enforced at both the client level (show UpgradePrompt) and the server level (check profile.plan, return 403 PRO_REQUIRED).

All architectural decisions are locked in CONTEXT.md. Research confirms that the existing code patterns map cleanly to every requirement without deviation.

**Primary recommendation:** Replicate the defend route auth/Anthropic pattern exactly for the new document route, but replace the atomic RPC gate with a simple profile plan check (no usage counter). Add `DocumentType` union to `types/index.ts`, replicate the `generateDefense` pattern in `lib/api.ts`, extend DefenseDashboard state, and author DocumentOutput using existing CSS variable tokens and `btnCls.outline`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pro gate enforcement | API / Backend | Browser (client-side UpgradePrompt) | Server is authoritative; client gate is UX only |
| Document generation (Anthropic call) | API / Backend | — | AI call must be server-side (API key protection) |
| State management (documentOutput, documentLoading) | Browser / Client | — | ephemeral UI state, no persistence needed |
| Panel swap (ResponseOutput → DocumentOutput) | Browser / Client | — | conditional render based on state, no routing |
| Document fetch (project + contracts + defense_responses) | API / Backend | — | Supabase server client with auth check |
| Copy to clipboard | Browser / Client | — | `navigator.clipboard` is a browser API |

---

## Standard Stack

### Core (no new installations needed)

| Library | Version (verified) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| Anthropic SDK (`@anthropic-ai/sdk`) | Already installed | AI text generation | Already used in defend + analyze routes |
| Supabase SSR (`@supabase/ssr`) | Already installed | Auth + DB queries | Used across all existing routes |
| Zod | ^4.3.6 (npm registry verified in STATE.md) | Input validation | Standard for all route schemas in this project |
| React (`useState`) | Already installed | Component state | DefenseDashboard state additions |

[VERIFIED: codebase grep — all packages already in node_modules]

### No New Dependencies

This phase introduces zero new npm packages. All patterns are replicated from existing code.

**Version verification:** No `npm view` needed — all dependencies confirmed present via codebase inspection.

---

## Architecture Patterns

### System Architecture Diagram

```
User (ResponseOutput rendered)
  │
  ├─ Free user clicks document button
  │    └─ setShowUpgrade(true) → UpgradePrompt renders (existing component)
  │
  └─ Pro user clicks document button
       └─ handleGenerateDocument(type) [DefenseDashboard]
            ├─ setDocumentLoading(true)
            ├─ generateDocument(projectId, type, context) [lib/api.ts]
            │    └─ POST /api/projects/[id]/document
            │         ├─ Auth check (createServerSupabaseClient + getUser)
            │         ├─ Profile fetch → plan check → 403 PRO_REQUIRED if free
            │         ├─ Project fetch (title, client_name, contracts.analysis, defense_responses)
            │         └─ Anthropic call (claude-sonnet-4-6, document prompt)
            │              └─ Response.json({ document: string })
            └─ setDocumentOutput(result.document)
                 └─ DocumentOutput renders (replaces ResponseOutput)
                      ├─ <pre> block (monospace, whitespace-pre-wrap)
                      ├─ "Edit before sending" note
                      ├─ CopyButton (label="Copy Document", no responseId)
                      └─ "← Back to message" → setDocumentOutput(null) → ResponseOutput re-renders
```

### Recommended Project Structure (new files only)

```
app/api/projects/[id]/
└── document/
    └── route.ts              # new — POST handler, Pro gate, Anthropic call

components/defense/
└── DocumentOutput.tsx        # new — pre block, copy button, back button, edit note

lib/
└── api.ts                    # modified — add generateDocument() function

components/defense/
├── DefenseDashboard.tsx      # modified — 3 state fields + handleGenerateDocument
└── ResponseOutput.tsx        # modified — document button row + new props

components/shared/
└── CopyButton.tsx            # modified — add optional label?: string prop

types/
└── index.ts                  # modified — add DocumentType union type
```

### Pattern 1: Document Route — Auth + Plan Check (NO atomic RPC)

The defend route uses an atomic RPC gate because it consumes a credit. Document generation has no usage counter — it uses a simple profile fetch instead.

```typescript
// Source: app/api/projects/[id]/document/route.ts (new file — adapted from defend/route.ts)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Pro gate — no RPC, no usage counter (D-09)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!profile || profile.plan !== 'pro') {
    return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
  }

  // ... validate body, fetch project, call Anthropic, return { document }
}
```

[VERIFIED: defend/route.ts — auth pattern; CONTEXT.md D-02 — PRO_REQUIRED error code; D-09 — no RPC gate]

### Pattern 2: Document Route — Input Schema

```typescript
// Source: Zod 4.x — same version used in defend/route.ts (STATE.md: "Zod ^4.3.6")
const DOCUMENT_TYPE_VALUES = ['sow_amendment', 'kill_fee_invoice', 'dispute_package'] as const
type DocumentType = typeof DOCUMENT_TYPE_VALUES[number]

const documentSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPE_VALUES),
  context: z.string().max(2000).optional(), // extra user context, optional
})
```

[VERIFIED: CONTEXT.md D-07 — 3 document types; defend/route.ts — Zod enum pattern]

### Pattern 3: Anthropic Call — Document Generation

```typescript
// Source: app/api/projects/[id]/defend/route.ts — model, max_tokens, message structure
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,              // documents are longer than emails — increase from defend's 1024
  system: DOCUMENT_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }]
})
const document = message.content[0].type === 'text' ? message.content[0].text : ''
```

[VERIFIED: defend/route.ts — exact call shape; CONTEXT.md D-09 — returns { document: string }]

Note: Use `acquireAnthropicSlot` / `releaseAnthropicSlot` from `lib/rate-limit.ts` for concurrency control, same as the defend and analyze routes. [VERIFIED: rate-limit.ts exports]

### Pattern 4: lib/api.ts — generateDocument function

```typescript
// Source: lib/api.ts — generateDefense pattern (exact mirror)
type DocumentData = { document: string }
export type DocumentResult = { upgradeRequired: true } | (DocumentData & { upgradeRequired?: false }) | null

export async function generateDocument(
  projectId: string,
  body: { document_type: 'sow_amendment' | 'kill_fee_invoice' | 'dispute_package'; context?: string }
): Promise<DocumentResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.status === 403 && data.error === 'PRO_REQUIRED') return { upgradeRequired: true }
    if (!res.ok) { toast.error(data?.error ?? 'Something went wrong.'); return null }
    return data as DocumentData
  } catch {
    toast.error('Network error — check your connection.')
    return null
  }
}
```

[VERIFIED: lib/api.ts — generateDefense shape; CONTEXT.md D-02 — PRO_REQUIRED error string]

### Pattern 5: DefenseDashboard State Extension

```typescript
// Source: DefenseDashboard.tsx — existing state shape + D-13 additions
const [documentLoading, setDocumentLoading] = useState(false)
const [documentOutput, setDocumentOutput] = useState<string | null>(null)
const [documentError, setDocumentError] = useState<string | null>(null)

async function handleGenerateDocument(type: DocumentType) {
  if (plan !== 'pro') { setShowUpgrade(true); return }
  setDocumentLoading(true); setDocumentError(null)
  const result = await generateDocument(projectId, { document_type: type })
  setDocumentLoading(false)
  if (!result) return
  if (result.upgradeRequired) { setShowUpgrade(true); return }
  setDocumentOutput(result.document)
}
```

[VERIFIED: DefenseDashboard.tsx — handleGenerate pattern; CONTEXT.md D-13, D-14]

### Pattern 6: Render Switch — DocumentOutput vs ResponseOutput

```typescript
// Source: DefenseDashboard.tsx — showResponse condition + D-03/D-04
{showResponse && documentOutput === null && (
  <ResponseOutput
    response={response!.text}
    responseId={response!.id}
    onRegenerate={() => setResponse(null)}
    contractClausesUsed={response!.contractClausesUsed}
    toolType={selectedTool.type}
    onGenerateDocument={handleGenerateDocument}
    documentGenerating={documentLoading}
    documentError={documentError}
  />
)}
{showResponse && documentOutput !== null && (
  <DocumentOutput
    document={documentOutput}
    documentType={documentTypeFor(selectedTool.type)}
    onBack={() => setDocumentOutput(null)}
  />
)}
```

[VERIFIED: DefenseDashboard.tsx — showResponse condition; CONTEXT.md D-03, D-04]

### Pattern 7: DocumentType derivation from DefenseTool

The document button label and `document_type` value are derived from the current `selectedTool.type`. Three tool groups map to three document types (D-07):

```typescript
// Pure function, no library needed
function documentTypeFor(tool: DefenseTool): DocumentType | null {
  if (tool === 'scope_change' || tool === 'moving_goalposts') return 'sow_amendment'
  if (tool === 'kill_fee') return 'kill_fee_invoice'
  if (tool === 'dispute_response' || tool === 'chargeback_threat' || tool === 'review_threat') return 'dispute_package'
  return null
}
```

When `documentTypeFor(selectedTool.type)` returns `null`, the document button row is not rendered in ResponseOutput. This is the correct behavior — not all tools have a corresponding document type.

[VERIFIED: CONTEXT.md D-07 — tool-to-type mapping]

### Pattern 8: CopyButton label extension (1-line change)

```typescript
// Source: components/shared/CopyButton.tsx — current interface
// Current: interface CopyButtonProps { text: string; responseId?: string }
// New:
interface CopyButtonProps {
  text: string
  responseId?: string
  label?: string  // default "Copy Message"
}
// In JSX: {copied ? <><span>✓</span> Copied</> : (label ?? 'Copy Message')}
```

[VERIFIED: CopyButton.tsx — current hardcoded 'Copy Message'; UI-SPEC.md — CopyButton label note]

### Pattern 9: DocumentOutput component structure

```typescript
// Source: UI-SPEC.md Component Inventory + ResponseOutput.tsx — pre block pattern
'use client'

interface DocumentOutputProps {
  document: string
  documentType: 'sow_amendment' | 'kill_fee_invoice' | 'dispute_package'
  onBack: () => void
}

// Card: bg-bg-surface border border-bg-border rounded-2xl p-6 response-enter
// Header row: document type label (left) + back button (right, btnCls.ghost)
// Pre block: bg-bg-base border border-bg-border rounded-lg p-4 mb-4
// <pre className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0">
// Edit note: text-text-secondary text-xs leading-relaxed
// Copy row: <CopyButton text={document} label="Copy Document" /> (no responseId)
```

[VERIFIED: ResponseOutput.tsx — pre block classes used verbatim; UI-SPEC.md — full layout spec; CopyButton.tsx — text prop]

### Pattern 10: Document button in ResponseOutput

```typescript
// Source: ResponseOutput.tsx — existing action row pattern; UI-SPEC.md — secondary row spec
// New row below existing "flex items-center gap-3 mt-5":
{onGenerateDocument && docType && (
  <div className="mt-4 pt-4 border-t border-bg-border">
    {documentError && (
      <span role="alert" className="text-xs text-urgency-high block mb-2">{documentError}</span>
    )}
    <button
      onClick={() => onGenerateDocument(docType)}
      disabled={documentGenerating}
      aria-busy={documentGenerating}
      className={['lime-pulse-border', btnCls.outline].filter(Boolean).join(' ')
        // apply lime-pulse-border class only when documentGenerating
      }
    >
      {documentGenerating ? 'Generating document…' : DOCUMENT_BUTTON_LABELS[docType]}
    </button>
  </div>
)}
```

[VERIFIED: ResponseOutput.tsx — class pattern; UI-SPEC.md — button row spec, lime-pulse-border; globals.css — .lime-pulse-border animation defined]

### Anti-Patterns to Avoid

- **Atomic RPC for document generation:** The defend route uses `check_and_increment_defense_responses` RPC because it tracks usage credits. Document generation has NO usage counter — use a direct profile plan check instead. Adding an RPC call would be incorrect.
- **Clearing response state on document generation:** `setDocumentOutput(null)` restores the ResponseOutput view; `setResponse(null)` would clear the original message. Never call `setResponse(null)` from the back button handler.
- **Saving documents to Supabase:** Documents are ephemeral. No `defense_responses` or `documents` table insert. Deferred explicitly in CONTEXT.md.
- **Rendering markdown:** Documents render in a `<pre>` block, not a markdown renderer. The `whitespace-pre-wrap` class preserves all formatting that Claude outputs.
- **Using toast for document errors:** Inline error display (below button row) is the established pattern, consistent with `analyzeError` in SituationPanel. No toast library needed.
- **Hiding the document button from free users:** D-01 explicitly requires the button to be visible — free users see UpgradePrompt when they click it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard copy | Custom copy logic | Existing `CopyButton` component | Already handles flash state, `markResponseCopied`, browser API |
| Upgrade gate UI | New upgrade modal | Existing `UpgradePrompt` component + `setShowUpgrade(true)` | Same component used for all upgrade gates in DefenseDashboard |
| Button style | Custom CSS | `btnCls.outline` from `lib/ui.ts` | Enforces design consistency; lib/ui.ts is the canonical source |
| Loading animation | Custom keyframe | `lime-pulse-border` class from `globals.css` | Already defined and used in ToolSidebar |
| Enter animation | Custom keyframe | `response-enter` class from `globals.css` | Already defined and used by ResponseOutput |
| Auth check | Manual cookie parsing | `createServerSupabaseClient()` + `supabase.auth.getUser()` | Standard pattern across all route handlers |

**Key insight:** Every non-trivial UI behavior in this phase has an existing implementation. The work is wiring, not building.

---

## Supabase Query Pattern for Document Route

The document route needs project context to populate document content. The defend route shows the exact query shape to replicate:

```typescript
// Source: app/api/projects/[id]/defend/route.ts — project fetch shape
const { data: project } = await supabase
  .from('projects')
  .select('id, title, client_name, project_value, currency, notes, contracts(analysis)')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()
```

For the document route, also fetch `defense_responses` to include recent response history in document context (D-10):

```typescript
const { data: project } = await supabase
  .from('projects')
  .select('id, title, client_name, project_value, currency, notes, contracts(analysis), defense_responses(tool_type, situation, response, created_at)')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()
```

The `eq('user_id', user.id)` filter is the IDOR guard — it prevents one user from generating documents for another user's project.

[VERIFIED: defend/route.ts — exact query shape; CONTEXT.md D-10 — fetch defense_responses]

---

## Document System Prompt Design

No existing `DOCUMENT_SYSTEM_PROMPT` constant exists in `lib/anthropic.ts`. The new prompt must be added there (following the existing `DEFENSE_SYSTEM_PROMPT` and `CLASSIFY_SYSTEM_PROMPT` constants).

The prompt receives: project name, client name, project value, contract analysis summary (if present), relevant defense_responses (tool type + situation), and the requested document type.

**Key output requirements per document type:**

| Document Type | Structure |
|--------------|-----------|
| `sow_amendment` | Formal amendment header, original scope summary, new scope addition with pricing, signature block with [YOUR NAME] / [CLIENT NAME] placeholders |
| `kill_fee_invoice` | Invoice header, project description, kill fee amount (% of project value if available), payment due date, [YOUR NAME] / [YOUR PAYMENT DETAILS] placeholders |
| `dispute_package` | Dispute summary, timeline of events (based on defense_responses), position statement, resolution request, [YOUR NAME] placeholder |

All documents must include placeholder text like `[YOUR NAME]`, `[YOUR PAYMENT DETAILS]` — the "Edit before sending" note in DocumentOutput directs the user to fill these in.

[VERIFIED: CONTEXT.md specifics section; UI-SPEC.md Copywriting Contract — "Edit before sending" note]

---

## TypeScript Types Required

Add `DocumentType` to `types/index.ts`:

```typescript
// Add to types/index.ts
export type DocumentType = 'sow_amendment' | 'kill_fee_invoice' | 'dispute_package'
```

Import and use throughout the new route, component, and lib/api.ts function. The `DOCUMENT_TYPE_VALUES` tuple (for Zod enum) lives in the route file, not types/index.ts.

[VERIFIED: types/index.ts — existing pattern for DefenseTool union; CONTEXT.md D-07]

---

## Next.js 16 Route Handler Specifics

**`params` is a Promise** — this is a Next.js 16 breaking change already adopted in all existing routes:

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
// Source: defend/route.ts — confirmed pattern
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // must await params — not params.id directly
```

No other breaking changes apply to this route. The document route is a standard POST handler with no streaming, no cookies manipulation beyond what Supabase SSR handles internally.

[VERIFIED: route.md from node_modules/next/dist/docs/ — v15.0.0-RC: "context.params is now a promise"; defend/route.ts — pattern in use]

---

## Common Pitfalls

### Pitfall 1: Using the atomic RPC gate for document generation

**What goes wrong:** Developer copies defend/route.ts wholesale and keeps `check_and_increment_defense_responses` RPC. This incorrectly consumes a free-tier credit for a Pro-only feature, and the RPC's `allowed: false` branch would block Pro users who happen to have their counter at max.
**Why it happens:** The defend route is the canonical template, so copy-paste includes the RPC.
**How to avoid:** The document route's gate is `profile.plan !== 'pro'` — a simple equality check, no RPC.
**Warning signs:** Route imports `check_and_increment_defense_responses` or `decrement_defense_responses`.

### Pitfall 2: Clearing response state from the back button

**What goes wrong:** `onBack()` calls `setResponse(null)` instead of `setDocumentOutput(null)`. User clicks "← Back to message" and sees a blank state instead of their original generated message.
**Why it happens:** Confusion between the two state fields.
**How to avoid:** `onBack` prop in DefenseDashboard is `() => setDocumentOutput(null)`. The `response` state must never be touched by document-related handlers.
**Warning signs:** Back button shows SituationPanel instead of ResponseOutput.

### Pitfall 3: documentTypeFor returns null for non-document tools — button renders anyway

**What goes wrong:** `onGenerateDocument` prop is passed to ResponseOutput but `docType` is not derived from `selectedTool.type`, so the button renders for tools like `payment_first` that have no matching document type.
**Why it happens:** Missing the `documentTypeFor(selectedTool.type)` null check.
**How to avoid:** Wrap the document button row with `{onGenerateDocument && docType && (...)}`  — both conditions required.
**Warning signs:** Document button appears on payment or ghost client responses.

### Pitfall 4: Zod version mismatch

**What goes wrong:** Using Zod 3.x API (`.enum(['a', 'b'])` with an array) instead of Zod 4.x (`.enum(['a', 'b'] as const)` or `.enum(TUPLE)`).
**Why it happens:** Training data defaults to Zod 3.x.
**How to avoid:** STATE.md notes: "Zod ^4.3.6 — route hardening plans must use Zod 4.x API." The pattern in defend/route.ts uses `z.enum(DEFENSE_TOOL_VALUES)` where `DEFENSE_TOOL_VALUES` is a typed tuple — replicate exactly.
**Warning signs:** TypeScript error on `z.enum()` call.

### Pitfall 5: Missing `border` class on `lime-pulse-border` button

**What goes wrong:** `lime-pulse-border` animates `border-color`, but if the button has no `border` utility class the animation has nothing to animate. The button renders without visible pulse.
**Why it happens:** Using `bg-transparent` button without explicit border class, then adding `lime-pulse-border` hoping it adds the border.
**How to avoid:** `btnCls.outline` from lib/ui.ts already includes `border border-bg-border` — use it as the base class. The `lime-pulse-border` animation overrides `border-color` from `var(--bg-border)` to `var(--brand-lime)`.
**Warning signs:** Button does not visibly pulse during loading.

---

## Code Examples

### Full document button label map

```typescript
// Source: UI-SPEC.md Copywriting Contract
const DOCUMENT_BUTTON_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'Generate SOW Amendment',
  kill_fee_invoice: 'Generate Kill Fee Invoice',
  dispute_package: 'Generate Dispute Package',
}

const DOCUMENT_HEADER_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'SOW Amendment',
  kill_fee_invoice: 'Kill Fee Invoice',
  dispute_package: 'Dispute Package',
}
```

[VERIFIED: UI-SPEC.md Copywriting Contract]

### Accessibility attributes for document button

```typescript
// Source: UI-SPEC.md Accessibility section
<button
  onClick={() => onGenerateDocument(docType)}
  disabled={documentGenerating}
  aria-busy={documentGenerating}
  className={[btnCls.outline, documentGenerating ? 'lime-pulse-border' : ''].join(' ').trim()}
>
  {documentGenerating ? 'Generating document…' : DOCUMENT_BUTTON_LABELS[docType]}
</button>
```

### Accessibility attributes for DocumentOutput

```typescript
// Source: UI-SPEC.md Accessibility section
<button
  onClick={onBack}
  aria-label="Back to generated message"
  className={btnCls.ghost}
>
  ← Back to message
</button>

<div role="region" aria-label="Generated document">
  <pre className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0">
    {document}
  </pre>
</div>

{/* error in ResponseOutput */}
<span role="alert" className="text-xs text-urgency-high mt-2 block">{documentError}</span>
```

[VERIFIED: UI-SPEC.md Accessibility section]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `middleware` export | `proxy.ts` with `proxy` export | Next.js 16 (Phase 2) | Already handled — do not create middleware.ts |
| `params.id` direct access | `const { id } = await params` | Next.js 15+ | All existing routes already await params — follow suit |
| Zod 3.x `.enum(['a', 'b'])` with array | Zod 4.x `.enum(TUPLE)` with tuple | Zod 4.0 | STATE.md confirms Zod ^4.3.6 installed |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 11 is purely code changes. All runtime dependencies (Anthropic API, Supabase) are already operational and in use by existing routes. No new external dependencies introduced.

---

## Validation Architecture

`nyquist_validation: false` in `.planning/config.json` — this section is omitted.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `createServerSupabaseClient()` + `supabase.auth.getUser()` — same as all existing routes |
| V3 Session Management | no | Handled by Supabase SSR; no new session logic |
| V4 Access Control | yes | `profile.plan !== 'pro'` check + `eq('user_id', user.id)` IDOR guard on project fetch |
| V5 Input Validation | yes | Zod 4.x schema on `document_type` (enum) + optional `context` (string, max 2000) |
| V6 Cryptography | no | No new crypto; Anthropic API key via env var, existing pattern |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — generate document for another user's project | Tampering | `.eq('user_id', user.id)` on all project fetches |
| Pro gate bypass via direct API call | Elevation of Privilege | Server-side `profile.plan !== 'pro'` check; client check is UX only |
| Prompt injection via `context` field | Tampering | `context` max 2000 chars; Zod validates; off-topic guard in system prompt |
| Unauthenticated access | Spoofing | `if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })` |

[VERIFIED: defend/route.ts — auth + IDOR patterns; CONTEXT.md D-02 — PRO_REQUIRED pattern]

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md reads: `@AGENTS.md`

AGENTS.md directive: **"This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."**

Research has consulted `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`. Key constraint confirmed: `params` must be awaited (`const { id } = await params`). This is already the pattern in all existing route handlers in this codebase.

No other breaking changes from the docs apply to this phase's scope.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Document generation warrants `max_tokens: 2048` (vs defend's 1024) because documents are structurally longer than emails | Anthropic Call pattern | Document truncated mid-structure; increase to 4096 if needed |
| A2 | The `context` input field sent from the client contains the current `situation` text from the defense response — this provides the doc route with event-specific detail beyond what's in the project record | Supabase Query Pattern | Document is generic without situation context; may need to also send the defense response text |

**A2 note:** CONTEXT.md D-09 says the route accepts `{ document_type, context }` but does not specify what `context` contains. The implementation decision (what to pass as `context` from the client) is Claude's discretion. Passing the situation description from the current response state is the logical choice.

---

## Open Questions

1. **What does `context` contain in the POST body?**
   - What we know: D-09 says route accepts `{ document_type, context }`. The client-side `handleGenerateDocument` is a new function.
   - What's unclear: Should `context` be the `situation` text from the current defense response? The full `response.text`? Both?
   - Recommendation: Pass the situation description as context. The document route fetches the full project + contracts anyway; situational specificity comes from `context`. Plan as: `context: situationText` where `situationText` is the situation field from the current session.

2. **`acquireAnthropicSlot` for document route?**
   - What we know: defend route and analyze route both call `acquireAnthropicSlot()` / `releaseAnthropicSlot()` for concurrency control.
   - What's unclear: Is the document route expected to participate in the same concurrency limiter?
   - Recommendation: Yes — include slot acquisition/release. It's a best practice for all Anthropic calls in this app and prevents runaway concurrent requests. [VERIFIED: rate-limit.ts — exports available]

---

## Sources

### Primary (HIGH confidence)
- `app/api/projects/[id]/defend/route.ts` — auth pattern, Anthropic call shape, project query, Zod enum pattern
- `app/api/projects/[id]/analyze-message/route.ts` — secondary reference for cleaner route structure (no buildContractContext complexity)
- `components/defense/DefenseDashboard.tsx` — state machine, handleGenerate pattern, UpgradePrompt trigger
- `components/defense/ResponseOutput.tsx` — action row structure, pre block classes, prop interface
- `components/shared/CopyButton.tsx` — current interface (text, responseId), copy flash behavior
- `components/shared/UpgradePrompt.tsx` — upgrade gate component interface
- `lib/api.ts` — generateDefense pattern (exact template for generateDocument)
- `lib/ui.ts` — btnCls.outline, btnCls.ghost, btnStyles — which variant to use where
- `lib/anthropic.ts` — anthropic client instance, model string (claude-sonnet-4-6), system prompt pattern
- `app/globals.css` — response-enter, lime-pulse-border, limepulse keyframe — confirmed defined
- `types/index.ts` — DefenseTool union, existing type patterns
- `.planning/phases/11-document-generation/11-CONTEXT.md` — all locked decisions
- `.planning/phases/11-document-generation/11-UI-SPEC.md` — component layout, props, copywriting, animations
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — params is a Promise (Next.js 16)

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Zod ^4.3.6 version confirmation, established decisions
- `lib/supabase/server.ts` — createServerSupabaseClient signature (async, returns typed client)
- `lib/rate-limit.ts` — acquireAnthropicSlot / releaseAnthropicSlot exports confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in codebase; zero new dependencies
- Architecture: HIGH — all patterns verified against existing route handlers and components
- Pitfalls: HIGH — derived from direct code inspection, not speculation
- Document prompt content: MEDIUM — structure and placeholder requirements are clear from CONTEXT.md; exact wording is Claude's discretion

**Research date:** 2026-04-25
**Valid until:** 2026-06-01 (stable stack; no external dependencies changing)
