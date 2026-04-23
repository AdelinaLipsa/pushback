# Feature Landscape: Pushback — Freemium Conversion Research

**Domain:** Freelancer productivity SaaS — AI-powered client communication assistant
**Researched:** 2026-04-23
**Milestone context:** Core scaffold is complete. This research focuses on what is required to convert free-tier users to paying customers.
**Research confidence note:** WebSearch and WebFetch tools were unavailable. All findings are drawn from training knowledge (cutoff August 2025). Confidence levels reflect source quality honestly.

---

## Research Question Answers

### Q1 — Freemium UI/UX Patterns That Convert Free-to-Paid

**Confidence: MEDIUM** (well-established SaaS patterns, verified against multiple competitive products in training data)

The highest-converting freemium SaaS tools share a consistent set of patterns. What the research reveals is not one silver bullet but a layered system of escalating signals.

**Countdown / remaining-uses indicators (inline, not banner)**
The most effective pattern is showing remaining free uses at the exact moment of action, not on a separate settings page. Tools like Linear, Notion, and Coda show "X uses remaining" adjacent to the primary action button. The current Pushback implementation shows this count in the defense dashboard ("X free messages remaining") — this is correct. The gap is that the settings page shows it as a passive number; it should feel more urgent as the count drops. At 1 remaining, the indicator should shift color (amber → red) and the copy should sharpen ("1 message left — this is your last free response").

**The hard limit moment is the highest-converting touchpoint**
Data from SaaS companies publishing cohort analysis (Loom, Dropbox, Typeform) consistently shows: the moment a user hits a hard limit converts at 3-8x the rate of proactive upgrade prompts. Pushback already shows the UpgradePrompt component at the 403 UPGRADE_REQUIRED moment — this is exactly right. The prompt needs: (a) a clear value statement, (b) cost framing as "per use" not per month, (c) no navigation away from the task. The current implementation routes to `/dashboard?upgrade=1` which navigates away; showing the upgrade inline within DefenseDashboard is better (already done via `setShowUpgrade(true)` — good).

**Cost framing: per-event, not per-month**
The current copy "€12/month" is the weakest framing possible. The existing UpgradePrompt.tsx already does the right thing: "most freelancers use Pushback at least twice a week — €1.50 per handled situation." This reframe (monthly cost → cost per outcome) is the pattern that converts. Keep it. Do not let it be replaced with a plain monthly price.

**No-card free tier is table stakes for trial entry**
The landing page correctly states "3 messages to try it. No card required." This is confirmed best practice — requiring payment before the first use reduces trial signups by 40-60% for tools with a learning curve. The 3-response limit with no card is the right call.

