# Phase 13: How-To & In-App Guidance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 13-how-to
**Areas discussed:** Demo animation depth, /how-it-works access level, Tool directory layout, Onboarding hint persistence

---

## Demo Animation Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full as planned | All 4 steps: typewriter paste → risk badge → tool card pulse → response typewriter. ~12s loop, cinematic entrance, vignette. | ✓ |
| Simplified — static | Single static mockup, no JS animation. Loads instantly, no hydration overhead. | |
| 2-step only | Animate just risk badge appearing + response typing in. Cuts complexity ~50%. | |

**User's choice:** Full as planned

---

### Demo: Autoplay timing

| Option | Description | Selected |
|--------|-------------|----------|
| On page load | Starts immediately on component mount. No IntersectionObserver. | ✓ |
| When scrolled into view | Uses IntersectionObserver. Better for users who don't scroll immediately. | |

**User's choice:** On page load

---

### Demo: Tool showcase

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed — always Rate Negotiation | Single hardcoded tool per the plan. Simple state machine. | ✓ |
| Rotate tools per loop | Each loop cycle picks a different tool. More variety, more state complexity. | |

**User's choice:** Fixed — always Rate Negotiation

---

### Demo: Content strings

| Option | Description | Selected |
|--------|-------------|----------|
| Exactly as in the plan | Contract clause, Risk Score 8/10, response text all from plan spec. | ✓ |
| Simpler/shorter contract clause | Shorter clause animates faster and reads clearer at small sizes. | |
| You decide | Claude picks whatever reads most clearly. | |

**User's choice:** Exactly as in the plan

---

## /how-it-works Access Level

| Option | Description | Selected |
|--------|-------------|----------|
| Public — no auth required | `app/how-it-works/page.tsx` outside (dashboard). Prospects can read pre-signup. | ✓ |
| Authenticated only | Keep in `app/(dashboard)/how-it-works/`. Requires login to view. | |

**User's choice:** Public — no auth required
**Notes:** This is a deliberate change from the plan's file location.

---

### Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Marketing layout — same as landing page | No nav sidebar. Consistent with app/page.tsx shell. | ✓ |
| Dashboard Navbar visible | Render dashboard Navbar without auth — gives prospects a UI preview. | |
| Minimal — just a back-to-home link | No full nav, just ← Back + Footer. | |

**User's choice:** Marketing layout — same as landing page

---

### Landing page link

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — link from nav or footer | Add to existing Footer on landing page. | ✓ |
| No link from landing page | Only accessible via dashboard Navbar. | |
| Link from hero/CTA area too | More prominent secondary link near hero. | |

**User's choice:** Yes — link from the Footer

---

## Tool Directory Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by scenario type | 4 groups with H3 headers. Hardcoded mapping in page. | ✓ |
| Flat list — same order as dashboard | Simple list matching DEFENSE_TOOLS order. | |

**User's choice:** Grouped by scenario type

---

### Tool entry content

| Option | Description | Selected |
|--------|-------------|----------|
| Label + description + when-to-use | 3 fields: bold label, tool.description, one "when to use" sentence. | ✓ |
| Label + description only | Just existing DEFENSE_TOOLS fields. | |
| Label + custom when-to-use only | 20 custom sentences, no description. | |

**User's choice:** Label + description (description IS the when-to-use — no separate third field needed)

---

### Grouping source

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded groups in the page | Static mapping in how-it-works/page.tsx. No type changes. | ✓ |
| Derive from DEFENSE_TOOLS metadata | Add `group` field to DefenseToolMeta. Requires editing all 20 tool definitions. | |

**User's choice:** Hardcoded groups in the page

---

## Onboarding Hint Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-hide only — no X button | Conditional render. Disappears when responses exist. No localStorage. | ✓ |
| User-dismissible — X button | Close button with dismiss state in localStorage or DB. | |

**User's choice:** Auto-hide only — no X button

---

### Hint surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Both, as in the plan | DefenseDashboard empty state + ProjectDetailClient new-project hint. | ✓ |
| DefenseDashboard only | Skip ProjectDetailClient hint. | |
| ProjectDetailClient only | Skip DefenseDashboard empty state update. | |

**User's choice:** Both, as in the plan

---

### Hint visibility scope

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state only | Disappears once a tool is selected. Normal SituationPanel takes over. | ✓ |
| Stays visible throughout flow | Link to /how-it-works remains accessible during SituationPanel and ResponseOutput. | |

**User's choice:** Empty state only — disappears once tool is selected

---

## Claude's Discretion

- Exact H3 group header labels for the tool directory sections
- Minor timing adjustments within the ~12s animation budget
- Whether Footer link is standalone or merged into existing footer group
- Exact copy for DefenseDashboard 2-line empty-state hint (plan wording is a baseline)

## Deferred Ideas

None — discussion stayed within phase scope.
