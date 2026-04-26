# Free Tool Strategy

*Author: Claude agent | Date: 2026-04-26*

---

## Context

Pushback already has a freemium entry point: 1 defense response + 1 contract analysis, no card required. That converts visitors who are already in a conflict right now. The goal of this strategy is different — engineering as marketing plays that drive organic discovery from people who are not yet mid-crisis, capture them with a genuinely useful free experience, and pull them into the app once they realize there is more where that came from.

Every tool below must feel like a professional instrument, not a toy or lead-magnet freebie. Pushback's brand is a serious toolkit. The free tools must reflect that.

---

## Ranking Criteria

Each tool is scored against:

- **Traffic potential** — estimated monthly search volume for the target query cluster; specificity vs. competition
- **Conversion alignment** — how naturally the tool outcome creates desire for the paid product
- **Build complexity** — frontend + AI work required, estimated in dev-days
- **Brand fit** — does it reinforce "professional toolkit" positioning or dilute it?

---

## Free Tool Ideas (Ranked)

### 1. Freelance Contract Risk Scanner

**Rank: #1 — Build first**

**Concept:**
A public-facing, no-login contract risk checker. User pastes contract text (no PDF upload — no Supabase, no auth required). The tool scans for the 10 most dangerous clause types — missing kill fee, uncapped revision rounds, IP assignment to client, no kill switch on cancellation, no late payment interest clause, etc. — and returns a risk score (0–100) with clause-level flags. No account required. Full analysis readable without signup. Conversion CTA: "See the full clause breakdown and generate a response in the app."

**Target query cluster:**
- "freelance contract review free"
- "freelance contract red flags checklist"
- "is my freelance contract good"
- "contract clause checker freelancer"
- "freelance contract risk assessment"

**SEO potential:** High. "Freelance contract review" is a high-intent, underserved query. Existing results are generic legal blogs, not interactive tools. A functional scanner with a shareable result URL will capture backlinks from freelancer communities, Reddit threads, and design/dev newsletters.

**Build complexity:** Medium. 3–5 dev-days.
- Public route at `/tools/contract-scanner`
- Text input (no file upload, keeps infra trivial)
- Anthropic call using same clause-detection prompt logic already in `lib/anthropic.ts` and `app/api/contracts/analyze/route.ts` — reuse the clause-flagging logic, strip the DB write
- Risk score rendering + clause breakdown UI
- No auth, no rate limit initially (add IP-based throttle after launch)
- Shareable results via URL-encoded state or a short-lived cache key

**Conversion path:** User pastes contract, gets risk score and top 3 flagged clauses free. Full clause breakdown + "Generate a response for [clause type]" CTA requires account. The CTA is high-intent — they just found a red flag in their actual contract.

**Why #1:** Highest-intent traffic cluster (someone reviewing a contract is pre-project, meaning they have an upcoming engagement and will want ongoing access). Shares significant logic with existing contract analysis. Shareable result URLs create passive distribution. Directly showcases the core technical moat — clause-level intelligence — without giving away the response generation.

---

### 2. Scope Creep Email Generator

**Rank: #2**

**Concept:**
A lightweight, no-auth scope creep response generator. User fills in two fields: what they were hired for, what the client is asking for now. Generates a single professional response email. One generation free. Conversion CTA: access the full Scope Change tool inside the app with contract-awareness and customization.

**Target query cluster:**
- "how to respond to scope creep email"
- "scope creep response email template freelance"
- "client wants more work for free what to say"
- "scope creep email example freelancer"
- "how to push back on scope creep"

**SEO potential:** Very high. "How to respond to scope creep" is one of the most common freelancer search queries and has consistently high volume year-round. Current SERP is dominated by blog posts, not interactive tools — a working generator wins featured snippet and backlink territory.

**Build complexity:** Low. 2–3 dev-days.
- Public route at `/tools/scope-response`
- Two text inputs (original scope, requested addition)
- Anthropic call using a simplified version of the `scope_change` tool prompt from `lib/anthropic.ts`
- No auth, IP throttle after launch
- One response free, then "Get the full tool with contract awareness" CTA

**Conversion path:** User sees quality of the output. The CTA shows them what they are missing: contract-aware response, tone control, urgency calibration, history. The gap between the free output and the in-app experience is immediately apparent. High conversion for users who are in a scope creep situation right now.

**Why #2:** Highest-volume target query, lowest build cost. Directly demonstrates the product's core value. Scope creep is the single most common freelance conflict — this reaches the broadest top-of-funnel segment.

---

