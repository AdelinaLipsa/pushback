# Phase 11: Document Generation - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 6 (1 new API route, 1 new component, 4 modifications)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/api/projects/[id]/document/route.ts` | route handler | request-response | `app/api/projects/[id]/defend/route.ts` | exact (same project-scoped POST, Supabase auth, Anthropic call) |
| `components/defense/DocumentOutput.tsx` | component | request-response | `components/defense/ResponseOutput.tsx` | exact (same pre-block, card layout, copy action) |
| `lib/api.ts` (add `generateDocument`) | utility / API client | request-response | existing `generateDefense` function in `lib/api.ts` lines 77–95 | exact |
| `components/defense/DefenseDashboard.tsx` (extend state) | component / state hub | event-driven | existing `handleGenerate` / `handleAnalyze` pattern in same file | exact |
| `components/defense/ResponseOutput.tsx` (add doc button) | component | request-response | existing action row pattern in same file lines 60–76 | exact |
| `components/shared/CopyButton.tsx` (add `label` prop) | utility component | — | existing `CopyButton` interface in same file lines 6–8 | exact (1-line prop extension) |

---

## Pattern Assignments

### `app/api/projects/[id]/document/route.ts` (route handler, request-response)

**Analog:** `app/api/projects/[id]/defend/route.ts`

**Imports pattern** (defend/route.ts lines 1–6):
```typescript
import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { DefenseTool, ContractAnalysis } from '@/types'
import { z } from 'zod'
```

For document route, adapt to:
```typescript
import { anthropic } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { DocumentType } from '@/types'
import { z } from 'zod'
```

Note: `checkRateLimit` and `defendRateLimit` are NOT imported — document generation does not have a per-user rate limit counter (D-09). The `DOCUMENT_SYSTEM_PROMPT` must be added to `lib/anthropic.ts` following the `DEFENSE_SYSTEM_PROMPT` export pattern (lib/anthropic.ts lines 80–209).

**Auth pattern** (defend/route.ts lines 140–144):
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

Copy this block verbatim. `params` must be awaited — Next.js 16 breaking change already established in all existing routes.

**Pro gate pattern — DIFFERENT from defend route** (do NOT copy the RPC gate):

The defend route (lines 150–157) uses `check_and_increment_defense_responses` RPC because it consumes a credit. Document generation has no usage counter — use a direct profile fetch instead:

```typescript
// Pro gate — no RPC, no usage counter (D-09, D-02)
const { data: profile } = await supabase
  .from('user_profiles')
  .select('plan')
  .eq('id', user.id)
  .single()
if (!profile || profile.plan !== 'pro') {
  return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
}
```

Note: error string is `PRO_REQUIRED` (not `UPGRADE_REQUIRED` which the defend route uses). This matches D-02 and the `generateDocument` client function in lib/api.ts.

**Zod schema pattern** (defend/route.ts lines 116–138 — Zod 4.x tuple enum):
```typescript
// Zod 4.x — use typed tuple, not array
const DEFENSE_TOOL_VALUES = [...] as const  // defend pattern
// Adapt to:
const DOCUMENT_TYPE_VALUES = ['sow_amendment', 'kill_fee_invoice', 'dispute_package'] as const
type DocumentType = typeof DOCUMENT_TYPE_VALUES[number]

const documentSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPE_VALUES),
  context: z.string().max(2000).optional(),
})
```

**Validation + body parse pattern** (defend/route.ts lines 160–168):
```typescript
const body = await request.json()
const parsed = documentSchema.safeParse(body)
if (!parsed.success) {
  const issue = parsed.error.issues[0]
  return Response.json({ error: `${String(issue.path[0])}: ${issue.message}` }, { status: 400 })
}
const { document_type, context } = parsed.data
```

Note: No `decrement_defense_responses` RPC call on validation failure — document generation has no credit to roll back.

**Project fetch pattern** (defend/route.ts lines 170–179 — plus defense_responses per D-10):
```typescript
const { data: project } = await supabase
  .from('projects')
  .select('id, title, client_name, project_value, currency, notes, contracts(analysis), defense_responses(tool_type, situation, response, created_at)')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()

if (!project) {
  return Response.json({ error: 'Not found' }, { status: 404 })
}
```

The `.eq('user_id', user.id)` is the IDOR guard — mandatory on all project fetches.

**Anthropic call pattern** (defend/route.ts lines 208–225 — increase max_tokens to 2048):
```typescript
const slotResponse = await acquireAnthropicSlot()
if (slotResponse) return slotResponse

let document: string
try {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,              // documents are longer than emails — defend uses 1024
    system: DOCUMENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  })
  document = message.content[0].type === 'text' ? message.content[0].text : ''
} finally {
  await releaseAnthropicSlot()
}
```

