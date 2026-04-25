# Phase 12: Client Risk Intelligence

## Goal
Surface client behavioral patterns so freelancers know at a glance which clients are problematic — before it becomes an emergency. The data is already in the DB (defense_responses, payment_due_date, payment_received_at). This phase makes it visible.

## What Changes

### 1. Client risk score computation
**New file:** `lib/clientRisk.ts`

```ts
export type RiskSignal = {
  label: string
  severity: 'low' | 'medium' | 'high'
}

export type ClientRiskResult = {
  score: number       // 0-100
  level: 'green' | 'yellow' | 'red'
  signals: RiskSignal[]
}

export function computeClientRisk(project: Project): ClientRiskResult
```

Scoring logic (additive, capped at 100):
- Each `scope_change` / `moving_goalposts` response: +15 (scope creep signals)
- Each `payment_*` response: +12 per escalation level (payment_first=12, payment_second=20, payment_final=30)
- Each `review_threat` / `chargeback_threat` / `dispute_response`: +25
- Each `ghost_client` / `feedback_stall`: +10
- Payment overdue (due date passed, not received): +20
- Payment marked received on time: -10

Risk levels:
- 0-25: green (no signals)
- 26-60: yellow (watch this client)
- 61+: red (high-risk client)

Signals array: human-readable list of what triggered the score (e.g. "3 scope change requests", "Payment overdue 12 days", "Review threat received").

### 2. Risk badge on ProjectCard
**File:** `components/project/ProjectCard.tsx`

Import `computeClientRisk` and show a small colored dot next to the client name:
- Green dot: no badge (clean slate)
- Yellow dot + "Watch" label in muted yellow
- Red dot + "High Risk" label in red

The dot uses `inline-block w-2 h-2 rounded-full` Tailwind classes with bg color.

ProjectCard already has access to `project.defense_responses` and `project.contracts` + payment fields.

### 3. Client behavior summary on project detail
**File:** `components/project/ProjectHeader.tsx` or a new `ClientBehaviorSummary.tsx`

Below the project title area, show a compact "Client behavior" row with the risk signals listed:
- Only show if there are signals (score > 0)
- Format: "3 scope changes · Payment overdue · 1 dispute"
- Text color: `var(--text-muted)`, font-size 0.8rem

### 4. Dashboard insights section
**File:** `app/(dashboard)/dashboard/page.tsx`

Add a small "This month" insights section at the top of the dashboard (below the attention alerts from Phase 10, above the projects list). Only show if there are noteworthy patterns.

Compute server-side from all projects + defense_responses:
- Count scope change responses in the last 30 days
- Count payment reminder responses in the last 30 days
- Count high-urgency responses (dispute_response, review_threat, chargeback_threat) in the last 30 days

If any count > 1, show a compact summary row:
"This month: [N] scope changes · [N] payment reminders · [N] disputes"

Small, muted text. Not alarming — just awareness.

## Files to Change
1. New: `lib/clientRisk.ts` — risk computation function
2. `components/project/ProjectCard.tsx` — import and show risk badge
3. `components/project/ProjectHeader.tsx` — show client behavior signals
4. `app/(dashboard)/dashboard/page.tsx` — monthly insights section

## Data already available
- `project.defense_responses` — already fetched in dashboard query with `tool_type` and `created_at`
- `project.payment_due_date` + `project.payment_received_at` — already in Project type
- No new DB queries or migrations needed

## Success Criteria
1. A project with 3 scope_change responses shows a yellow "Watch" badge on its ProjectCard
2. A project with a chargeback_threat response shows a red "High Risk" badge
3. The project detail shows a client behavior summary listing the signals
4. The dashboard shows "This month: 3 scope changes" if applicable
5. A new project with no responses shows no badge (clean state)