### 3. Late Payment Interest Calculator

**Rank: #3**

**Concept:**
A static calculator: invoice amount, currency, due date, country/jurisdiction (EU, UK, US). Returns: days overdue, interest accrued under standard late payment law (EU Late Payment Directive for EU, Late Payment of Commercial Debts Act for UK, state-by-state for US), total amount now owed. No AI, no auth. Purely a calculation with legal reference.

**Target query cluster:**
- "late payment interest calculator freelance"
- "how much interest can I charge on overdue invoice"
- "invoice overdue interest rate UK freelancer"
- "EU late payment directive interest calculator"
- "freelance late payment calculator"

**SEO potential:** High. This query type has consistent evergreen volume and very few quality interactive tools. Most existing results are generic finance calculators not tailored to freelancers or late payment legislation. Jurisdiction-specific content earns backlinks from legal blogs and freelancer associations.

**Build complexity:** Low. 1–2 dev-days.
- Public route at `/tools/late-payment-calculator`
- Pure client-side math — no Anthropic call, no DB, no auth
- Legal rate references stored as static config (EU: 8% + ECB reference rate; UK: 8% above base; US: state table)
- Result screen shows: days overdue, interest amount, total owed, applicable law
- CTA: "Generate your final payment notice now" links to the Payment Final tool in the app

**Conversion path:** User arrives because they have an overdue invoice. They find out they are legally owed more than they thought. The CTA is directly relevant — they can generate the enforcement email immediately. High-intent, crisis-mode conversion.

**Why #3:** Zero AI cost, near-zero maintenance, maximum SEO longevity. The calculator itself is a legitimacy signal — it references real law, which positions Pushback as a knowledgeable toolkit, not an AI toy. Backlink potential from legal and freelancer community sites is significant.

---

### 4. Client Red Flag Detector

**Rank: #4**

**Concept:**
Paste a client inquiry email or message. Get back a red flag analysis: payment risk signals, scope ambiguity signals, IP grab language, unrealistic timeline indicators, professional reliability signals. Output is a structured assessment — not a pass/fail, but a calibrated risk reading. Framing: "Know who you are dealing with before you sign."

**Target query cluster:**
- "how to spot a bad freelance client"
- "client red flags freelancer"
- "should I take this client freelance"
- "bad client warning signs"
- "freelance client vetting checklist"

**SEO potential:** Medium-high. High emotional resonance and shareability. Reddit and community sites drive secondary distribution. The query is lower-intent than the contract scanner (pre-engagement vs. mid-crisis) but high-volume and highly shareable.

**Build complexity:** Medium. 3–4 dev-days.
- Public route at `/tools/client-red-flags`
- Single textarea: paste the client message or inquiry
- Anthropic call — classify signals across 6–8 dimensions, return structured risk assessment with brief rationale per flag
- No auth, result displayed on page
- CTA: "If they become a client, your arsenal is ready" — links to signup with context of what tools exist for difficult client situations

**Conversion path:** Lower urgency conversion than #1–3 (user is pre-engagement, not mid-crisis), but high brand value. It pulls in a segment that is not yet a Pushback user and plants the product clearly in their mental toolkit for when a situation hits. Newsletter capture ("save this analysis") is a viable secondary CTA.

**Why #4:** The "client vetting" angle extends Pushback's coverage earlier in the freelance lifecycle — before the contract is signed, not just after things go wrong. This is a different search segment from the crisis-mode tools and widens the top of funnel.

---

### 5. Kill Fee Calculator

**Rank: #5**

**Concept:**
How much is a client's cancellation actually worth? User inputs: project value, payment terms structure (50/50, milestone, etc.), percentage of work completed, whether a kill fee clause exists in the contract (yes/no/unknown). Returns: exact kill fee amount they can enforce, the amount they should invoice today, and a plain-language statement of their legal position.

**Target query cluster:**
- "how to calculate kill fee freelance"
- "freelance kill fee calculator"
- "client cancelled project what do I get paid"
- "kill fee clause freelance contract"
- "freelance project cancellation fee"

**SEO potential:** Medium. Niche but very high intent — if someone is searching for a kill fee calculator, they are mid-cancellation. Low competition. High intent-to-urgency match.

**Build complexity:** Low. 1–2 dev-days.
- Public route at `/tools/kill-fee-calculator`
- Client-side calculator — payment structure inputs, work completion slider, kill fee clause checkbox
- Returns: kill fee amount, total owed, outstanding payment breakdown
- Optional: one Anthropic call to generate a plain-language position statement ("Here is what you can say to this client")
- CTA: "Generate your Kill Fee enforcement notice" — links directly to Kill Fee tool in app

