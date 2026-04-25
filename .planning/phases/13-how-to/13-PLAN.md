# Phase 13: How-To & In-App Guidance

## Goal
First-time users should understand what Pushback can do and how to get the most out of it — without reading docs. Inline guidance, tool explanations, and a dedicated help page make the app self-teaching. Prospects on the marketing page see a live animated walkthrough of the product so they understand exactly what they're signing up for without a video.

## What Changes

### 0. Marketing page animated demo (new — `app/page.tsx`)
**New component:** `components/hero/DemoAnimation.tsx`

A self-running CSS/JS animation loop placed in a new "See it in action" section on the landing page, between the hero and the features/pricing sections. No video files — pure keyframes and a JS state machine.

**Animation sequence (loops automatically, ~12s per cycle):**

1. **Paste step** — A fake textarea fills in with a short contract snippet via typewriter effect: `"...Contractor waives all rights to claim additional compensation beyond the fixed fee, including overtime or revision fees regardless of scope changes..."`. Cursor blinks at end. Label: `"Paste your contract"`
2. **Analysis step** — A subtle spinner appears for ~1s. Then a risk badge fades in: `Risk Score 8/10` in lime. One clause gets underlined with an amber highlight: `"waives all rights to claim additional compensation"`. Label: `"Instant risk analysis"`
3. **Tool step** — A mini 3-card tool grid appears. One card activates with a lime border pulse: `"Rate Negotiation"` card. Label: `"Pick your situation"`
4. **Response step** — A response box types in: `"I appreciate you raising this. My rate reflects the full scope as outlined — revisions beyond two rounds or scope changes outside the original brief are billed separately at my standard rate. Happy to clarify the project boundaries if helpful."` Label: `"Send it. Done."`
5. **Hold** — Final state visible for ~2s, then fades out and loops.

**Implementation details:**
- State machine with 5 states (`idle | pasting | analyzing | selecting | responding`) driven by `useEffect` + `setTimeout` chain
- Typewriter: `setInterval` incrementing a character index into the full string, updating `displayText` state
- All content is hardcoded strings — no API calls
- The component is purely presentational; no interactivity needed
- Outer wrapper: `relative overflow-hidden rounded-xl border border-[#27272a] bg-[#111112]`, max-width ~640px, centered

**Cinematic entrance (zoom-in on mount):**
- The entire container starts at `scale(0.92) opacity(0)` and transitions to `scale(1) opacity(1)` over 600ms with `cubic-bezier(0.16, 1, 0.3, 1)` easing (spring-like)
- Triggered once on component mount via a `useEffect` toggling a CSS class: `transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]`
- Use `useState(false)` → set to `true` after first paint via `requestAnimationFrame` inside `useEffect`

**Edge blur vignette (always-on, professional video look):**
- An absolutely-positioned overlay `div` sits on top of the animation container with `pointer-events-none` and `z-10`
- CSS: `background: radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.85) 100%)`
- This creates a soft dark fade at all four edges, masking the hard border and giving the cinematic depth-of-field look
- The vignette color (`#09090b`) matches the page background so the blur bleeds seamlessly into the page

**Other styles:**
- Step labels rendered as small lime-colored caps above each active zone: `text-[10px] tracking-widest text-[#84cc16] uppercase`
- Risk badge: `bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/30 rounded px-2 py-0.5 text-xs font-mono`
- Highlighted clause: `bg-amber-500/15 text-amber-300 rounded px-0.5`
- Active tool card: `border-[#84cc16] shadow-[0_0_12px_rgba(132,204,22,0.15)]`

**Section wrapper in `app/page.tsx`:**
```tsx
<section className="py-20 border-t border-[#1c1c1e]">
  <div className="max-w-3xl mx-auto px-6 text-center">
    <p className="text-xs tracking-widest text-[#84cc16] uppercase mb-3">See it in action</p>
    <h2 className="text-3xl font-semibold text-white mb-4">From contract to response in seconds</h2>
    <p className="text-[#71717a] mb-10 max-w-lg mx-auto">
      Paste a clause, get a risk score, pick your situation, and copy a professional response — no legal knowledge required.
    </p>
    <DemoAnimation />
  </div>
</section>
```

