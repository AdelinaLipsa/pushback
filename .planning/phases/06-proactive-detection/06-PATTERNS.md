# Phase 6: Proactive Detection - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/api/projects/[id]/analyze-message/route.ts` | route/controller | request-response | `app/api/projects/[id]/defend/route.ts` | exact |
| `components/defense/DefenseDashboard.tsx` | component | event-driven | `components/defense/DefenseDashboard.tsx` (self) | self (modify) |
| `components/defense/SituationPanel.tsx` | component | event-driven | `components/defense/SituationPanel.tsx` (self) | self (modify) |
| `lib/anthropic.ts` | utility/config | — | `lib/anthropic.ts` (self) | self (modify) |
| `types/index.ts` | model/types | — | `types/index.ts` (self) | self (modify) |

---

## Pattern Assignments

### `app/api/projects/[id]/analyze-message/route.ts` (route, request-response)

**Analog:** `app/api/projects/[id]/defend/route.ts`

This is a near-exact mirror. The only differences from the defend route are:
- Different Zod schema (validates `message` string, no `situation`/`extra_context`)
- Uses `CLASSIFY_SYSTEM_PROMPT` instead of `DEFENSE_SYSTEM_PROMPT`
- Applies `extractJson` helper (inline, from `app/api/contracts/analyze/route.ts`) because Claude may wrap JSON in preamble
- No database row saved — returns the JSON directly
- Anthropic call uses `max_tokens: 256` (small JSON response)

**Imports pattern** (defend route lines 1–5):
```typescript
import { anthropic, CLASSIFY_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit } from '@/lib/rate-limit'
import { DefenseTool } from '@/types'
import { z } from 'zod'
```

**Zod schema for analyze-message** — derive from defend route lines 18–25; the classify schema is simpler:
```typescript
// All 8 DefenseTool values — taken from DEFENSE_TOOLS in lib/defenseTools.ts
const DEFENSE_TOOL_VALUES = [
  'scope_change', 'payment_first', 'payment_second', 'payment_final',
  'revision_limit', 'kill_fee', 'delivery_signoff', 'dispute_response',
] as const

const classifySchema = z.object({
  message: z.string().min(10).max(5000),
})

// For validating Claude's response:
const classifyResponseSchema = z.object({
  tool_type: z.enum(DEFENSE_TOOL_VALUES),
  explanation: z.string(),
  situation_context: z.string(),
})
```

**Auth + rate-limit + RPC gate pattern** (defend route lines 27–46):
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Atomic plan gate — check-and-increment in a single Postgres transaction (GATE-01)
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; current_count: number } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
  }
  // Store pre-increment count for compensating decrement on failure (RELY-04)
  const preIncrementCount = gate.current_count
```

**Compensating decrement pattern** (defend route lines 54–59, 120–125, 129–136):
```typescript
// On validation failure — undo RPC increment:
await supabase
  .from('user_profiles')
  .update({ defense_responses_used: preIncrementCount })
  .eq('id', user.id)
return Response.json({ error: `${String(issue.path[0])}: ${issue.message}` }, { status: 400 })

// In catch block — undo on any unhandled error:
await supabase
  .from('user_profiles')
  .update({ defense_responses_used: preIncrementCount })
  .eq('id', user.id)