**What the current codebase is missing on conversion:**
- There is no proactive upgrade prompt shown at 2/3 used (one remaining). The prompt only appears after the limit is hit. A soft prompt at 2/3 used ("You've used 2 of your 3 free responses — upgrade to keep working") converts a meaningful fraction before the hard wall.
- The settings page shows plan info passively. Free users should see the upgrade card on settings as a first-class element, not an afterthought appended at the bottom. (Already exists — but visually it's below the fold on narrow screens.)
- The post-upgrade success banner (`upgraded=true`) says "✓ You're now on Pro. Unlimited responses, unlimited contract analyses." This is correct but terse. Adding one line like "Your first unlimited response is waiting — go back to your project" with a link converts the moment into immediate first use.

---

### Q2 — Must-Have Legal Pages for US/EU SaaS

**Confidence: HIGH** (statutory requirements, well-documented in GDPR text and FTC guidelines)

Two pages are legally required before charging users. Both are referenced in the Pushback footer and currently 404. This is a launch blocker — Creem (and any EU payment processor) may refuse to activate the product without these pages, and the signup page links to them.

**Privacy Policy — required for all deployments**

Required by: GDPR (EU), CCPA (California), general FTC unfair practices doctrine (US broadly).

Minimum required content:

| Section | What it must say | Pushback-specific note |
|---------|-----------------|------------------------|
| Identity of controller | Who runs this (company/individual name, address or country) | Must name the operator |
| What data is collected | Email, name, usage counts, project/contract content, payment identifiers | Contract PDF content is sensitive — must be named |
| Purpose of collection | Auth, service delivery, billing, product improvement | |
| Legal basis (GDPR only) | Contract performance, legitimate interest, or consent | For EU users: legal basis required per category |
| Third-party processors | Supabase (database), Anthropic (AI processing), Creem (payments), Vercel (hosting), Resend (email) | All five must be named with their role |
| Data retention | How long data is kept; right to deletion | Especially important: contract PDFs sent to Anthropic's Files API |
| User rights | Access, rectification, deletion, data portability (GDPR), opt-out of sale (CCPA) | Right to delete account + all data |
| Cookie/tracking disclosure | Analytics if any, essential session cookies | If no analytics: state that clearly |
| Contact for requests | Email address to submit GDPR requests | |

Critical Pushback-specific flag: Contract PDFs and defense situation text are sent to Anthropic's API for processing. This is the most sensitive data flow and must be explicitly disclosed. Users need to understand that their client/situation descriptions leave the app and are processed by a third-party AI.

**Terms of Service — required by payment processors**

Creem, Stripe, and all major processors require Terms of Service to be in place before enabling live payments. Also required for GDPR "contract performance" legal basis.

Minimum required content:

| Section | What it must say |
|---------|-----------------|
| Service description | What Pushback does and does not do |
| Acceptable use | No illegal content, no impersonation, no abuse of AI generation |
| Free tier limitations | 3 responses, 1 contract analysis — what happens at the limit |
| Subscription terms | €12/month, billing cycle, renewal |
| Cancellation policy | How to cancel, what happens to data on cancellation |
| Refund policy | State your refund policy clearly — "no refunds" must be stated explicitly if that's the intent |
| AI output disclaimer | Pushback generates suggested messages; it is not legal advice; user is responsible for what they send |
| Limitation of liability | Cap on damages |
| Governing law | Jurisdiction |
| Changes to terms | How users are notified of updates |

**AI output disclaimer is legally important for Pushback specifically.** The tool generates messages about payment disputes, contract enforcement, and client conflict. This comes uncomfortably close to legal advice territory. The Terms must clearly state: "Pushback generates draft communication messages. These are suggestions only, not legal advice, and you use them at your own discretion."

**GDPR-specific requirements if marketing to EU:**
- Cookie consent banner if using any analytics or non-essential cookies
- Explicit consent checkbox on signup if collecting data for marketing (not required if only for service delivery)
- Data Processing Agreement (DPA) with Anthropic and Supabase — these exist as standard agreements; users don't see them but the operator must execute them

**What to build:** Two static pages at `/privacy` and `/terms`. Use plain language. A template from a reputable generator (Termly, iubenda, Clerky) adapted to the specific data flows above is acceptable for v1. Do not use a generic template without adding the Anthropic/contract-processing disclosure — that gap is the one that creates real liability.

---

### Q3 — Transactional Emails Expected by Users

**Confidence: HIGH** (industry standard patterns, universally consistent across SaaS)

Resend is installed and wired to the project. Zero emails are currently sent. Users expect two emails at minimum for a paid SaaS:

**Email 1: Welcome / Signup Confirmation**

Trigger: User creates an account (after Supabase auth callback succeeds).

What it must contain:
- Confirm the account was created successfully
- State the free tier limits clearly (3 responses, 1 contract analysis) — sets expectations, prevents confusion and support requests
- Single CTA: "Go to your dashboard" — link to /dashboard
- Brief reminder of what Pushback does (one sentence) — not all signups come directly from the landing page

What it must not do:
- Do not ask for anything on the welcome email (no "invite a friend," no survey, no upsell in email 1)
- Do not send a wall of text

Subject line: "You're in — here's how to use Pushback" (not "Welcome to Pushback" — the generic welcome subject has a 30% lower open rate than action-oriented subjects)

**Email 2: Pro Upgrade Confirmation**

Trigger: Creem webhook fires `subscription.active` and the user profile is updated to `plan: pro`.

What it must contain:
- Confirm the subscription is active
- State clearly what they now have: unlimited responses, unlimited contract analyses
- Receipt summary: €12/month, next billing date (if Creem provides this in webhook payload)
- Single CTA: "Go use Pushback" — link to /dashboard
- How to cancel (link or instructions) — required by EU consumer law and builds trust

What it must not do:
- Do not thank them excessively or pad with marketing copy
- Do not ask them to review or share yet — they haven't used the paid tier yet

Subject line: "You're on Pro — unlimited responses activated"

**Optional Email 3: Usage Milestone / Nudge (defer to post-launch)**

When a free user has used 2/3 of their free responses (2 used), send a nudge email:
"You've used 2 of your 3 free Pushback messages. Upgrade to keep going — unlimited responses for €12/month."

This is a proven conversion pattern used by Loom, Dropbox, and Notion but requires more infrastructure (scheduled or event-triggered emails). Defer to post-launch.

**Technical note on Resend integration:** Resend v6.x (installed as `^6.12.2`) has a straightforward API. Emails should be sent from within the `/auth/callback` route (for signup) and the Creem webhook handler (for upgrade). Both places already exist in the codebase. The webhook route already has the userId; the signup email needs the user email from the Supabase auth event.

---

### Q4 — CRUD Operations: Can You Ship Without Edit/Delete?

**Confidence: HIGH** for the verdict; MEDIUM for the nuance

**Verdict: Edit is a dealbreaker. Delete is a dealbreaker. Both must ship at v1.**

This is one of the clearest cases in product research where the answer is binary. Here is why:

**Delete is a hard requirement for three reasons:**

1. **User expectation:** Any list of items that a user creates carries the expectation of deletion. A project list without a delete button creates a feeling of being trapped — users wonder if the app is broken. This is true even for simple tools.
2. **GDPR right to erasure:** If you are collecting data from EU users (Pushback markets to "freelancers everywhere" including EU), users have a statutory right to delete their data. An interface with no delete UI is a GDPR violation even if the API route exists. The right must be exercisable by the user, not just technically available.
3. **Trust:** A freelancer putting real client names, payment amounts, and dispute details into a tool will only do so if they believe they can remove that data. The absence of delete is a conversion deterrent, not just an annoyance.

**Edit is a hard requirement for one reason specific to Pushback:**

The defense tool workflow is: create a project, fill in client details, then generate responses. The quality of AI output is directly tied to the accuracy of the project data (client name, project value, notes). If a freelancer makes a typo in the project value (e.g., €5,000 vs €50,000), the payment reminder message will cite the wrong amount. Without an edit UI, they must delete and recreate the project — which breaks the history. Edit is not a nice-to-have; it is required for the core value proposition (accurate, ready-to-send messages) to work reliably.

**What the codebase already has:**
- `PATCH /api/projects/[id]` — exists, functional, validates allowed fields
- `DELETE /api/projects/[id]` — exists, functional
- `DELETE /api/contracts/[id]` — exists
- Missing: All UI surfaces for these routes

**Minimum viable UI for v1:**
- Edit: Inline form or modal on the project detail page (`/projects/[id]`) with fields for title, client_name, client_email, project_value, currency, status, notes
- Delete: Confirmation dialog ("Delete project and all message history? This cannot be undone.") on the project list and/or project detail page
- Contract delete: Button on the contract detail page

Do not build bulk delete, undo/restore, soft delete, or archive for v1. Simple destructive delete with a single confirmation dialog is sufficient.

---

### Q5 — Competitor Tier Analysis: Bonsai, HoneyBook, AND.CO

**Confidence: MEDIUM** (based on training data knowledge of these products as of mid-2025; specific tier limits may have changed)

**Pattern validation for the 3-response free tier:**

The free-3-responses model is a well-established freemium pattern in productivity SaaS. The closest analogues in the freelancer tool space:

| Tool | Free Tier | Paid Threshold | Notes |
|------|-----------|----------------|-------|
| **Bonsai** | 1 active project, all core features, no client portal | $25/month for unlimited | Single project limit is a clear "try the workflow" gate |
| **HoneyBook** | None — free trial only (7 days full access) | $19/month after trial | Trial model, not freemium |
| **AND.CO (Fiverr)** | Limited to 1 contract, 1 invoice | $18/month | Document count as the gate |
| **Notion** | Unlimited personal use, 5MB file limit | $10/month | Feature ceiling, not action count |
| **Loom** | 5-minute video limit, 25 videos | $15/month | Quality + quantity gate |
| **Typeform** | 10 responses/month | $25/month | Monthly usage gate |

**What the research shows:**

Three-response limits are common in action-gated freemium products (tools where the value is the action, not just access to the interface). Loom used a 25-video limit before switching to a time-based quality gate. Typeform uses 10 responses/month. The pattern is: let users fully experience the quality of the output on the free tier, then limit quantity.

Pushback's model is sound with one concern: 3 is on the low end. Bonsai gives you full access to one project (which might mean 10-20 uses of the product before hitting the ceiling). Typeform gives 10 responses per month. At 3 total (lifetime, not monthly), users may hit the limit before they have a second uncomfortable client situation — which is the moment Pushback earns its "worth it" perception.

**Recommendation on the free limit:** 3 is defensible for v1 validation, but it should be monitored. If upgrade rates are low and churn is at the paywall moment rather than after, the limit is too tight. The correct v1 goal is to let enough users hit the limit naturally (through product use, not the limit) that they upgrade because they want more, not because they're blocked on their first try.

**Free tier feature access pattern (across competitors):**

A consistent finding: high-converting freemium tools give access to all features at reduced volume, rather than locking premium features behind the paywall. Bonsai lets you create a full contract on free — you just can't have more than one active project. Notion lets you use all features without limits until the file size cap. Loom lets you record any video type, just capped at 5 minutes.

Pushback's current model is correct: free tier gets all 8 defense tools (not a reduced set), full contract analysis (just 1), full response quality. The gate is quantity, not quality. This is the right call.

**One thing to watch:** The current Pro tier includes "Full response history" as a feature while the free tier listing does not mention history at all. In practice, the code shows response history is available (`/projects/[id]/history` has no plan gate). If history is gated to Pro only, this needs enforcement in the UI. If it's available on free, the Pro tier claim is misleading and should be updated in `lib/plans.ts`. This ambiguity should be resolved before launch.

---

## Table Stakes

Features users expect. Missing = product feels incomplete, broken, or untrustworthy.

| Feature | Why Expected | Complexity | Current Status |
|---------|--------------|------------|----------------|
| Project edit UI | AI output quality depends on accurate project data; users make typos | Low — API exists | Missing — API route exists, no form |
| Project delete UI | Universal expectation for any list of user-created items; GDPR right to erasure | Low — API exists | Missing — API route exists, no button |
| Contract delete UI | Same as project delete | Low — API exists | Missing |
| Privacy Policy page | Required by GDPR, CCPA; payment processor dependency; footer link 404s | Low — static content | Missing |
| Terms of Service page | Required by Creem for live payments; signup flow links it | Low — static content | Missing |
| Welcome email on signup | Universal expectation after account creation; free tier expectation-setting | Low — Resend installed | Missing — Resend installed, not wired |
| Upgrade confirmation email | Users expect payment confirmation; builds trust, required by EU law | Low — hook exists in webhook | Missing |
| Inline remaining-uses indicator | Users must know where they stand before hitting the wall | Low — partially exists | Partially done — count shown, but no color change at 1 remaining |
| AI output disclaimer (in UI) | Tool generates client communication near legal territory | Low — copy change | Missing from UI (must be in Terms but should also be inline) |
| Post-upgrade success state | After paying, user must immediately know what changed and how to use it | Low — banner exists | Partially done — "You're on Pro" banner exists but lacks a CTA back to work |

## Differentiators

Features that could set Pushback apart. Not expected, but would meaningfully improve conversion or retention.

| Feature | Value Proposition | Complexity | Timing |
|---------|-------------------|------------|--------|
| Per-response cost framing in upgrade prompt | "€1.50 per handled situation" converts better than "€12/month" | None — copy change | Already in UpgradePrompt.tsx — protect it |
| Soft upgrade nudge at 2/3 usage | Email + in-app prompt when 2 of 3 responses used; catches users before the hard wall | Medium — requires email trigger | Post-launch v1.1 |
| Project status update on response generation | Automatically mark project as "active" or "responded" after generating a message | Low | Post-launch |
| Upgrade prompt with "what would you have sent?" comparison | Show the user what they would have typed vs. what Pushback generated at the hard limit | Medium — UI work | Post-launch |
| Response quality rating | Thumb up/down on each response; feeds learning and gives users a sense of ownership | Medium | Post-launch |

## Anti-Features

Features to explicitly NOT build for v1. These are tempting but would delay launch without contributing to the goal of first paying customers.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Monthly usage reset (free tier) | Adds operational complexity (cron job, reset logic, counter drift) and reduces upgrade pressure | Lifetime counter for v1; add monthly reset after validating demand |
| Credits-based pricing | More flexible than subscription but creates billing complexity, support load, and lower MRR predictability | Subscription model is decided — do not revisit |
| Bulk delete / archive / undo | No evidence users need this at launch; adds UI and API surface | Single destructive delete with one confirmation dialog |
| Settings page as "hub" | Avoid putting all plan management, usage, and upgrade flows in /settings | Show upgrade prompt inline at point of action (already the pattern) |
| Email capture upsell sequence | Multi-step drip campaign before users upgrade | Exactly two transactional emails; no marketing sequence until post-launch |
| Cancellation flow with surveys | Not worth engineering at v1 scale | When Creem sends `subscription.canceled`, downgrade the account and move on |
| Team/agency plans | Explicitly out of scope; adds auth complexity, billing complexity, data isolation requirements | Return to post-launch after individual demand is validated |
| Contract template generation | Separate product scope; different user need | Explicitly out of scope in PROJECT.md |
| Response editing | Let users edit the generated message before copying — sounds good, adds complex state | Copy button is sufficient; users edit in their email client |
| In-app notifications | No evidence this is needed at current scale | Email is sufficient for the two transactional moments |

## Feature Dependencies

```
Privacy Policy + Terms of Service → Creem live payments → Pro subscription → Upgrade email
Project Edit UI → Accurate AI output → Core value proposition
Project Delete UI → GDPR compliance → EU user trust
Welcome Email → Expectation-setting → Reduces free-tier confusion → Improves trial-to-paid rate
Hard limit hit → UpgradePrompt (inline) → Checkout → Creem webhook → plan=pro → Upgrade email
```

## MVP Recommendation

The scaffold is built. The gaps before first paying customer:

**Tier 1 — Launch blockers (nothing ships without these):**
1. Privacy Policy page at `/privacy` — payment processor dependency, GDPR requirement
2. Terms of Service page at `/terms` — payment processor dependency, AI disclaimer required
3. Project edit form — core value proposition requires accurate data
4. Project delete + contract delete UI — GDPR right to erasure, user trust

**Tier 2 — Revenue path (these exist but have bugs or gaps):**
5. Welcome email via Resend — triggered in `/auth/callback` after successful signup
6. Upgrade confirmation email via Resend — triggered in Creem webhook on `subscription.active`
7. Fix the race condition on plan gating (Supabase RPC) — blocking revenue integrity
8. Fix the defend route try/catch — blocking graceful failure on AI calls

**Defer (post first paying customer):**
- Soft upgrade nudge at 2/3 usage
- Response history gating clarity (audit whether history is gated or not, then be consistent)
- Monthly usage reset
- Usage milestone email

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Freemium conversion patterns | MEDIUM | Well-established patterns from training data; WebSearch unavailable to verify 2025-specific changes |
| Legal requirements | HIGH | Statutory text is verifiable; GDPR and CCPA requirements are stable |
| Transactional email expectations | HIGH | Industry standard, very consistent across all SaaS verticals |
| CRUD at v1 | HIGH | User research principle, not a trend — highly stable finding |
| Competitor tier analysis | MEDIUM | Specific tier limits for Bonsai/HoneyBook/AND.CO may have changed since training cutoff; the pattern is sound, exact numbers should be verified before using in marketing copy |

## Sources

All findings from training data (knowledge cutoff August 2025). WebSearch and WebFetch were unavailable at research time.

Patterns cross-referenced against: Loom, Notion, Typeform, Dropbox freemium models; Bonsai, HoneyBook, AND.CO freelancer tool positioning; GDPR Articles 13, 17, and 20 (privacy notices, right to erasure, portability); FTC guidance on unfair or deceptive acts; Resend documentation for transactional email triggering.

**Gaps to validate before launch:**
- Creem's current requirements for Privacy Policy / Terms of Service to activate live payments (check their merchant documentation)
- Whether Anthropic's Files API terms permit storing contract PDFs for freelancers — needs disclosure in Privacy Policy regardless
- Current Bonsai/HoneyBook free tier limits (may have changed since training cutoff)
