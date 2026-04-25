---
phase: 11-document-generation
plan: "01"
subsystem: document-generation-foundation
tags: [types, prompts, api-client, copy-button]
dependency_graph:
  requires: []
  provides:
    - DocumentType union (types/index.ts)
    - DOCUMENT_SYSTEM_PROMPT (lib/anthropic.ts)
    - generateDocument + DocumentResult (lib/api.ts)
    - CopyButton label prop (components/shared/CopyButton.tsx)
  affects:
    - lib/api.ts (new file, establishes api client pattern)
    - Plan 02 (imports DOCUMENT_SYSTEM_PROMPT)
    - Plan 03 (imports DocumentType, generateDocument, uses CopyButton label)
tech_stack:
  added: []
  patterns:
    - generateDocument mirrors generateDefense shape (same fetch/error/toast pattern)
    - PRO_REQUIRED error string (differs from UPGRADE_REQUIRED used in generateDefense)
    - OFF-TOPIC GUARD pattern reused in DOCUMENT_SYSTEM_PROMPT from DEFENSE_SYSTEM_PROMPT
key_files:
  created:
    - lib/api.ts
  modified:
    - types/index.ts
    - lib/anthropic.ts
    - components/shared/CopyButton.tsx
decisions:
  - Used inline union literal for document_type in generateDocument body param (not importing DocumentType) — matches inline-literal style acceptable per plan; DocumentType import would create circular-ish concern since api.ts is client-side
  - lib/api.ts was untracked in main repo (never committed); created fresh in worktree with full content from disk plus new generateDocument section
metrics:
  duration: "~8 minutes"
  completed: "2026-04-25T17:36:00Z"
  tasks_completed: 2
  files_modified: 4
---

# Phase 11 Plan 01: Document Generation Foundation Summary

TypeScript foundation for document generation — DocumentType union, DOCUMENT_SYSTEM_PROMPT with three doc-type sections and OFF-TOPIC GUARD, generateDocument client function returning DocumentResult with PRO_REQUIRED 403 handling, and backward-compatible optional label prop on CopyButton.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add DocumentType union, DOCUMENT_SYSTEM_PROMPT, and generateDocument | 77feb49 | types/index.ts, lib/anthropic.ts, lib/api.ts |
| 2 | Add optional label prop to CopyButton | 4ca81b4 | components/shared/CopyButton.tsx |

## What Was Built

### types/index.ts (line 134)
Appended `DocumentType` union after `MessageAnalysis` (last existing type):
```typescript
export type DocumentType = 'sow_amendment' | 'kill_fee_invoice' | 'dispute_package'
```

### lib/anthropic.ts (lines 252–336)
Appended `DOCUMENT_SYSTEM_PROMPT` after `CLASSIFY_SYSTEM_PROMPT` (end of file). The prompt contains:
- Three doc-type sections: `sow_amendment`, `kill_fee_invoice`, `dispute_package` — each with full structure spec
- Bracketed placeholders throughout: `[YOUR NAME]`, `[YOUR PAYMENT DETAILS]`, `[DATE]`, `[INVOICE NUMBER]`, etc.
- OFF-TOPIC GUARD (reusing the canonical pattern from DEFENSE_SYSTEM_PROMPT)
- CRITICAL RULES: plain text only, under 600 words, no invented contract clauses

### lib/api.ts (lines 125–151, new file in worktree)
`lib/api.ts` existed on disk in the main repo as an untracked file (never committed to any branch). Created in worktree with complete content — all existing functions (createProject, updateProject, deleteProject, analyzeContract, deleteContract, generateDefense, analyzeMessage, markResponseSent, markResponseCopied, checkout) plus new Documents section:
- `type DocumentData = { document: string }` (local, not exported)
- `export type DocumentResult` — same discriminated union shape as DefenseResult
- `export async function generateDocument` — mirrors generateDefense exactly; uses `PRO_REQUIRED` (not `UPGRADE_REQUIRED`) per CONTEXT.md D-02; posts to `/api/projects/${projectId}/document`

### components/shared/CopyButton.tsx (3 lines changed)
- Added `label?: string` to `CopyButtonProps` interface (line 8)
- Added `label = 'Copy Message'` default in destructuring (line 11)
- Replaced hardcoded `'Copy Message'` literal in JSX with `label` variable (line 52)
- All existing call sites (`<CopyButton text={response} responseId={responseId} />`) remain backward-compatible since label is optional

## Deviations from Plan

None — plan executed exactly as written.

The only noteworthy situation: `lib/api.ts` was listed in the plan as a pre-existing file to modify, but it had never been committed to git (it was untracked in the main repo's working directory). This required creating it fresh in the worktree with the full existing content from disk plus the new generateDocument section. This is not a deviation — the result is identical to what the plan intended.

## Verification Results

- `grep -c "export type DocumentType" types/index.ts` → 1
- `grep -c "export const DOCUMENT_SYSTEM_PROMPT" lib/anthropic.ts` → 1
- `grep -c "OFF-TOPIC GUARD:" lib/anthropic.ts` → 2 (one in DEFENSE_SYSTEM_PROMPT, one in DOCUMENT_SYSTEM_PROMPT)
- `grep -c "export async function generateDocument" lib/api.ts` → 1
- `grep -c "PRO_REQUIRED" lib/api.ts` → 1 (only in generateDocument; generateDefense uses UPGRADE_REQUIRED)
- `grep -c "export type DocumentResult" lib/api.ts` → 1
- `grep -c "label?: string" components/shared/CopyButton.tsx` → 1
- `grep -c "label = 'Copy Message'" components/shared/CopyButton.tsx` → 1
- `npx tsc --noEmit` → exits 0, no errors

## Git Status After Completion

Working tree clean. Only four files modified from base commit `b8dba95`:
- `types/index.ts` (modified)
- `lib/anthropic.ts` (modified)
- `lib/api.ts` (new — was untracked in main repo)
- `components/shared/CopyButton.tsx` (modified)

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced by this plan. `DOCUMENT_SYSTEM_PROMPT` follows the same server-only import pattern as `DEFENSE_SYSTEM_PROMPT` (imported only by Route Handlers). `generateDocument` is a client-side fetch function with the same surface as existing `generateDefense`. No new threat flags.

## Known Stubs

None — this is a foundation plan with no UI rendering. No data flows to UI in this plan.

## Self-Check: PASSED

- types/index.ts exists and contains `export type DocumentType` at line 134
- lib/anthropic.ts exists and contains `export const DOCUMENT_SYSTEM_PROMPT` at line 252
- lib/api.ts exists and contains `export async function generateDocument` at line 131
- components/shared/CopyButton.tsx exists and contains `label?: string` at line 8
- Commit 77feb49 exists (Task 1)
- Commit 4ca81b4 exists (Task 2)
- `npx tsc --noEmit` exits 0