return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
```

**Anthropic call pattern** (defend route lines 103–110; adapt for classify):
```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 256,           // small JSON-only response
  system: CLASSIFY_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: clientMessage }]
})
const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
```

**extractJson inline helper** (contracts/analyze/route.ts lines 8–18):
```typescript
// Inline JSON extraction helper — handles preamble-wrapped and markdown-fenced output
function extractJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('No valid JSON found in response')
  }
}
```

**Return shape** (no DB save; classification is ephemeral):
```typescript
// After extractJson + classifyResponseSchema.safeParse validation:
return Response.json({ tool_type, explanation, situation_context })
```

---

### `components/defense/DefenseDashboard.tsx` (component, event-driven — MODIFY)

**Analog:** `components/defense/DefenseDashboard.tsx` (current file — being extended)

**New state to add** (insert after line 25, alongside existing state declarations):
```typescript
// New state for analyze section (D-09)
const [messageInput, setMessageInput] = useState('')
const [analyzeLoading, setAnalyzeLoading] = useState(false)
const [analysisResult, setAnalysisResult] = useState<{
  tool_type: DefenseTool
  explanation: string
  situation_context: string
} | null>(null)
const [analyzeError, setAnalyzeError] = useState<string | null>(null)
```

**Existing selectTool logic** (lines 41–53) — analysis auto-calls this; the function already handles `isAtLimit` guard and deselection toggle:
```typescript
function selectTool(tool: DefenseToolMeta) {
  if (isAtLimit) {
    setShowUpgrade(true)
    return
  }
  if (selectedTool?.type === tool.type) {
    setSelectedTool(null)
    setResponse(null)
  } else {
    setSelectedTool(tool)
    setResponse(null)
  }
}
```
After classification succeeds, call `selectTool` with the matching `DefenseToolMeta` from `DEFENSE_TOOLS.find(t => t.type === result.tool_type)`.

**UPGRADE_REQUIRED handling pattern** (lines 69–72) — reuse identically in handleAnalyze:
```typescript
if (res.status === 403 && data.error === 'UPGRADE_REQUIRED') {
  setShowUpgrade(true)
  return
}
```

**Error display pattern** (lines 134–138):
```typescript
{generateError && (
  <p style={{ color: 'var(--urgency-high)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
    {generateError}
  </p>
)}
```
Mirror this for `analyzeError`.

**SituationPanel call site** (lines 140–147) — add `initialSituation` prop when analysisResult is set:
```typescript
{selectedTool && !response && (
  <SituationPanel
    tool={selectedTool}
    onGenerate={handleGenerate}
    onClose={() => { setSelectedTool(null); setResponse(null) }}
    loading={loading}
    initialSituation={analysisResult?.situation_context}   // NEW
  />
)}
```

**Card/surface style** — use same pattern as SituationPanel outer div (SituationPanel lines 35–40):
```typescript
style={{
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.875rem',
  padding: '1.5rem',
  marginTop: '1rem',
}}
```

**Divider style** (from project page pattern referenced in CONTEXT.md specifics):
```typescript
<div style={{ height: '1px', backgroundColor: 'var(--bg-border)', margin: '1.5rem 0' }} />
```

**Result banner style** (lime left-strip, per D-12):
```typescript
style={{
  borderLeft: '3px solid var(--brand-lime)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.875rem',
  padding: '1rem 1.25rem',
  marginTop: '1rem',
}}
className="response-enter"
```
Tool name in `color: 'var(--brand-lime)'`, explanation in `color: 'var(--text-secondary)'`.

---

### `components/defense/SituationPanel.tsx` (component, event-driven — MODIFY)

**Analog:** `components/defense/SituationPanel.tsx` (current file — minimal prop addition)

**Current props interface** (lines 6–11):
```typescript
interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
}
```
Add one optional prop:
```typescript
interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
  initialSituation?: string   // NEW — pre-fills situation textarea from analysis result (D-10)
}
```

**useState initializer change** (line 14):
```typescript
// Before:
const [situation, setSituation] = useState('')
// After:
const [situation, setSituation] = useState(initialSituation ?? '')
```

**No other changes needed.** The existing textarea is already controlled by `situation` state — pre-fill flows through automatically. Focus ring uses `var(--brand-amber)` which is the existing pattern; planner may optionally change focus ring to `var(--brand-lime)` to match Phase 6 lime accent but this is discretionary.

---

### `lib/anthropic.ts` (utility/config — MODIFY)

**Analog:** `lib/anthropic.ts` (current file — add constant after existing DEFENSE_SYSTEM_PROMPT)

**Existing constant pattern** (lines 1–3, 80–137) — `DEFENSE_SYSTEM_PROMPT` shows the exact format to follow:
```typescript
export const CLASSIFY_SYSTEM_PROMPT = `
You are a freelancer situation classifier. ...
Return ONLY valid JSON — no markdown, no preamble:

{
  "tool_type": "<one of the 8 values>",
  "explanation": "...",
  "situation_context": "..."
}
`
```

The new constant must be added as a named export at the bottom of the file, following the same template literal pattern as `CONTRACT_ANALYSIS_SYSTEM_PROMPT` (lines 5–78) and `DEFENSE_SYSTEM_PROMPT` (lines 80–137). Include the full list of 8 tool types and their descriptions in the prompt body — sourced from `DEFENSE_TOOLS` in `lib/defenseTools.ts`.

---

### `types/index.ts` (model/types — MODIFY)

**Analog:** `types/index.ts` (current file — add type after existing exports)

**Existing type pattern to mirror** (lines 3–11 — `DefenseTool` union, and lines 45–54 — `ContractAnalysis` object type):
```typescript
// New type — add after DefenseResponse (line 111)
export type MessageAnalysis = {
  tool_type: DefenseTool
  explanation: string
  situation_context: string
}
```
`DefenseTool` is already defined at lines 3–11 of the same file — no new import needed.

---

## Shared Patterns

### Auth + Rate Limit Check
**Source:** `app/api/projects/[id]/defend/route.ts` lines 27–34
**Apply to:** `analyze-message/route.ts`
```typescript
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
if (rateLimitResponse) return rateLimitResponse
```

### RPC Gate + Compensating Decrement
**Source:** `app/api/projects/[id]/defend/route.ts` lines 36–46, 54–59, 129–136
**Apply to:** `analyze-message/route.ts`
The RPC is `check_and_increment_defense_responses` — same RPC as the defend route (D-04). Compensating decrement resets `defense_responses_used` to `preIncrementCount` on any failure after the gate fires.

### UPGRADE_REQUIRED Error Shape
**Source:** `components/defense/DefenseDashboard.tsx` lines 69–72
**Apply to:** `handleAnalyze` in `DefenseDashboard.tsx`; the error shape `{ error: 'UPGRADE_REQUIRED' }` with status 403 is already handled by the existing `setShowUpgrade(true)` path — reuse it without change.

### extractJson Inline Helper
**Source:** `app/api/contracts/analyze/route.ts` lines 8–18
**Apply to:** `analyze-message/route.ts` — copy inline (not shared library); adapt generic return type to `MessageAnalysis` or `unknown` then validate with Zod.

### Lime Button Style
**Source:** `lib/ui.ts` lines 26–35
**Apply to:** Analyze button in `DefenseDashboard.tsx`
```typescript
import { btnStyles } from '@/lib/ui'
// ...
<button style={btnStyles.primary}>Analyze →</button>
```
`btnStyles.primary` = `{ backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.9rem', cursor: 'pointer' }`

### Surface Card Style
**Source:** `components/defense/SituationPanel.tsx` lines 35–40
**Apply to:** Analyze input card and result banner in `DefenseDashboard.tsx`
```typescript
{
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.875rem',
  padding: '1.5rem',
  marginTop: '1rem',
}
```

### response-enter Animation
**Source:** `components/defense/SituationPanel.tsx` line 36 (`className="response-enter"`)
**Apply to:** Result banner div in `DefenseDashboard.tsx` — add `className="response-enter"` for entrance animation.

### inputStyle for Textarea
**Source:** `lib/ui.ts` lines 7–16
**Apply to:** Message textarea in the analyze section of `DefenseDashboard.tsx`
```typescript
import { inputStyle } from '@/lib/ui'
// textarea gets: style={{ ...inputStyle, resize: 'vertical' }}
```

---

## No Analog Found

None — all files have direct analogs or are self-modifications of existing files.

---

## Metadata

**Analog search scope:** `app/api/`, `components/defense/`, `lib/`, `types/`
**Files read:** 9
**Pattern extraction date:** 2026-04-24
