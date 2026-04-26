# Phase 12: Client Risk Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 12-client-risk
**Areas discussed:** Badge coexistence on ProjectCard, Scoring input, Project detail placement, Dashboard insights framing

---

## Badge Coexistence on ProjectCard

| Option | Description | Selected |
|--------|-------------|----------|
| Add it to the existing badge row | All badges sit together top-right | ✓ |
| Replace the contract risk badge | Client behavior score subsumes contract risk | |
| Put it inline with the client name | Small dot + label next to client name | |

**User's choice:** Add it to the existing badge row

---

| Option | Description | Selected |
|--------|-------------|----------|
| Only show yellow and red | Absence = clean slate | |
| Show green badge too | Every project always has a behavior badge | ✓ |

**User's choice:** Show green badge too

---

| Option | Description | Selected |
|--------|-------------|----------|
| Watch / High Risk label only | Qualitative label, no number | |
| Show the numeric score | e.g., Client 40 | ✓ |
| You decide | Pick whichever works best visually | |

**User's choice:** Show the numeric score

---

| Option | Description | Selected |
|--------|-------------|----------|
| Same pill style as contract badge | Colored border + text — consistent | ✓ |
| Different style — filled background | Visually distinct from contract badge | |
| You decide | Pick whatever distinguishes them best | |

**User's choice:** Same pill style as contract badge

---

## Scoring Input: Sent vs. All Responses

| Option | Description | Selected |
|--------|-------------|----------|
| Only sent responses | was_sent=true only — actual conflict | ✓ |
| All generated responses | Higher sensitivity, may penalize unfairly | |
| You decide | | |

**User's choice:** Only sent responses (was_sent=true)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Looks right, go with the plan | Disputes heaviest, scope medium, ghosts light | |
| Make disputes heavier | +35 or higher for chargeback/dispute | |
| You decide | Pick proportional weights | ✓ |

**User's choice:** Claude's discretion on severity weights

---

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent running total | No decay — simpler, signals don't expire | ✓ |
| Decay old signals | 50% at 6 months, 0% at 1 year | |
| You decide | | |

**User's choice:** Permanent running total

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the -10 bonus | Rewards on-time payment | |
| Drop it — score additive only | Simpler, avoids negatives | |
| You decide | Pick whichever cleans the range | ✓ |

**User's choice:** Claude's discretion

---

## Project Detail Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Compact row above DefenseDashboard | Muted inline text | |
| Inside a new ClientBehaviorCard section | Card with title and signals | ✓ |
| Alongside project info (title, client, value) | Feels like a project property | |

**User's choice:** Inside a new ClientBehaviorCard section

---

| Option | Description | Selected |
|--------|-------------|----------|
| Only show when there are signals (score > 0) | Absence = clean slate | ✓ |
| Always show | Consistent presence even at 0 | |

**User's choice:** Only show when score > 0

---

| Option | Description | Selected |
|--------|-------------|----------|
| Above DefenseDashboard | Freelancer sees risk context before tool selection | ✓ |
| Below DefenseDashboard | Defense tools front and center | |
| You decide | | |

**User's choice:** Above DefenseDashboard

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show score + signals | 72/100 + signal list on detail page | ✓ |
| Signals only, no number | Score lives on the card, detail shows story | |
| You decide | | |

**User's choice:** Show score + signals (number + signal list)

---

## Dashboard Insights Framing

| Option | Description | Selected |
|--------|-------------|----------|
| Aggregate counts (This month) | Pattern-level view across all projects | |
| Riskiest client spotlight | Single worst client named with score | |
| Both | Top risky client + aggregate summary | |
| You decide | Pick most useful for quick dashboard scan | ✓ |

**User's choice:** Claude's discretion

---

| Option | Description | Selected |
|--------|-------------|----------|
| Merge into Needs Attention | High-risk clients as new alert rows in existing section | |
| Separate section below Needs Attention | Distinct "Client insights" block | |
| You decide | Pick whatever keeps dashboard uncluttered | ✓ |

**User's choice:** Claude's discretion

---

| Option | Description | Selected |
|--------|-------------|----------|
| Only show when there's a notable signal | At least one yellow/red client | ✓ |
| Always show | Consistent presence even when all green | |

**User's choice:** Only show when at least one project is yellow/red

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side computation | Part of existing Server Component query | ✓ |
| Client-side | Post-hydration computation | |

**User's choice:** Server-side

---

## Claude's Discretion

- Severity weights for scoring function (use proportional buckets from informal plan as baseline)
- Whether to include -10 on-time payment bonus
- Dashboard framing: riskiest client spotlight vs aggregate counts (lean toward riskiest client — more actionable)
- Whether high-risk clients merge into Needs Attention or get a separate subsection
- Badge label prefix: "Client" vs "Behavior" vs no prefix
- Signal label formatting in ClientBehaviorCard

## Deferred Ideas

- Client reply threading — pasting client's response to a sent pushback (Phase 999.1, already captured in backlog)
- Risk trend over time — showing trajectory of client behavior across a project timeline
- Cross-project client risk — aggregating risk across multiple projects with the same client
