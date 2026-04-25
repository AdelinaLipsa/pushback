# Phase 9: Contract-Aware Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 09-contract-intelligence
**Areas discussed:** Attribution in ResponseOutput, Contract context verbosity, SituationPanel indicator, ClauseCard copy button

---

## Attribution in ResponseOutput

| Option | Description | Selected |
|--------|-------------|----------|
| Clause titles used | Small section: 'Based on your contract: [clause titles]'. API returns used titles. | ✓ |
| Just a badge | 'Contract-informed' chip in ResponseOutput header. Boolean only from API. | |
| Nothing extra | Trust the message text itself. No UI attribution. | |

**User's choice:** Clause titles used
**Notes:** SC3 gap from roadmap — existing plan missed this. API adds `contract_clauses_used: string[]` to defend response. DefenseDashboard response state and ResponseOutput props both extend to carry this data.

---

## Attribution — API Signaling

| Option | Description | Selected |
|--------|-------------|----------|
| Add contract_clauses_used to API response | `{ response, id, contract_clauses_used: string[] }`. Titles from buildContractContext. | ✓ |
| Derive from contract presence only | If project has contract, assume used. No API change. | |

**User's choice:** Add contract_clauses_used to API response
**Notes:** Empty array when no contract clauses were relevant. ResponseOutput only shows attribution section when array is non-empty.

---

## Contract Context Verbosity

| Option | Description | Selected |
|--------|-------------|----------|
| Focused: title + pushback_language only | Tight prompt. Only actionable part per clause. | ✓ |
| Full clause detail | Title + quote + plain_english + why_it_matters + pushback_language. | |
| You decide | Claude decides based on token budget. | |

**User's choice:** Focused: title + pushback_language only
**Notes:** Always include risk_level and verdict at top. Up to 3 clauses per tool type + up to 2 missing_protections.

---

## Contract Context — Clause Cap

| Option | Description | Selected |
|--------|-------------|----------|
| Top 3 most relevant | Cap at 3 clauses per tool type. | ✓ |
| All relevant clauses | No cap. Could be 6-8 for verbose contracts. | |
| Just the top 1 | Single most relevant clause. | |

**User's choice:** Top 3 most relevant
**Notes:** Prevents prompt bloat. Also include up to 2 missing_protections per tool type.

---

## SituationPanel Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Risk-aware: 'High risk contract loaded' | Shows risk_level in label. Color-coded dot. | ✓ |
| Static: 'Contract terms loaded' | Plain lime dot + text. Original plan spec. | |
| You decide | Claude decides. | |

**User's choice:** Risk-aware: 'High risk contract loaded'
**Notes:** Dot color: lime for low/medium, amber for high, red for critical. Uses RISK_COLORS_RICH palette already in lib/ui.ts.

---

## ClauseCard Copy Button

| Option | Description | Selected |
|--------|-------------|----------|
| Copy button next to section label | Small 'Copy' inline with 'What to say back' label. CopyButton pattern. | ✓ |
| Whole block clickable to copy | Click anywhere in the box. | |
| You decide | Claude picks consistent UX. | |

**User's choice:** Copy button next to section label
**Notes:** Copies clause.pushback_language. No responseId tracking needed — not a DB action.

---

## Claude's Discretion

- Exact styling/formatting of "Based on your contract:" section in ResponseOutput
- Whether buildContractContext is co-located in defend/route.ts or extracted to lib/

## Deferred Ideas

- Reverse-tracing AI output to source clauses (which pushback_language phrases appeared in generated text) — post-launch
- Risk summary tooltip on SituationPanel indicator — post-launch UX
