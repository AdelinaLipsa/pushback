# Testing Patterns

**Analysis Date:** 2026-04-23

## Current State

This is a scaffold application. No tests exist yet. There are no test files, no `__tests__` directories, no `.spec.` or `.test.` files anywhere in the project.

No test framework is installed. `package.json` has no testing dependencies and no test script.

## Test Framework (Not Yet Installed)

**Recommended setup for this stack:**

The project is Next.js 16 + React 19 + TypeScript strict. The natural testing stack is:

**Runner:** Vitest (preferred over Jest for Next.js 15+ projects — no transform config needed for ESM)

**Component testing:** React Testing Library (`@testing-library/react`, `@testing-library/user-event`)

**Install commands when ready:**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

**Config file to create:** `vitest.config.ts` at project root

**Run commands to add to `package.json`:**
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## What to Test (Priority Order)

Given the shape of this codebase, the highest-value tests are:

**1. API Route logic** — `app/api/**/*.ts`

These contain business-critical logic: auth checks, plan limit enforcement, Anthropic calls, Supabase writes. They have no test coverage whatsoever.

Key routes to prioritize:
- `app/api/projects/[id]/defend/route.ts` — plan limit check (free users capped at 3 responses)
- `app/api/contracts/analyze/route.ts` — plan limit check (free users capped at 1 contract), file vs text branching
- `app/api/webhooks/creem/route.ts` — HMAC signature verification, subscription state transitions
- `app/api/projects/route.ts` — required field validation

**2. Utility functions** — `lib/utils.ts`, `lib/plans.ts`, `lib/defenseTools.ts`

These are pure/near-pure: no side effects, no I/O. Easiest to test first.
- `cn()` utility in `lib/utils.ts` — className merging
- `PLANS` object structure in `lib/plans.ts`
- `DEFENSE_TOOLS` array completeness and shape in `lib/defenseTools.ts`

**3. Client Components with logic** — `components/defense/DefenseDashboard.tsx`, `components/project/NewProjectForm.tsx`

Complex state machines worth integration-testing with RTL.

## Test File Organization (Convention to Establish)

**Recommended pattern:** Co-located test files, same directory as source.

```
components/
  defense/
    DefenseDashboard.tsx
    DefenseDashboard.test.tsx    ← co-located
  project/
    NewProjectForm.tsx
    NewProjectForm.test.tsx
lib/
  utils.ts
  utils.test.ts
app/
  api/
    projects/
      route.ts
      route.test.ts
```

**Naming:**
- `{FileName}.test.ts` for pure logic
- `{ComponentName}.test.tsx` for React components

## Mocking Strategy (When Tests Are Added)

**What to mock:**

External services that must not be called in tests:
- Supabase client — mock `@/lib/supabase/server` and `@/lib/supabase/client`
- Anthropic SDK — mock `@/lib/anthropic`
- Creem API — mock `@/lib/creem`

**Supabase mock pattern** (for API route tests):
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { plan: 'free', defense_responses_used: 0 }, error: null }),
  }),
}))
```

**Anthropic mock pattern**:
```typescript
vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"risk_score": 5, "risk_level": "medium"}' }],
      }),
    },
  },
  CONTRACT_ANALYSIS_SYSTEM_PROMPT: '',
  DEFENSE_SYSTEM_PROMPT: '',
}))
```

**What NOT to mock:**
- `lib/utils.ts` (`cn`) — test directly
- `lib/plans.ts` — test directly
- `lib/defenseTools.ts` — test directly
- `types/index.ts` — not executable, not mocked

## Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ComponentOrModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('featureName', () => {
    it('does the expected thing', async () => {
      // arrange
      // act
      // assert
      expect(result).toBe(expected)
    })

    it('handles error case', async () => {
      expect(result.status).toBe(400)
    })
  })
})
```

## Key Test Cases to Write First

**`app/api/projects/[id]/defend/route.ts`:**
- Returns 401 when user is not authenticated
- Returns 403 with `UPGRADE_REQUIRED` when free user has used 3+ responses
- Calls Anthropic and saves to DB when within limits
- Increments `defense_responses_used` for free users after successful generation
- Does NOT increment counter for pro users

**`app/api/contracts/analyze/route.ts`:**
- Returns 401 when unauthenticated
- Returns 403 with `UPGRADE_REQUIRED` when free user has used 1+ contract
- Returns 400 when neither file nor text is provided
- Updates contract status to `'error'` when Anthropic throws
- Updates contract status to `'analyzed'` on success

**`app/api/webhooks/creem/route.ts`:**
- Returns 401 when HMAC signature does not match
- Upgrades user to `pro` on `subscription.active` event
- Downgrades user to `free` on `subscription.canceled` event
- Returns 200 without DB write when `userId` is missing from metadata

**`lib/utils.ts`:**
```typescript
it('merges class names', () => {
  expect(cn('a', 'b')).toBe('a b')
})
it('handles conditional classes', () => {
  expect(cn('a', false && 'b')).toBe('a')
})
it('deduplicates Tailwind conflicts', () => {
  expect(cn('p-4', 'p-2')).toBe('p-2')
})
```

## Coverage

**Requirements:** None enforced (no coverage threshold configured)

**Recommended targets when tests are added:**
- API routes: 80%+ branch coverage (auth guard, plan limit, error paths)
- Lib utilities: 100% line coverage
- Components: focus on interaction flows, not render snapshots

**View Coverage** (once Vitest is installed):
```bash
npx vitest run --coverage
```

## E2E Tests

Not present. Playwright is the recommended choice for this app given the multi-step user flows (login → project → defense generation). Not prioritized for initial launch.

---

*Testing analysis: 2026-04-23*