`acquireAnthropicSlot` / `releaseAnthropicSlot` wrap the Anthropic call, same as defend and analyze routes. No decrement RPC in the finally block.

**Response pattern** (defend/route.ts line 239 — simplified, no DB insert):
```typescript
// Documents are ephemeral — no DB insert, no credit decrement (CONTEXT.md Deferred)
return Response.json({ document })
```

**Error handling pattern** (defend/route.ts lines 240–244 — adapt to no RPC decrement):
```typescript
} catch (err) {
  console.error('Document route error:', err)
  return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
}
```

---

### `components/defense/DocumentOutput.tsx` (component, request-response)

**Analog:** `components/defense/ResponseOutput.tsx`

**Imports pattern** (ResponseOutput.tsx lines 1–8):
```typescript
'use client'

import { useState } from 'react'
// ResponseOutput imports Sparkles from lucide-react — DocumentOutput does not need it
import CopyButton from '@/components/shared/CopyButton'
import { DocumentType } from '@/types'
import { btnCls } from '@/lib/ui'
```

**Props interface pattern** (ResponseOutput.tsx lines 10–16 — adapted):
```typescript
interface DocumentOutputProps {
  document: string
  documentType: DocumentType
  onBack: () => void
}
```

**Card + entry animation pattern** (ResponseOutput.tsx line 27):
```typescript
// ResponseOutput uses this exact class string — replicate verbatim
<div className="response-enter bg-bg-surface border border-bg-border rounded-2xl p-6 mt-4">
```

**Header row pattern** (ResponseOutput.tsx lines 30–41 — adapt for doc type label + back button):
```typescript
// ResponseOutput header: title left, regenerate right
// DocumentOutput header: document type label left, back button right
<div className="flex items-center justify-between mb-4">
  <span className="font-semibold text-sm">{DOCUMENT_HEADER_LABELS[documentType]}</span>
  <button
    onClick={onBack}
    aria-label="Back to generated message"
    className={btnCls.ghost}
  >
    ← Back to message
  </button>
</div>
```

Note: `btnCls.ghost` is defined in `lib/ui.ts` line 28: `'inline-flex items-center justify-center gap-2 px-3 py-2 bg-transparent border-0 text-text-muted text-sm cursor-pointer transition-colors duration-150 hover:text-text-primary disabled:opacity-50'`

**Pre block pattern** (ResponseOutput.tsx lines 43–47 — copy exactly):
```typescript
// ResponseOutput uses this exact structure — replicate verbatim
<div role="region" aria-label="Generated document" className="bg-bg-base border border-bg-border rounded-lg p-5 mb-4">
  <pre className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0">
    {document}
  </pre>
</div>
```

Note: ResponseOutput uses `p-5 mb-5`; UI-SPEC says `p-4 mb-4` — use `p-4 mb-4` per UI-SPEC. Wrap in `role="region" aria-label="Generated document"` per UI-SPEC accessibility section.

**Edit note pattern** (new — no analog, but follows text-secondary caption style from throughout the codebase):
```typescript
<p className="text-text-secondary text-xs leading-relaxed mb-4">
  Edit before sending — replace [YOUR NAME], [YOUR PAYMENT DETAILS], and any bracketed placeholders with your specifics before you hit send.
</p>
```

**Copy button row pattern** (ResponseOutput.tsx lines 60–61 — adapted, no responseId):
```typescript
// ResponseOutput: <CopyButton text={response} responseId={responseId} />
// DocumentOutput: no responseId (ephemeral), custom label
<div className="flex items-center gap-2 mt-4">
  <CopyButton text={document} label="Copy Document" />
</div>
```

**Label constants** (not in any analog — define in DocumentOutput.tsx):
```typescript
const DOCUMENT_HEADER_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'SOW Amendment',
  kill_fee_invoice: 'Kill Fee Invoice',
  dispute_package: 'Dispute Package',
}
```

---

### `lib/api.ts` — add `generateDocument` function

**Analog:** `generateDefense` function in `lib/api.ts` lines 63–95

**Type pattern** (lib/api.ts lines 63–75):
```typescript
// Existing pattern for generateDefense:
type DefenseData = {
  response: string
  id: string
  contract_clauses_used?: string[]
}
export type DefenseResult = { upgradeRequired: true } | (DefenseData & { upgradeRequired?: false }) | null

// Adapt to:
type DocumentData = { document: string }
export type DocumentResult = { upgradeRequired: true } | (DocumentData & { upgradeRequired?: false }) | null
```

