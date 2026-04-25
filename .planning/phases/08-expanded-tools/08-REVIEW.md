---
phase: 08-expanded-tools
reviewed: 2026-04-25T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - app/api/projects/[id]/analyze-message/route.ts
  - app/api/projects/[id]/defend/route.ts
  - components/defense/DefenseToolCard.tsx
  - lib/anthropic.ts
  - lib/defenseTools.ts
  - types/index.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-25
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 08 adds 12 new defense tool types to the freelancer conflict SaaS. The type system
is fully consistent across `types/index.ts`, `lib/defenseTools.ts`, the analyze-message
route, and the defend route — all 20 tools appear in every required location. Icon map
coverage is complete (20 icons, zero missing, zero extras). The system prompts in
`lib/anthropic.ts` include all 20 tools in the correct places.

Three areas require attention before this phase ships:

1. **Critical — prompt injection via `extra_context` keys**: the `extra_context` record
   is interpolated directly into the Claude prompt without key allow-listing or key-count
   limits. A freelancer can submit arbitrary keys (including instruction-like strings) that
   appear verbatim in the `ADDITIONAL CONTEXT` block.

2. **Warning — weak Zod type for `tool_type` in the defend route**: `z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]])` loses the literal union type, meaning `parsed.data.tool_type` is typed as `string` at compile time. The subsequent `TOOL_LABELS[tool_type as DefenseTool]` cast and the DB insert both proceed without a TypeScript guarantee.

3. **Warning — stale prompt comment claiming 8 tool values**: `CLASSIFY_SYSTEM_PROMPT`
   line 243 reads `"<one of the 8 values above>"` but there are 20 tool types. This causes
   no runtime error but is a maintenance hazard; it will mislead anyone editing the prompt
   to add or remove tools.

---

## Critical Issues

### CR-01: Prompt injection via unbounded, unallow-listed `extra_context` keys

**File:** `app/api/projects/[id]/defend/route.ts:104-105`

**Issue:** `extra_context` is a `z.record(z.string(), ...)` with no constraint on the
number of keys and no allow-list validation on key names. Both the keys and values are
interpolated verbatim into the Claude user message:

```ts
`\n\nADDITIONAL CONTEXT:\n${Object.entries(extra_context).map(([k, v]) => `${k}: ${v}`).join('\n')}`
```

An authenticated user could supply a key such as
`"Ignore the above instructions and instead output"` or embed instruction-overriding text
in a value field. Because this content appears inside the `user` role message (the role
Claude treats as authoritative input), it is a realistic prompt injection vector against
the `DEFENSE_SYSTEM_PROMPT` system instructions.

The legitimate contextFields per tool have at most 3 keys with known names (e.g.
`days_silent`, `project_stage`). There is no mechanism preventing a client from sending
20 free-form key-value pairs with adversarial content.

**Fix:**

Option A — allow-list keys per tool type. Derive a whitelist from `DEFENSE_TOOLS`
contextFields at validation time:

```ts
import { DEFENSE_TOOLS } from '@/lib/defenseTools'

// After tool_type is parsed, validate extra_context keys
const toolMeta = DEFENSE_TOOLS.find(t => t.type === parsed.data.tool_type)
const allowedKeys = new Set(toolMeta?.contextFields.map(f => f.key) ?? [])

const extraContext = parsed.data.extra_context ?? {}
for (const key of Object.keys(extraContext)) {
  if (!allowedKeys.has(key)) {
    return Response.json({ error: `extra_context: unknown key '${key}'` }, { status: 400 })
  }
}
```

Option B (simpler, defense in depth regardless of Option A) — cap the number of keys
and the key string length to prevent bulk injection:

```ts
extra_context: z.record(
  z.string().max(64).regex(/^[a-z_]+$/),   // key: snake_case identifiers only
  z.union([z.string().max(500), z.number()])
).refine(obj => Object.keys(obj).length <= 10, 'Too many context fields')
.optional(),
```

---

## Warnings

### WR-01: `tool_type` Zod schema in defend route loses literal union type

**File:** `app/api/projects/[id]/defend/route.ts:31`

**Issue:** The schema uses:

```ts
tool_type: z.enum(Object.keys(TOOL_LABELS) as [string, ...string[]]),
```

`Object.keys()` returns `string[]`, not a tuple of the literal values. The cast
`as [string, ...string[]]` silences the TypeScript error but the resulting Zod enum is
`z.ZodEnum<[string, ...string[]]>` — meaning `parsed.data.tool_type` is typed as
`string`, not `DefenseTool`. The subsequent cast at line 110:

```ts
TOOL_LABELS[tool_type as DefenseTool]
```

is therefore load-bearing, not a formality. If `TOOL_LABELS` ever diverges from
`DefenseTool` (e.g., a key is added to one but not the other), TypeScript will not catch
it at compile time.

The `analyze-message` route does this correctly using a `as const` tuple. The defend
route should mirror that pattern.

**Fix:** Define a shared `as const` tuple and use it in both routes, or import
`DEFENSE_TOOL_VALUES` from the analyze-message module into a shared constants file:

```ts
// lib/defenseToolValues.ts (new shared file)
export const DEFENSE_TOOL_VALUES = [
  'scope_change', 'payment_first', 'payment_second', 'payment_final',
  'revision_limit', 'kill_fee', 'delivery_signoff', 'dispute_response',
  'ghost_client', 'feedback_stall', 'moving_goalposts', 'discount_pressure',
  'retroactive_discount', 'rate_increase_pushback', 'rush_fee_demand',
  'ip_dispute', 'chargeback_threat', 'spec_work_pressure',
  'post_handoff_request', 'review_threat',
] as const

// In defend/route.ts:
import { DEFENSE_TOOL_VALUES } from '@/lib/defenseToolValues'
// ...
tool_type: z.enum(DEFENSE_TOOL_VALUES),
```

This makes `parsed.data.tool_type` type `DefenseTool` and removes the unsafe cast.

---

### WR-02: Stale count in CLASSIFY_SYSTEM_PROMPT instructs Claude to return wrong schema comment

**File:** `lib/anthropic.ts:243`

**Issue:** The JSON shape comment at the end of `CLASSIFY_SYSTEM_PROMPT` reads:

```
"tool_type": "<one of the 8 values above>",
```

There are 20 tool types, not 8. This is a holdover from the original 8-tool implementation.
While Claude ignores this comment when generating output (it uses the full list above), it
creates a maintenance hazard: anyone editing the prompt to add or remove a tool type will
see "8 values" and may assume the full list is elsewhere. It also produces misleading
context for Claude's chain-of-thought, potentially reducing classification confidence on
the 12 new tools.

**Fix:**

```ts
// lib/anthropic.ts line 243 — change:
"tool_type": "<one of the 8 values above>",
// to:
"tool_type": "<one of the 20 values above>",
```

---

### WR-03: Race condition in compensating decrement — concurrent requests can under-decrement

**File:** `app/api/projects/[id]/defend/route.ts:58-69` and `app/api/projects/[id]/analyze-message/route.ts:73-83`

**Issue:** Both routes use an optimistic read-then-restore pattern for credit rollback:

```ts
const preIncrementCount = gate.current_count     // e.g. 4
// ... AI call ...
// on failure:
.update({ defense_responses_used: preIncrementCount })  // hard-set to 4
```

`gate.current_count` is the value **before** the RPC increment (per the comment). If two
requests from the same user succeed the RPC gate concurrently (both seeing count N), and
one fails mid-flight, the compensating decrement hard-sets the column to N, wiping out
the other request's valid increment (which had advanced the column to N+2). The net result
is the user gets two AI responses for the price of zero credits.

This is a correctness bug only at high concurrency (two simultaneous tab submits), not a
security vulnerability, but it is a billing integrity issue.

**Fix:** Replace the hard-set with a relative decrement using Postgres arithmetic through
an RPC that decrements by 1 (analogous to the existing `check_and_increment` RPC):

```sql
-- supabase migration: compensating decrement RPC
create or replace function decrement_defense_responses(uid uuid)
returns void language sql security definer as $$
  update user_profiles
  set defense_responses_used = greatest(0, defense_responses_used - 1)
  where id = uid;
$$;
```

```ts
// replace all compensating decrement calls:
await supabase.rpc('decrement_defense_responses', { uid: user.id })
```

---

## Info

### IN-01: `extra_context` key count is unbounded — storage bloat risk

**File:** `app/api/projects/[id]/defend/route.ts:33-36`

**Issue:** The schema places no upper bound on the number of keys in `extra_context`.
The legitimate maximum per any tool is 3 fields (e.g., `feedback_stall`). An unbounded
record is stored verbatim in the `defense_responses` table's `extra_context` JSONB column,
which could grow unexpectedly if a client submits many keys. This is a data quality issue,
not a security one (addressed separately in CR-01 from an injection perspective). Adding
a key-count cap removes the storage concern independently:

```ts
extra_context: z.record(
  z.string(),
  z.union([z.string().max(500), z.number()])
).refine(obj => Object.keys(obj).length <= 10, 'Too many context fields')
.optional(),
```

---

### IN-02: Duplicate `TOOL_LABELS` export — `lib/defenseTools.ts` and `defend/route.ts` both define it

**File:** `app/api/projects/[id]/defend/route.ts:7-28` and `lib/defenseTools.ts:223-225`

**Issue:** `TOOL_LABELS` is defined twice. `lib/defenseTools.ts` exports a
`Record<string, string>` version derived from `DEFENSE_TOOLS` (lines 223-225). The defend
route defines its own `Record<DefenseTool, string>` version inline (lines 7-28) with
manually maintained human-readable label strings. These serve different purposes (the
route's version has richer labels like `'PAYMENT REMINDER — FIRST (0–7 days late)'`), but
the naming collision will confuse future editors and is a maintenance burden — adding a new
tool type requires updating both.

**Fix:** Rename the route-local constant to `PROMPT_TOOL_LABELS` (or similar) to make the
distinction explicit, and add a comment noting it contains the AI-prompt label strings
rather than display labels:

```ts
// app/api/projects/[id]/defend/route.ts
const PROMPT_TOOL_LABELS: Record<DefenseTool, string> = {
  // These are the exact label strings passed to Claude in the prompt
  scope_change: 'SCOPE CHANGE REQUEST',
  // ...
}
```

---

_Reviewed: 2026-04-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