**Conversion path:** Extremely high intent. Someone mid-cancellation who finds their exact kill fee amount will immediately want the enforcement email. The app's Kill Fee tool is the direct continuation of the calculator result. Conversion friction is minimal.

**Why #5:** High urgency at point of use. The kill fee scenario is one of the most acute financial situations a freelancer faces. The calculator creates concrete financial clarity (they now know a specific number), and the CTA offers the instrument to recover it. Small search volume but near-100% relevance when it matches.

---

### 6. Freelance Rate Increase Email Generator

**Rank: #6**

**Concept:**
Inputs: old rate, new rate, client relationship duration, reason for increase (optional). Output: a professional rate increase notification email — firm, non-apologetic, clearly stated, with an appropriate notice period. No login. One generation free.

**Target query cluster:**
- "how to tell a client about a rate increase"
- "freelance rate increase email template"
- "how to raise your freelance rates"
- "rate increase letter freelancer"
- "email to client raising rates"

**SEO potential:** Medium-high. High search volume, evergreen content, currently dominated by blog articles. An interactive generator wins over a static template list. This query is not crisis-mode but is emotionally significant — freelancers procrastinate on rate increases more than almost anything.

**Build complexity:** Low. 1–2 dev-days.
- Public route at `/tools/rate-increase-email`
- Simple form inputs
- Anthropic call using a simplified version of the `rate_increase_pushback` defense tool prompt, adapted for proactive communication rather than pushback response
- Single generation free, CTA for "Rate Increase Pushback" tool if the client objects

**Conversion path:** Two-step: (1) user generates the notification email (free), then (2) the conversion CTA is "When they push back, here is your response tool" — which pre-seeds the Rate Increase Pushback tool in the app. This is a rare two-touch conversion path: the free tool plants the product for a guaranteed future situation (pushback is almost inevitable when raising rates).

**Why #6:** Emotionally resonant, high sharing potential. Freelancers who use this tool will almost certainly face rate increase pushback. The product is naturally positioned as the next step. Low build cost, good secondary distribution through freelancer communities and newsletters.

---

### 7. Freelance Invoice Overdue Letter Generator

**Rank: #7**

**Concept:**
Simple: invoice amount, days overdue, client name, project name. Output: a professionally calibrated late payment notice — tone and firmness automatically scaled to days overdue (0–7 friendly, 8–14 firm reference to contract, 15+ final notice before work suspension). No login. One letter free.

**Target query cluster:**
- "overdue invoice email template freelance"
- "how to follow up on unpaid invoice"
- "late payment email freelancer"
- "unpaid invoice reminder email"
- "invoice overdue letter"

**SEO potential:** High volume, very competitive query space. Differentiated by the automatic tone calibration based on days overdue — this is a tool, not a template. The "three-stage escalation" framing gives it content marketing angles.

**Build complexity:** Very low. 1 dev-day.
- Public route at `/tools/overdue-invoice-email`
- Four inputs, Anthropic call mapping to one of the three payment tool prompts based on days overdue threshold
- Single generation, CTA to payment tracking and response tools in app

**Conversion path:** Direct overlap with the app's three payment tools. The free tool shows the quality; the CTA surfaces payment tracking, history, and escalation sequences. Users with chronic late-payment clients convert well here because the product solves their recurring problem.

**Why #7:** Highest raw search volume of any tool on this list — "overdue invoice email" is searched constantly. Risk: the query is competitive and conversion is lower (less urgency at 0–7 days overdue than mid-cancellation or mid-dispute). Build is trivial, so the risk/reward is acceptable.

---

## Recommended Build Order

### Phase 1 — First to ship

**Contract Risk Scanner** (`/tools/contract-scanner`)

The strategic rationale for building this first:

1. It reuses the most technically sophisticated existing logic in the codebase — contract clause detection is already built and working in `app/api/contracts/analyze/route.ts`. Building the public-facing tool requires stripping the auth and DB write, not building new AI logic.
2. It captures a pre-project visitor — someone reviewing a contract before signing has an upcoming project with an upcoming client. They are more likely to need Pushback in the next 30 days than a one-time crisis visitor.
3. Shareable results (URL with encoded analysis) create passive distribution every time a freelancer sends their contract scan to a client or posts it in a community.
4. The SEO target is specific enough to rank quickly. "Freelance contract review free" + interactive tool = strong featured snippet candidate.
5. It demonstrates the deepest technical capability (clause-level intelligence) without giving away response generation. The gap between free and paid is immediately visible.