**Function body pattern** (lib/api.ts lines 77–95 — copy structure, change endpoint and error string):
```typescript
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

Key differences from `generateDefense`:
- Endpoint: `/api/projects/${projectId}/document` (not `/defend`)
- Error string check: `'PRO_REQUIRED'` (not `'UPGRADE_REQUIRED'`)
- Return type uses `DocumentData` / `DocumentResult`
- Body type is `{ document_type, context? }` not `DefensePayload`

The `toast` import is already at lib/api.ts line 1 — no new import needed.

---

### `components/defense/DefenseDashboard.tsx` — state extension + handler + render switch

**Analog:** Existing state + handler pattern in the same file.

**State additions pattern** (DefenseDashboard.tsx lines 172–183 — follow same useState pattern):
```typescript
// Existing state (lines 172–183):
const [selectedTool, setSelectedTool] = useState<DefenseToolMeta | null>(null)
const [loading, setLoading] = useState(false)
const [response, setResponse] = useState<{ text: string; id: string; contractClausesUsed?: string[] } | null>(null)
const [showUpgrade, setShowUpgrade] = useState(false)

// New state to add after existing declarations:
const [documentLoading, setDocumentLoading] = useState(false)
const [documentOutput, setDocumentOutput] = useState<string | null>(null)
const [documentError, setDocumentError] = useState<string | null>(null)
```

**Handler pattern** (DefenseDashboard.tsx lines 210–219 — copy `handleGenerate` structure):
```typescript
// Existing handleGenerate (lines 210–219):
async function handleGenerate(situation: string, extraContext: Record<string, string | number>) {
  if (!selectedTool) return
  setLoading(true); setResponse(null)
  const result = await generateDefense(projectId, { tool_type: selectedTool.type, situation, extra_context: extraContext })
  setLoading(false)
  if (!result) return
  if (result.upgradeRequired) { setShowUpgrade(true); return }
  setResponse({ text: result.response, id: result.id, contractClausesUsed: result.contract_clauses_used ?? [] })
  router.refresh()
}

// New handler to add:
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

**UpgradePrompt trigger pattern** (DefenseDashboard.tsx lines 234–246 — same gating used for free users):
```typescript
// Free user gate is already handled in handleGenerateDocument via `plan !== 'pro'` check
// which calls setShowUpgrade(true) — same UpgradePrompt renders (lines 234–246)
if (showUpgrade) {
  return (
    <div style={{ maxWidth: '560px' }}>
      <UpgradePrompt responsesUsed={responsesUsed} />
      <button onClick={() => setShowUpgrade(false)} ...>← Back</button>
    </div>
  )
}
```

**documentTypeFor helper** (pure function — no analog, add near handleGenerateDocument):
```typescript
function documentTypeFor(tool: DefenseTool): DocumentType | null {
  if (tool === 'scope_change' || tool === 'moving_goalposts') return 'sow_amendment'
  if (tool === 'kill_fee') return 'kill_fee_invoice'
  if (tool === 'dispute_response' || tool === 'chargeback_threat' || tool === 'review_threat') return 'dispute_package'
  return null
}
```

**Render switch pattern** (DefenseDashboard.tsx lines 358–370 — existing `showResponse` block):
```typescript
// Existing (lines 358–370):
{showResponse && (
  <ResponseOutput
    response={response!.text}
    responseId={response!.id}
    onRegenerate={() => setResponse(null)}
    contractClausesUsed={response!.contractClausesUsed}
    toolType={selectedTool.type}
  />
)}

// Replace with the two-branch render switch (D-03, D-04):
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
    documentType={documentTypeFor(selectedTool.type)!}
    onBack={() => setDocumentOutput(null)}
  />
)}
```

**Import additions** (DefenseDashboard.tsx lines 1–19 — add to existing import block):
```typescript
// Add to existing imports:
import { generateDefense, analyzeMessage, generateDocument } from '@/lib/api'
import DocumentOutput from './DocumentOutput'
import { DocumentType } from '@/types'
```

---

### `components/defense/ResponseOutput.tsx` — add document button row

**Analog:** Existing action row in ResponseOutput.tsx lines 60–76.

**Props interface extension** (ResponseOutput.tsx lines 10–16):
```typescript
// Existing props:
interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
  contractClausesUsed?: string[]
  toolType: DefenseTool
}

// Add new props:
interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
  contractClausesUsed?: string[]
  toolType: DefenseTool
  onGenerateDocument?: (type: DocumentType) => void
  documentGenerating?: boolean
  documentError?: string | null
}
```