### 1. New page: `/how-it-works` (public, in dashboard layout)
**New file:** `app/(dashboard)/how-it-works/page.tsx`

Sections:
- **What Pushback does** — 3 sentences: paste a client message → get a situation analysis → pick a tool → get a ready-to-send professional response. Or pick a tool manually.
- **The 3 ways to use it** — (1) Paste their message → auto-detect, (2) Pick a tool manually, (3) Use contract analysis before signing
- **Tool directory** — all 20 defense tools listed with their label, description, and "when to use it" guidance (one sentence each). Pull from `DEFENSE_TOOLS` so it stays in sync automatically.
- **Contract analysis** — explain what the risk score means (1-3 safe, 4-5 medium, 6-7 high, 8+ do not sign), what flagged clauses are, what pushback language is
- **FAQ** — 6-8 common questions:
  - "Does this replace a lawyer?" No. It gives you professional communication language. For legal disputes, consult a lawyer.
  - "Will my client know this was AI-written?" No. The messages are written to sound like you.
  - "What if none of the tools fit?" Use Dispute Response for anything that doesn't fit elsewhere, or paste their message and let the analyzer pick.
  - "How many messages can I send on free?" 3 AI generations total. Pro is unlimited.
  - "Is my contract data stored?" Yes, encrypted in your account. It is sent to Anthropic for analysis.
  - "Can I edit the message before sending?" Yes — copy it and edit freely before sending.

Page style: same dark aesthetic. Sections separated by thin `var(--bg-border)` dividers. Tool directory renders as a simple list (not cards). No interactive elements.

### 2. "How it works" link in Navbar
**File:** `components/shared/Navbar.tsx`

Add a "Help" link in the nav pointing to `/how-it-works`. Position: after Settings, before any auth links.

### 3. Empty state guidance in DefenseDashboard
**File:** `components/defense/DefenseDashboard.tsx`

When no tool is selected and no analysis has been done, the current text is "Pick what they did. Get the exact message to send back." 

Improve this to a more helpful onboarding prompt — a compact 2-line hint showing the two entry points:
```
Paste their message above to auto-detect the situation, or pick a tool below.
Not sure which tool to use? See the tool guide →  (links to /how-it-works)
```

### 4. Tool tooltip / description expansion
**File:** `components/defense/DefenseToolCard.tsx`

The card already shows `tool.description`. No change needed — the description field in Phase 08 is written to serve as the "when to use it" explanation.

### 5. Onboarding hint for new projects (zero defense responses)
**File:** `components/project/ProjectDetailClient.tsx`

If `project.defense_responses` is empty (new project), show a subtle one-time hint below the "What did they do this time?" heading:
```
New to Pushback? Paste a message from your client above — we'll figure out what you're dealing with.
```
Style: `text-[#3f3f46]`, `text-xs`, no border. Disappears once there are responses (conditional render).

## Files to Change
1. New: `components/hero/DemoAnimation.tsx` — self-running animated walkthrough
2. `app/page.tsx` — add "See it in action" section with DemoAnimation
3. New: `app/(dashboard)/how-it-works/page.tsx`
4. `components/shared/Navbar.tsx` — add Help link
5. `components/defense/DefenseDashboard.tsx` — improve empty-state hint + link
6. `components/project/ProjectDetailClient.tsx` — new-project onboarding hint

## Success Criteria
1. Landing page has a "See it in action" section with a looping animation (no video, no canvas)
2. Animation cycles through: paste → risk score → tool select → response, ~12s loop
3. `/how-it-works` renders all 20 tools with their labels and descriptions
4. A new user can navigate from the dashboard to understand every tool without leaving the app
5. The Navbar has a "Help" link
6. A new project with no responses shows the onboarding hint
7. The empty-state text in DefenseDashboard links to /how-it-works
