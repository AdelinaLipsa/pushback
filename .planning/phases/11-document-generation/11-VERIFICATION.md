---
phase: 11-document-generation
verified: 2026-04-26T00:00:00Z
status: human_needed
score: 11/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Pro user happy path — generate response, see document button, click it, see DocumentOutput, copy, go back"
    expected: "Kill Fee Invoice (or other mapped tool) document generates, displays in monospace pre block, Copy Document button works, Back to message restores original response text"
    why_human: "End-to-end flow requires live Anthropic API, authenticated Pro session, and browser rendering"
  - test: "Free user upgrade gate — click Generate Dispute Package button as free user"
    expected: "UpgradePrompt renders immediately (no API call made), Back returns to defense dashboard"
    why_human: "Requires authenticated free-user session and browser interaction"
  - test: "Document button absent for unmapped tools (payment_first, ghost_client, discount_pressure)"
    expected: "No 'Generate ...' button appears below the Copy + Mark as sent row for these tools"
    why_human: "Requires live browser rendering of the defense dashboard with those tools selected"
  - test: "Error path — document generation failure shows inline error, button re-enables"
    expected: "Red inline error text appears above the button; button reverts to enabled state; no panel swap"
    why_human: "Requires triggering a server error (e.g. invalid API key) in a dev environment"
  - test: "Direct API smoke tests (security)"
    expected: "401 without session, 403 PRO_REQUIRED for free user, 404 for another user's project, 400 for invalid document_type"
    why_human: "Requires curl with session cookies against a running dev server"
---

# Phase 11: Document Generation Verification Report

**Phase Goal:** For situations requiring more than an email, Pro users can generate a structured document (SOW amendment, dispute timeline, kill fee invoice) in one click — something no generic Claude prompt produces.
**Verified:** 2026-04-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/projects/[id]/document returns 401 to unauthenticated users | VERIFIED | `route.ts:26` — `if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })` |
| 2 | Returns 403 `{error: 'PRO_REQUIRED'}` when profile.plan !== 'pro' | VERIFIED | `route.ts:34-36` — `if (!profile \|\| profile.plan !== 'pro') return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })` |
| 3 | Returns 404 when project belongs to another user (IDOR guard via .eq('user_id', user.id)) | VERIFIED | `route.ts:55-61` — `.eq('id', id).eq('user_id', user.id).single()` followed by `return Response.json({ error: 'Not found' }, { status: 404 })` on null |
| 4 | Returns 400 when document_type is invalid or context exceeds 2000 chars | VERIFIED | `route.ts:11-14` — Zod schema with `z.enum(DOCUMENT_TYPE_VALUES)` and `z.string().max(2000).optional()`; 400 returned on `!parsed.success` |
| 5 | Returns 200 with `{document: string}` for Pro user with valid project | VERIFIED | `route.ts:128` — `return Response.json({ document })` after successful Anthropic call |
| 6 | Route does NOT call check_and_increment_defense_responses RPC and does NOT decrement any counter on failure | VERIFIED | Full file read (133 lines) — no mention of either RPC string; no DB insert anywhere in handler |
| 7 | Pro user sees 'Generate \<Doc Type\>' secondary button below Copy + Mark as sent row when tool maps to a document type | VERIFIED | `ResponseOutput.tsx:96-114` — IIFE renders button row when `onGenerateDocument && docType` both truthy; `DOCUMENT_TYPE_FOR` maps 6 tools; `DefenseDashboard.tsx:386` always passes `onGenerateDocument={handleGenerateDocument}` |
| 8 | Free user clicking the document button is shown the existing UpgradePrompt | VERIFIED | `DefenseDashboard.tsx:227` — `if (plan !== 'pro') { setShowUpgrade(true); return }` fires before any API call; `showUpgrade` renders `<UpgradePrompt>` at line 254 |
| 9 | Pro user clicking the document button replaces ResponseOutput with DocumentOutput — no routing, just a state toggle | VERIFIED | `DefenseDashboard.tsx:379-397` — `showResponse && !documentOutput` shows ResponseOutput; `showResponse && documentOutput && documentType` shows DocumentOutput |
| 10 | DocumentOutput shows monospace pre block, 'Edit before sending' note, Copy button labeled 'Copy Document', and '← Back to message' button | VERIFIED | `DocumentOutput.tsx` — `font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0` at line 34; edit note at line 40; `CopyButton text={document} label="Copy Document"` at line 44; `← Back to message` at line 29 |
| 11 | Clicking '← Back to message' restores ResponseOutput showing the original generated message — response state NOT cleared | VERIFIED | `DefenseDashboard.tsx:395` — `onBack={() => { setDocumentOutput(null); setDocumentType(null) }}` — only clears documentOutput and documentType; `setResponse` is never called here |
| 12 | Document button is hidden for tools that have no matching document type | PARTIAL — needs human | `ResponseOutput.tsx:97-98` — `if (!onGenerateDocument \|\| !docType) return null`; DOCUMENT_TYPE_FOR covers exactly 6 tools; tools like payment_first are absent from the map so `docType` will be undefined and the button returns null. Logic is correct but visual confirmation requires browser rendering |