**Required imports** (add to ResponseOutput.tsx):
```typescript
import { btnCls } from '@/lib/ui'
import { DocumentType } from '@/types'
```

**documentTypeFor helper** (same pure function as DefenseDashboard — define locally in ResponseOutput or import from a shared util):
```typescript
// Tool-to-document-type mapping (D-07)
const DOCUMENT_TYPE_FOR: Partial<Record<DefenseTool, DocumentType>> = {
  scope_change: 'sow_amendment',
  moving_goalposts: 'sow_amendment',
  kill_fee: 'kill_fee_invoice',
  dispute_response: 'dispute_package',
  chargeback_threat: 'dispute_package',
  review_threat: 'dispute_package',
}
```

**Button label constants** (add near component top):
```typescript
const DOCUMENT_BUTTON_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'Generate SOW Amendment',
  kill_fee_invoice: 'Generate Kill Fee Invoice',
  dispute_package: 'Generate Dispute Package',
}
```

**Document button row** — insert after existing action row (ResponseOutput.tsx line 74, after the `</div>` that closes the `flex items-center gap-3 mt-5` row, before `<NextStepCard>`):
```typescript
{(() => {
  const docType = DOCUMENT_TYPE_FOR[toolType]
  if (!onGenerateDocument || !docType) return null
  return (
    <div className="mt-4 pt-4 border-t border-bg-border">
      {documentError && (
        <span role="alert" className="text-xs text-urgency-high block mb-2">{documentError}</span>
      )}
      <button
        onClick={() => onGenerateDocument(docType)}
        disabled={documentGenerating}
        aria-busy={documentGenerating}
        className={[btnCls.outline, documentGenerating ? 'lime-pulse-border' : ''].filter(Boolean).join(' ')}
      >
        {documentGenerating ? 'Generating document…' : DOCUMENT_BUTTON_LABELS[docType]}
      </button>
    </div>
  )
})()}
```

Note: `btnCls.outline` already includes `border border-bg-border` (lib/ui.ts line 26), which is required for `lime-pulse-border` animation to have a visible border to pulse on (Pitfall 5 in RESEARCH.md).

Note: D-01 requires the button to be visible to all users (free and Pro). The free-user gate fires inside `handleGenerateDocument` in DefenseDashboard — the button itself is never conditionally hidden.

---

### `components/shared/CopyButton.tsx` — add optional `label` prop

**Analog:** Same file, current interface (CopyButton.tsx lines 6–8).

**Current interface** (CopyButton.tsx lines 6–8):
```typescript
interface CopyButtonProps {
  text: string
  responseId?: string
}
```

**Extended interface** (1-line addition):
```typescript
interface CopyButtonProps {
  text: string
  responseId?: string
  label?: string   // default: 'Copy Message'
}
```

**Destructuring change** (CopyButton.tsx line 11):
```typescript
// Current:
export default function CopyButton({ text, responseId }: CopyButtonProps) {
// New:
export default function CopyButton({ text, responseId, label = 'Copy Message' }: CopyButtonProps) {
```

**Button text change** (CopyButton.tsx line 37):
```typescript
// Current:
{copied ? <><span>✓</span> Copied</> : 'Copy Message'}
// New:
{copied ? <><span>✓</span> Copied</> : label}
```

No other changes. The `flashing` state, `copy-flash` class, and `markResponseCopied` behavior are all unchanged. DocumentOutput passes `label="Copy Document"` and no `responseId` (documents are ephemeral, no DB row to mark).

---

### `types/index.ts` — add DocumentType

**Analog:** `DefenseTool` union type in types/index.ts lines 3–21.

**Addition pattern** (append after existing exports, following the same union type pattern):
```typescript
// Existing pattern (lines 3–21):
export type DefenseTool =
  | 'scope_change'
  | 'payment_first'
  // ...

// Add:
export type DocumentType = 'sow_amendment' | 'kill_fee_invoice' | 'dispute_package'
```

---

### `lib/anthropic.ts` — add DOCUMENT_SYSTEM_PROMPT

**Analog:** `DEFENSE_SYSTEM_PROMPT` export in lib/anthropic.ts lines 80–209, and `CLASSIFY_SYSTEM_PROMPT` lines 211–250.

**Pattern** (lib/anthropic.ts lines 80–82 — follow the named export + template literal pattern):
```typescript
export const DOCUMENT_SYSTEM_PROMPT = `
You are a professional document drafter who helps freelancers create formal business documents.
// ... (full prompt content — see RESEARCH.md Document System Prompt Design section)
`
```