### Phase 2 — Follow within 2 weeks

**Scope Creep Email Generator** (`/tools/scope-response`)

Highest organic volume of any single-query cluster. Minimal build. Captures crisis-mode visitors at the exact moment they are searching for help. Scope creep affects every freelance profession equally — widest top-of-funnel reach.

### Phase 3 — After Phase 2 shows traffic signal

**Late Payment Interest Calculator** (`/tools/late-payment-calculator`)

Zero AI cost, permanent SEO asset, backlink magnet from legal and finance sites. Add this once the first two tools have validated the `/tools/` section as a traffic destination.

**Kill Fee Calculator** (`/tools/kill-fee-calculator`)

Highest per-visitor conversion rate of any tool. Small volume but immediate financial urgency. Build alongside Late Payment Calculator — both are purely client-side calculators.

---

## Integration Approach

### Architecture: Hybrid

Free tools should live at `/tools/[tool-name]` as **public, unauthenticated Next.js routes** — no middleware auth guard, no Supabase session required. This is critical for SEO crawlability.

**What is shared with the app:**
- Anthropic prompt logic — the free tools call a simplified version of the same prompts used in the defense tools. Extract shared prompt builders from `lib/anthropic.ts` so free tools inherit quality improvements automatically.
- UI design tokens and component styles from `app/globals.css` — free tools must look like Pushback, not like a landing page widget
- The existing contract clause detection logic is directly importable from the contract analysis route

**What is NOT shared:**
- Auth middleware — free tool routes are public
- Supabase writes — no history, no user record, no usage tracking at this stage
- Rate limiting through the existing plan system — use a separate IP-based throttle for the AI-powered free tools (to prevent abuse); the calculators need no throttle

**Navigation integration:**
- Add a "Free Tools" section to the marketing site footer and navbar (logged-out state only)
- The landing page hero or below-fold section should reference the tools as entry points
- Each tool's CTA button should deep-link into the app with context pre-filled where possible (e.g., `/dashboard?tool=scope_change` pre-selects the right defense tool)

**Indexing:**
- Each tool gets its own `<title>`, `<meta description>`, and `<h1>` optimized for its primary target query
- Static `sitemap.xml` entry for each tool route
- No `noindex` — these pages are the SEO surface
- Tool result pages should include structured data (FAQ schema based on the tool's query cluster) to improve snippet eligibility

**Analytics:**
- Track: tool page visits, form submissions, AI calls generated, CTA clicks, CTA-to-signup conversions
- The conversion funnel for free tools is: tool visit → result viewed → CTA clicked → signup → first paid tool use

---

## Traffic + Conversion Estimates (indicative, pre-launch)

| Tool | Target query volume estimate | Expected monthly visits at rank 3–5 | Expected signup conversion |
|------|------------------------------|--------------------------------------|----------------------------|
| Contract Risk Scanner | 8,000–15,000/mo | 400–900 | 8–12% |
| Scope Creep Email Generator | 20,000–35,000/mo | 800–1,800 | 5–8% |
| Late Payment Interest Calculator | 6,000–12,000/mo | 300–700 | 4–6% |
| Client Red Flag Detector | 10,000–20,000/mo | 500–1,200 | 3–5% |
| Kill Fee Calculator | 2,000–5,000/mo | 100–300 | 12–18% |
| Rate Increase Email Generator | 8,000–15,000/mo | 300–700 | 4–6% |
| Invoice Overdue Letter Generator | 25,000–50,000/mo | 800–2,000 | 3–5% |

Note: Signup conversion rates are estimated against tool-page visitors. Kill Fee Calculator has the highest conversion because the visitor is in acute financial distress; Invoice Overdue has the highest traffic but lowest conversion because many visitors want a one-off template, not ongoing access.

---

## What to Avoid

**Do not build tools that:**
- Feel like generic AI demos (e.g., "Freelance email writer" — too broad, destroys the professional toolkit brand)
- Compete with the paid tier directly (e.g., giving away a full contract analysis with clause-level response generation)
- Require user accounts to function — if it needs auth, it belongs inside the app, not in the tools section
- Overlap with each other (e.g., both an invoice generator and an overdue letter generator compete for the same visitor; pick one to lead)

**Do not market the free tools as AI tools.** Market them as professional instruments — "Scan your contract for red flags" not "AI-powered contract scanner." The brand is toolkit, not AI wrapper.

---

## FREE TOOL STRATEGY COMPLETE