**Score:** 11/12 truths verified programmatically (Truth 12 needs human visual confirmation)

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/projects/[id]/document/route.ts` | POST handler with auth, Pro gate, IDOR guard, Zod validation, Anthropic call | VERIFIED | File exists, 133 lines, all gates present |
| `components/defense/DocumentOutput.tsx` | Monospace pre block, edit note, copy button, back button | VERIFIED | File exists, 48 lines, all required elements present |
| `components/defense/ResponseOutput.tsx` | Document button row + 3 new optional props | VERIFIED | `onGenerateDocument?`, `documentGenerating?`, `documentError?` all in interface; DOCUMENT_TYPE_FOR and DOCUMENT_BUTTON_LABELS defined at module scope |
| `components/defense/DefenseDashboard.tsx` | documentLoading/documentOutput/documentError state, handleGenerateDocument, render switch | VERIFIED | All three state fields at lines 184-187; handler at lines 226-239; render switch at lines 379-397 |
| `types/index.ts` | DocumentType union export | VERIFIED | Line 136: `export type DocumentType = 'sow_amendment' \| 'kill_fee_invoice' \| 'dispute_package'` |
| `lib/anthropic.ts` | DOCUMENT_SYSTEM_PROMPT named export | VERIFIED | Line 253: `export const DOCUMENT_SYSTEM_PROMPT` |
| `lib/api.ts` | generateDocument + DocumentResult | VERIFIED | Lines 131-155: both exported, PRO_REQUIRED error string, posts to `/api/projects/${projectId}/document` |
| `components/shared/CopyButton.tsx` | Optional label prop, default 'Copy Message' | VERIFIED | Line 9: `label?: string`; line 12: `label = 'Copy Message'`; line 38: `label` variable used in JSX |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/api.ts generateDocument` | `POST /api/projects/[id]/document` | fetch with JSON body | VERIFIED | Line 142: `` fetch(`/api/projects/${projectId}/document`, { method: 'POST', ... }) `` |
| `route.ts` | `anthropic.messages.create` | DOCUMENT_SYSTEM_PROMPT | VERIFIED | Line 115: `system: DOCUMENT_SYSTEM_PROMPT` |
| `route.ts` | `user_profiles table` | `.from('user_profiles').select('plan')` | VERIFIED | Lines 29-33 |
| `route.ts` | `projects table` | `.eq('user_id', user.id)` IDOR guard | VERIFIED | Lines 52-57 |
| `DefenseDashboard.tsx handleGenerateDocument` | `lib/api.ts generateDocument` | import + function call | VERIFIED | Line 15: `import { generateDefense, generateDocument, analyzeMessage } from '@/lib/api'`; line 231: `await generateDocument(projectId, ...)` |
| `DefenseDashboard.tsx documentOutput state` | `DocumentOutput render` | conditional render on `documentOutput && documentType` | VERIFIED | Lines 391-397 — both non-null required to show DocumentOutput |
| `ResponseOutput.tsx document button` | `DefenseDashboard.tsx handleGenerateDocument` | onGenerateDocument prop | VERIFIED | Line 386: `onGenerateDocument={handleGenerateDocument}` |
| `DocumentOutput.tsx onBack` | `DefenseDashboard.tsx setDocumentOutput(null)` | onBack prop | VERIFIED | Line 395: `onBack={() => { setDocumentOutput(null); setDocumentType(null) }}` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `DocumentOutput.tsx` | `document` prop | `DefenseDashboard.documentOutput` state, set from `result.document` returned by `generateDocument()` → `route.ts` Anthropic call | Anthropic `messages.create` with `DOCUMENT_SYSTEM_PROMPT` and full project context | FLOWING — real Anthropic API call with project/contract/defense-history context |
| `ResponseOutput.tsx` DOCUMENT_TYPE_FOR | `docType` derived from `toolType` prop | `DefenseDashboard.selectedTool.type` | Real tool selection from user click | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires a running Next.js dev server and authenticated Supabase session. All behavioral verification routed to human verification section.