The prompt is added as a new named export after `CLASSIFY_SYSTEM_PROMPT`. The off-topic guard pattern from DEFENSE_SYSTEM_PROMPT (lines 200–207) should be replicated.

---

## Shared Patterns

### Authentication
**Source:** `app/api/projects/[id]/defend/route.ts` lines 140–144
**Apply to:** `app/api/projects/[id]/document/route.ts`
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### IDOR Guard
**Source:** `app/api/projects/[id]/defend/route.ts` lines 170–175
**Apply to:** `app/api/projects/[id]/document/route.ts`
```typescript
.eq('id', id)
.eq('user_id', user.id)
.single()
```

### Anthropic Slot Concurrency
**Source:** `app/api/projects/[id]/defend/route.ts` lines 208–225
**Apply to:** `app/api/projects/[id]/document/route.ts`
```typescript
const slotResponse = await acquireAnthropicSlot()
if (slotResponse) return slotResponse
try {
  // ... anthropic.messages.create(...)
} finally {
  await releaseAnthropicSlot()
}
```

### CSS Variable Tokens
**Source:** `components/defense/ResponseOutput.tsx` lines 27–47 and `app/globals.css`
**Apply to:** `components/defense/DocumentOutput.tsx`

All styling uses CSS variable tokens (`var(--bg-surface)`, `var(--bg-border)`, `var(--text-primary)`, etc.) or their Tailwind counterparts (`bg-bg-surface`, `border-bg-border`, `text-text-primary`). ResponseOutput uses Tailwind class strings; DocumentOutput should follow the same Tailwind approach.

### UpgradePrompt Gate
**Source:** `components/defense/DefenseDashboard.tsx` lines 234–246
**Apply to:** `handleGenerateDocument` in same file (reuses existing `setShowUpgrade(true)` mechanism — no new component needed)
```typescript
if (plan !== 'pro') { setShowUpgrade(true); return }
```

### btnCls.outline with lime-pulse-border
**Source:** `lib/ui.ts` line 26 + `app/globals.css` lines 211–213
**Apply to:** document generation button in `ResponseOutput.tsx`
```typescript
// lib/ui.ts line 26 — btnCls.outline already has border class required for pulse:
'inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-bg-border text-text-muted text-sm rounded-lg ...'

// globals.css lines 211–213:
.lime-pulse-border {
  animation: limepulse 1.5s ease-in-out infinite;
}
// @keyframes limepulse (lines 190–193):
// 0%, 100% { border-color: var(--brand-lime); opacity: 1; }
// 50% { border-color: var(--brand-lime); opacity: 0.4; }
```

### response-enter Animation
**Source:** `app/globals.css` lines 195–197
**Apply to:** `DocumentOutput.tsx` outer wrapper div
```typescript
// globals.css:
.response-enter { animation: slideUp 300ms ease forwards; }
// Usage: className="response-enter bg-bg-surface border border-bg-border rounded-2xl p-6 mt-4"
```

---

## No Analog Found

No files in this phase are without analog — all patterns map directly to existing codebase implementations.

---

## Anti-Patterns (from RESEARCH.md — executor must not replicate)

| Anti-Pattern | Where It Would Appear | Correct Pattern |
|---|---|---|
| Copy `check_and_increment_defense_responses` RPC from defend route | document/route.ts | Direct `profile.plan !== 'pro'` check instead |
| Use `UPGRADE_REQUIRED` error string | document/route.ts + lib/api.ts | Use `PRO_REQUIRED` instead (D-02) |
| Call `setResponse(null)` in back button handler | DefenseDashboard.tsx | Call `setDocumentOutput(null)` only |
| Save document to Supabase | document/route.ts | No DB insert — return `{ document }` directly |
| Render markdown for document output | DocumentOutput.tsx | Use `<pre>` block with `whitespace-pre-wrap` |
| Hide document button from free users | ResponseOutput.tsx | Always render button; gate fires on click via UpgradePrompt |
| Use Zod 3.x `.enum(['a', 'b'])` with array | document/route.ts | Zod 4.x: `z.enum(DOCUMENT_TYPE_VALUES)` with typed `as const` tuple |
| Missing `border` class on lime-pulse-border button | ResponseOutput.tsx | Use `btnCls.outline` as base — it already includes `border border-bg-border` |

---

## Metadata

**Analog search scope:** `app/api/projects/[id]/`, `components/defense/`, `components/shared/`, `lib/`, `types/`
**Files scanned:** 9 source files read in full
**Pattern extraction date:** 2026-04-25
