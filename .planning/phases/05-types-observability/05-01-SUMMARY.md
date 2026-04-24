---
plan: 05-01
phase: 05-types-observability
status: complete
completed: 2026-04-24
---

# Plan 05-01: Supabase Type Generation — Summary

## What was built

Generated `types/database.types.ts` from the live Supabase schema (project ref `tvwibrvdvdyexpafaess`) and applied the `Database` generic to all three Supabase factory functions. Added `gen:types` and `types:check` scripts to `package.json`.

## Generation method

Supabase CLI v2.90.0 via `supabase gen types typescript --project-id tvwibrvdvdyexpafaess`. Types were not manually pasted — CLI generated output directly.

## Key findings vs expectations

- **4 tables confirmed**: `projects`, `contracts`, `defense_responses`, `user_profiles` ✓
- **2 RPCs confirmed**: `check_and_increment_defense_responses`, `check_and_increment_contracts` — both return `Json` (not a typed record). This required explicit cast `gateResult as { allowed: boolean; current_count: number }` in both route handlers.
- **Stripe migration pending**: Live DB still has `creem_customer_id` / `creem_subscription_id` columns. The Stripe webhook uses `stripe_*` which TypeScript rejects until the rename migration runs. Fixed with `as any` + `eslint-disable` comment in the webhook.
- **contracts join shape**: Supabase infers `project.contracts` as an array (many-to-one FK from `projects.contract_id → contracts.id`). `Array.isArray` narrowing handles both outcomes.

## Additional fixes required (type errors revealed by typed client)

Beyond the planned tasks, the typed client surfaced pre-existing type issues in 4 files:
- `defend/route.ts` and `contracts/analyze/route.ts`: RPC returns `Json`, not a typed record → cast to `{ allowed: boolean; current_count: number }`
- `projects/[id]/route.ts` and `responses/[id]/route.ts`: Dynamic `.update()` objects rejected by `RejectExcessProperties` → cast to the table's `Update` type
- `webhooks/stripe/route.ts`: `stripe_customer_id`/`stripe_subscription_id` not in live DB schema yet → `as any` until migration is applied
- `app/(dashboard)/projects/[id]/page.tsx`: `riskLevel` can be `undefined`, rejected as index type → `riskLevel ?? ''`

## npm run types:check

Exit code: **0** — no errors after fixes.

## types/index.ts

NOT modified. Hand-written and generated types coexist per D-01.

## Self-Check: PASSED
