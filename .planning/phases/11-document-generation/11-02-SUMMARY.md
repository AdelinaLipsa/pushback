---
phase: 11-document-generation
plan: 02
subsystem: api
tags: [document-generation, route-handler, pro-gate, security]
key-files:
  created:
    - app/api/projects/[id]/document/route.ts
metrics:
  tasks_completed: 1
  tasks_total: 1
  commits: 1
---

## Summary

Created `app/api/projects/[id]/document/route.ts` — the POST handler that generates documents for Pro users. The route follows the `defend/route.ts` canonical pattern with three key differences: (1) direct profile-fetch Pro gate returning `PRO_REQUIRED` instead of the atomic RPC gate, (2) no DB writes (documents are ephemeral), (3) `max_tokens: 2048` for longer documents.

## Commits

| Commit | Description |
|--------|-------------|
| 3fa9c84 | feat(11-02): POST /api/projects/[id]/document route handler |

## What Was Built

**`app/api/projects/[id]/document/route.ts`** exports a single `POST` handler with:
- Auth gate: `supabase.auth.getUser()` → 401 `{ error: 'Unauthorized' }` if no session
- Pro gate: `user_profiles.plan !== 'pro'` → 403 `{ error: 'PRO_REQUIRED' }` (no RPC, D-02)
- Input validation: Zod 4.x typed-tuple enum (`DOCUMENT_TYPE_VALUES as const`), optional `context` capped at 2000 chars → 400 with field-name error on failure
- IDOR guard: `.eq('user_id', user.id)` on project fetch → 404 on mismatch
- Project context assembly: project lines, contract analysis (normalized array-vs-object), last 5 defense responses sorted by date, user-supplied context
- Anthropic call: `claude-sonnet-4-6`, `max_tokens: 2048`, `system: DOCUMENT_SYSTEM_PROMPT`, wrapped in acquire/release concurrency slot
- Response: `{ document: string }` — no DB insert

## Deviations

- `DOCUMENT_SYSTEM_PROMPT` was already in `lib/anthropic.ts` (Plan 01 committed first). No inline fallback needed.

## Self-Check: PASSED

All 20 acceptance criteria from the plan pass. `npx tsc --noEmit` exits 0.