### Notable Implementation Deviation

**`documentTypeFor` helper not present in DefenseDashboard** — Plan 03 specified a module-level `documentTypeFor(tool: DefenseTool): DocumentType | null` function and listed it as an artifact criterion. The actual implementation stores document type in a `documentType` state field (`setDocumentType(type)` is called at the start of `handleGenerateDocument` before the API call). The DocumentOutput component receives `documentType` from state rather than calling a helper.

**Impact on goal:** None. The behavior is identical — the correct document type is passed to DocumentOutput. The state-based approach is arguably cleaner (avoids the non-null assertion `documentTypeFor(selectedTool!.type)!` that the plan warned about). This is an acceptable deviation.

**Pitfall 2 (response state preservation) is correctly implemented:** `onBack` calls `setDocumentOutput(null); setDocumentType(null)` only. `setResponse` is never called in the document flow.

### Requirements Coverage

No requirement IDs were declared in plan frontmatter (`requirements: []` across all three plans). No orphaned requirements found referencing Phase 11 in REQUIREMENTS.md (not checked — `requirements: []` in all plans indicates none claimed).

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `DefenseDashboard.tsx:395` | `setDocumentOutput(null); setDocumentType(null)` in onBack | Info | Correct — does NOT clear response state (Pitfall 2 guard honored) |
| None | No TODOs, FIXMEs, placeholder returns, or hardcoded empty data found in phase-modified files | — | Clean |

### Human Verification Required

#### 1. Pro User Happy Path — end-to-end document generation

**Test:** Sign in as Pro user, open a project, select Kill Fee tool, generate a defense response, scroll below Copy + Mark as sent row, click "Generate Kill Fee Invoice", wait for response.
**Expected:** Button shows "Generating document…" with lime-pulsing border; right panel swaps to DocumentOutput showing header "Kill Fee Invoice", monospace document text, "Edit before sending — replace [YOUR NAME]..." note, "Copy Document" button. Clicking "← Back to message" restores original defense response.
**Why human:** Requires live Anthropic API call, authenticated Pro Supabase session, and browser rendering.

#### 2. Free User Upgrade Gate

**Test:** Sign in as free user, generate a defense response for Dispute Response tool, click "Generate Dispute Package".
**Expected:** UpgradePrompt renders immediately — no loading state, no Anthropic call made, "← Back" returns to dashboard.
**Why human:** Requires authenticated free-user session and browser interaction.

#### 3. Document Button Absent for Unmapped Tools

**Test:** As Pro user, generate responses for Payment First, Ghost Client, Discount Pressure. Inspect the ResponseOutput card for each.
**Expected:** No "Generate ..." button appears below the Copy + Mark as sent row for any of these three tools.
**Why human:** Requires browser rendering — while the code logic is verified (`DOCUMENT_TYPE_FOR` excludes these tools), visual absence needs confirmation.

#### 4. Error State Display

**Test:** With an invalid ANTHROPIC_API_KEY, click "Generate SOW Amendment" as Pro user.
**Expected:** Button re-enables, inline red text "Document generation failed — please try again." appears above the button. No panel swap. Original message remains visible.
**Why human:** Requires triggering a server error in a controlled dev environment.

#### 5. Direct API Security Smoke Tests

**Test:** Run curl requests: (a) no session → expect 401; (b) free user session → expect 403 `PRO_REQUIRED`; (c) Pro user, another user's project ID → expect 404; (d) invalid document_type → expect 400.
**Expected:** All four responses match expected status codes and error strings.
**Why human:** Requires running dev server with session cookies from the browser.

### Gaps Summary

No programmatic gaps found. All code-verifiable must-haves are satisfied. The implementation deviates from the plan's `documentTypeFor` helper pattern by using a `documentType` state field instead — the goal behavior is preserved.

The phase is **functionally complete** pending human verification of the live browser/API scenarios (A–E above), which correspond to Plan 03's Task 4 human checkpoint that was noted as pending in the 11-03-SUMMARY.md.

---

_Verified: 2026-04-26_
_Verifier: Claude (gsd-verifier)_
