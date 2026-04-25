# Freelancer Client Conflict Scenarios — Research

**Researched:** 2026-04-25
**Purpose:** Identify high-frequency freelancer conflict scenarios NOT already covered by Pushback's existing 8 defense tools, to inform new tool development.

---

## Existing Tools (Excluded from Recommendations)

These 8 tools are already implemented in `lib/defenseTools.ts`:

| Tool | What It Covers |
|------|---------------|
| Scope Change | Client requesting work outside the original agreement |
| Payment Reminder (x3) | Invoice 0–7, 8–14, 15+ days overdue — escalating |
| Revision Limit | Client exceeded agreed revision rounds |
| Kill Fee | Client cancels mid-project — enforcing the kill fee clause |
| Delivery Sign-Off | Getting written acceptance before transferring final files |
| Dispute Response | Client making unfair claims or threatening dispute |

---

## Research Sources

- Reddit: r/freelance, r/webdev, r/graphic_design, r/copywriting (community discussions)
- Hacker News: "Ask HN: Freelancer's Dilemma – Client Won't Pay" (July 2024, item 40943343)
- Freelancers Union blog and client issues resource
- PainOnSocial contract disputes compilation (aggregated Reddit findings)
- Moxie, Hello Bonsai, HoneyBook, AND.CO product documentation / blog posts
- Morgan Overholt "10 Red Flags for Bad Clients" (practitioner article)
- Jennifer Bourn "Managing Clients Who Disappear" (practitioner article)
- Owen, Wickersham & Erickson — "Legalities 33: Do you have to give source files?" (legal resource)
- SoloWise "The Ultimate Freelance Copyright Guide 2025"
- Freelance Informer — kill fees and unfair payment practices guide
- Nomad Magazine — freelance payment disputes common causes

---

## Scenarios NOT Covered by Existing Tools

---

### 1. Client Goes Dark Mid-Project

**Short name:** `project_abandonment`

**Trigger:** Client becomes unresponsive during active work — stops replying to emails, provides no feedback, blocks progress — while the freelancer has invested time and possibly not been paid for the in-progress phase.

**Frequency:** VERY HIGH. Multiple Reddit compilations describe this as one of the top 3 complaints. Jennifer Bourn's "Managing Clients Who Disappear" is one of the most-linked freelance articles online. Upwork Community has a dedicated thread with hundreds of replies. An Upwork-cited stat: over 70% of freelancers have been ghosted mid-project at least once.

**Distinct from existing tools:**
- "Dispute Response" handles a client making active claims — this covers *absence*, not aggression.
- "Payment Reminder" handles overdue invoices — this covers the pre-invoice scenario where work is blocked because the client vanished.

**Example quote:** From the Upwork Community thread "client disappeared... what to do?":
> "I've been waiting three weeks for feedback on milestone 2. They paid the first deposit and went silent. I don't know if I should keep working or stop. There's no contract clause about this."

**What a message needs to do:** Re-establish contact, state clearly that work is paused until they respond, set a deadline (e.g., 10 business days) after which the project terminates and a dormancy/kill fee applies.

---

### 2. Rushed Deadline Demand

**Short name:** `rush_demand`

**Trigger:** Client demands work by an unreasonable deadline — either because they failed to plan, had a sudden emergency, or assumed turnaround would be instant. Sometimes accompanied by implicit or explicit pressure ("I really need this today or we'll have to find someone else").

**Frequency:** HIGH. Appears consistently across freelance red-flag lists and advice columns. Moxie's "Types of Difficult Clients" and Worksome's guide both cite this as a leading source of stress and conflict. One survey cited in search results found "unrealistic deadlines" in the top 5 client behaviors that cause burnout.

**Distinct from existing tools:** None of the 8 tools covers timeline negotiation or rush-fee communication. Closest is Kill Fee (cancellation) — this is the opposite scenario (too urgent, not cancelled).

**Example quote (paraphrased from community discussions):**
> "Client emailed at 5pm Friday saying they need the full redesign done by Monday morning for a board presentation they just scheduled. The project was supposed to take 3 weeks."

**What a message needs to do:** Acknowledge the urgency professionally, explain the realistic timeline or cost of a rush, offer a clear choice: extended deadline at normal rate, or rush delivery at rush rate (typically 25–50% premium).

---

### 3. Retroactive Price Reduction

**Short name:** `retroactive_discount`

**Trigger:** After work is delivered (or nearly delivered), the client claims the price is too high, they "didn't realize it would cost this much," or requests a discount retroactively. Sometimes framed as: "Can't you just do us a solid?" or "We're a small business." May also appear as partial payment with claim that the rest will come later.

**Frequency:** HIGH. Morgan Overholt's "10 Red Flags for Bad Clients" and freelancer files both document this as one of the most disheartening scenarios because it happens *after* the value has been extracted. The Freelancers Union notes this as one of the most common forms of late-stage non-payment.

**Distinct from existing tools:** Existing payment reminders deal with *non-payment of an agreed amount*. This deals with *renegotiation of the amount itself* after delivery — a categorically different confrontation requiring a different tone and approach.

**Example quote:**
> "Delivered the full brand identity package. Client came back saying 'we didn't budget for this much' and asked for a 40% discount. Nothing changed — same deliverables, same quality, same timeline."

**What a message needs to do:** Firmly and politely restate the agreed contract price, reference the signed agreement, decline the discount without burning the relationship, and pivot to a clear payment deadline.

---

### 4. Unauthorized Use of Work (Before Full Payment)

**Short name:** `unauthorized_use`

**Trigger:** Client uses, publishes, or deploys the freelancer's work before full payment has cleared. This can be a website going live with unpaid final invoice, a logo appearing on printed materials, social content published without sign-off, or code deployed to production.

**Frequency:** MEDIUM-HIGH. Bloomio copyright guide notes this affects "the vast majority" of freelancers in digital fields. The legal remedy (DMCA, copyright leverage) is well documented — but most freelancers don't know how to communicate it professionally without escalating to legal language immediately.

**Distinct from existing tools:** "Delivery Sign-Off" covers getting acceptance *before* transfer. "Dispute Response" handles client claims. This covers the scenario where *the client has already taken the work* — a clear leverage moment that needs a different kind of message.

**Example quote:**
> "I delivered the website with watermarks on the images to hold as leverage. Woke up this morning and the client had removed the watermarks and the site is live. Final invoice still unpaid."

**What a message needs to do:** Reference the copyright retention clause, note that use before payment is a copyright violation, state clearly that payment is due immediately, and provide a deadline — all without immediately threatening legal action (which escalates unnecessarily when payment often follows quickly after this message).

---

### 5. IP / Source File Ownership Dispute

**Short name:** `ip_ownership`

**Trigger:** Client demands source files, editable files, or full IP transfer that was not part of the original agreement. Framing often includes "We paid for it so we own it" or "We need the working files for future edits." This is extremely common in design (requesting Figma files, .ai, .psd), development (requesting full codebase transfer, repo ownership), and writing (requesting all drafts and research).

**Frequency:** HIGH. Owen, Wickersham & Erickson's legal guide on this ("Legalities 33") is one of the most widely shared freelance legal resources. The Upwork community thread on this topic has hundreds of responses. Default US copyright law means freelancers *own* work unless explicitly transferred — but clients often don't know this.

**Distinct from existing tools:** No existing tool touches copyright or IP. This requires a specific legal-adjacent explanation of what was licensed vs. what is owned, and a professional path to either say no or quote a price for full transfer.

**Example quote (from Upwork Community thread, copyright and content ownership):**
> "The client is now saying they own all the design files because they paid me. I only sold them a license to use the final output — I never agreed to hand over source files. How do I explain this without them losing their mind?"

**What a message needs to do:** Explain the distinction between license and ownership clearly (without sounding condescending), state what was included in the original agreement, and offer source file delivery as an add-on service with a fee.

---

### 6. Rate Increase Pushback

**Short name:** `rate_increase`

**Trigger:** The freelancer notifies an existing client of a rate increase. The client reacts with: pushback, guilt-tripping ("after all we've done for you"), claims of inability to afford the new rate, or attempts to lock in the old rate indefinitely.

**Frequency:** HIGH. This is a universal freelancer milestone. Millo, Double Your Freelancing, and multiple community guides address it as one of the most stressful routine business communications. It's not a conflict per se — but it frequently becomes one, and it requires very specific professional language.

**Distinct from existing tools:** No existing tool addresses pricing communication. This is different from scope change (no new work is being added) and different from all payment tools (which address non-payment, not pricing objections).

**Example quote:**
> "Told a client I was raising my rate from $75 to $100/hour starting next quarter. They replied saying I was being 'unreasonable given the current economy' and asking me to stay at the old rate since 'we're practically partners at this point.'"

**What a message needs to do:** Professionally hold the new rate, briefly explain the rationale (skill growth, market alignment, cost of living), acknowledge the long relationship, offer a reasonable transition (e.g., one final project or 60-day grace period at old rate), and set a firm effective date.

---

### 7. Chargeback / Payment Reversal

**Short name:** `chargeback_threat`

**Trigger:** Client files (or threatens to file) a credit card chargeback or PayPal dispute after receiving and using the work. Often framed as "We didn't receive what we paid for" to their bank, even when work was delivered as agreed.

**Frequency:** MEDIUM-HIGH. Hello Bonsai's guide on chargebacks for freelancers, Hongkiat's "7 Effective Strategies to Prevent Chargebacks," and multiple Upwork help articles confirm this is a real and growing problem, especially in remote/digital freelancing where card payments are common. The financial consequence is immediate and automated — money leaves the freelancer's account without warning.

**Distinct from existing tools:** "Dispute Response" covers a client making direct claims. A chargeback is a *third-party mechanism* (the bank) — the communication strategy is entirely different. The freelancer needs to (a) respond directly to the client to resolve before the bank gets involved, and (b) understand their leverage (copyright, signed agreements, delivery receipts).

**Example quote (Hello Bonsai guide):**
> "The client filed a chargeback through their Visa card. The platform pulled $3,400 from my account the same day and I'm now in a dispute process. The client is still using the website I built."

**What a message needs to do:** Professionally demand the chargeback be reversed, reference evidence of delivery and approval, note that continued use of delivered work constitutes acceptance, and state that copyright reversion (non-payment = no license) will be pursued if the chargeback stands.

---

### 8. Approval by Committee / Conflicting Stakeholders

**Short name:** `stakeholder_chaos`

**Trigger:** Work is delivered, approved by one person, then rejected by another person (a boss, partner, or committee who was not involved in the brief). The freelancer is asked to redo work that was already accepted, with no additional compensation.

**Frequency:** MEDIUM-HIGH. Medium articles, Ask a Manager discussions, and the fullscale.io approval process guide all cite "hidden stakeholders" as a top cause of freelance project dysfunction. This is especially common in agency-to-agency work and corporate clients.

**Distinct from existing tools:** "Scope Change" covers adding new work. This covers the specific scenario where approved work is retroactively rejected due to an organizational failure on the client's side — which requires different framing (the client's process failed, not the deliverable).

**Example quote (paraphrased from community discussions):**
> "My contact said 'looks great, send the final invoice.' Three days later her VP saw it and wanted a completely different direction. Now they want a full redo for free because 'it's still the same project.'"

**What a message needs to do:** Acknowledge the new feedback professionally, make clear that approved work cannot be redone as "free revisions," and treat the new direction as a distinct scope item — either a change order or a new engagement.

---

### 9. "Exposure / Future Work" Pressure

**Short name:** `spec_work_pressure`

**Trigger:** Client asks for work at a heavily reduced rate or for free, justifying it with "exposure," "it'll be great for your portfolio," promises of lucrative future work, or "we're a startup and don't have the budget yet but this will be huge." Sometimes this appears mid-project after rates were already agreed ("can you do this extra piece for free since it's such a small thing?").

**Frequency:** HIGH in creative fields (design, writing, photography, video). Consistently appears in r/graphic_design, r/copywriting, and r/freelance as one of the most-complained-about scenarios. Twine Blog's "How to Avoid Freelance Scams" and Fiverr's workspace blog both list it prominently. AIGA (American Institute of Graphic Arts) has issued formal position statements against spec work.

**Distinct from existing tools:** No existing tool covers this. It's not a scope change (no work has started), not a revision dispute, and not a payment issue — it's a pre-engagement negotiation manipulation that requires a firm, professional refusal template.

**Example quote:**
> "They want a full brand identity package for free because 'we're launching soon and once we get funding we'll pay properly.' They said it would be perfect for my portfolio. They have a business and a team."

**What a message needs to do:** Decline firmly but without burning the bridge, redirect to a paid discovery or starter engagement, and make clear that exposure does not pay rent — all in tone-appropriate professional language.

---

### 10. Micromanagement / Boundaries Violation

**Short name:** `boundary_violation`

**Trigger:** Client contacts the freelancer outside business hours repeatedly, expects immediate responses at all times, sends messages via personal channels (WhatsApp, personal Instagram DM), or explicitly expects 24/7 availability as part of the working relationship. May escalate to daily calls, slack bombardment, or demands for real-time screen sharing.

**Frequency:** MEDIUM-HIGH. Ask a Manager had a viral thread titled "My client constantly pesters me and micromanages my every move" with thousands of comments. Matt Olpinski's "Teach Freelance Clients to Respect Your Time" is widely shared. This scenario is particularly reported by freelancers who work with founder-stage clients or overseas clients with different timezone/culture norms.

**Distinct from existing tools:** None of the existing tools deal with the working *relationship* — they all deal with specific contractual events. This is a professional boundary communication scenario.

**Example quote:**
> "Client has texted me at 11pm three times this week. They message me on WhatsApp, Instagram DMs, and email simultaneously. My contract doesn't specify response times. I never said I was available after 6pm."

**What a message needs to do:** Professionally establish communication norms (channels, response times, business hours), frame it as a process improvement rather than a complaint, and give the client a clear path to reach you appropriately.

---

### 11. Scope Approved Then Rejected (Moving Goalposts)

**Short name:** `goalpost_shift`

**Trigger:** Client approved a direction (mood board, wireframe, copy brief, prototype) then later rejects the final deliverable claiming it's "not what they wanted" — even though the final is logically consistent with what they approved. Often accompanied by "I thought I was approving something different" or "My co-founder doesn't like it."

**Frequency:** HIGH. PainOnSocial's compilation of Reddit dispute threads cites this as the most common cause of payment refusals. The pattern is: freelancer asks for approval at each stage, client gives vague approval, client rejects final, freelancer has no documented trail.

**Distinct from existing tools:** "Revision Limit" handles the case where the number of revision rounds is exceeded. This handles a structurally different scenario: the client claims the *entire direction* was wrong, even though milestones were approved. It requires surfacing the approval trail, not counting revision rounds.

**Example quote (from PainOnSocial Reddit compilation):**
> "Client approved the wireframes, approved the design mockup, approved the copy. Now they've received the final site and say it's 'completely off-brand' and want to start over. They're refusing the final invoice until I redo it from scratch."

**What a message needs to do:** Present the written/email approval trail calmly, distinguish between a "change of preference" (new scope, new charge) and a "deliverable failure" (which would be covered under revision terms), and make clear that re-scoping requires a new agreement.

---

### 12. Lowball Rate Request (Pre-Project Negotiation Pressure)

**Short name:** `lowball_negotiation`

**Trigger:** After receiving a quote, the client attempts to significantly undercut the price — not by asking for less scope, but by challenging the hourly rate, comparing to cheaper offshore alternatives, claiming the project "shouldn't take that long," or using the "I can get this done for $200 on Fiverr" line.

**Frequency:** VERY HIGH. Consistently in the top 5 complaints in r/freelance, r/webdev, and r/graphic_design. Double Your Freelancing's core content is built around this problem. Community discussions show that poorly handled rate challenges often lead freelancers to either undervalue themselves or lose a client unnecessarily.

**Distinct from existing tools:** This is pre-contract — no existing tool covers the proposal/negotiation phase. It's related to the rate increase tool but different context (new client vs. existing client).

**Example quote:**
> "Quoted $4,500 for a 6-page site. Client replied: 'That's way more than we expected. My nephew does websites and said this should take maybe 10 hours. Can you do it for $800?'"

**What a message needs to do:** Professionally explain what drives the price (experience, scope, quality, warranty), decline to match the $200 Fiverr comparison, optionally offer a reduced scope at the original rate, and do it in a way that maintains confidence and doesn't sound defensive.

---

### 13. Feedback Stall / Approval Delay

**Short name:** `feedback_stall`

**Trigger:** Client fails to provide promised feedback or approvals on time — blocking the freelancer from moving forward, disrupting their schedule, delaying invoicing milestones, and often leading to compressed final timelines. The client then expects the original deadline to be honored despite causing the delay.

**Frequency:** HIGH. Cited as a top workflow problem in the InvoiceNinja "7 Ways to Deal with Freelance Project Delays" guide and the Constant Content feedback guide. Multiple freelancer forums describe clients who delay weeks then expect overnight turnaround.

**Distinct from existing tools:** No existing tool covers the *client's* delay on the freelancer. Existing tools address problems the client creates with additional demands or payment — this addresses the client's *inaction* blocking the freelancer's work.

**Example quote:**
> "I delivered the first draft three weeks ago. Client said they'd review in 48 hours. I've followed up four times. No feedback. Now they're saying they need the final delivered by end of this week — which was the original deadline, set before they sat on it for three weeks."

**What a message needs to do:** Professionally recalibrate the timeline based on the actual feedback received date, make clear that the original deadline is no longer achievable without a rush premium, and reset mutual expectations going forward.

---

## Competitor Landscape: What Existing Tools Offer

### AND.CO (Fiverr)
- Contracts and proposals with e-signature
- Invoice tracking and automated reminders (covers the payment escalation ladder)
- Project tracking and time logging
- **No conflict-specific messaging tools.** No templates for "what to say when X happens." The tool helps you document — it doesn't help you communicate.

### Hello Bonsai
- Attorney-vetted contract templates (scope, kill fee, IP clauses)
- Automated payment reminders (similar to Pushback's payment escalation)
- Late fee calculation
- **No message generation.** Bonsai's blog has content about chargebacks and scope creep, but the product doesn't generate conflict communications.

### HoneyBook
- Client pipeline and smart files
- Invoice automation and payment collection
- **No dispute messaging tools.** Focused on onboarding and workflow automation, not conflict resolution.

### Moxie (formerly Hectic)
- "What to do when a client hasn't paid you" blog content
- Contract, invoice, proposal tools
- **No real-time conflict messaging.** Their content is educational, not generative.

### Dubsado
- Similar to HoneyBook — CRM, contracts, scheduling
- **No conflict resolution features.**

**Key gap across all competitors:** Every tool in this space helps freelancers *document and invoice*. None of them generate professional pushback messages. Pushback is unique in offering AI-generated, situation-specific conflict communications. The gap is clear — no competitor has a "what do I say to this client right now" feature.

---

## Top 10 Prioritized Recommendations (by frequency + distinctiveness)

| Rank | Scenario Name | Tool Key | Frequency | Why Not Already Covered |
|------|--------------|----------|-----------|------------------------|
| 1 | Lowball Rate Negotiation | `lowball_negotiation` | Very High | Pre-contract; no existing tool covers proposal phase |
| 2 | Goalpost Shift (Approved Then Rejected) | `goalpost_shift` | High | Different from Revision Limit — addresses direction rejection, not revision count |
| 3 | Retroactive Price Reduction | `retroactive_discount` | High | Different from payment reminders — the *amount* is being disputed, not the timing |
| 4 | Client Goes Dark Mid-Project | `project_abandonment` | Very High | Dispute Response handles active claims; this handles total absence |
| 5 | IP / Source File Ownership | `ip_ownership` | High | No existing tool touches copyright or IP |
| 6 | Rush Deadline Demand | `rush_demand` | High | No existing tool covers timeline negotiation or rush-fee communication |
| 7 | Rate Increase Pushback | `rate_increase` | High | No existing tool covers pricing communication with existing clients |
| 8 | Feedback Stall / Approval Delay | `feedback_stall` | High | No existing tool covers the client's own delays blocking the freelancer |
| 9 | Chargeback / Payment Reversal | `chargeback_threat` | Medium-High | Different channel and mechanism than direct dispute — bank-mediated |
| 10 | Exposure / Spec Work Pressure | `spec_work_pressure` | High | Pre-engagement; no existing tool covers refusing manipulative work requests |
| 11 | Unauthorized Use of Work | `unauthorized_use` | Medium-High | Delivery Sign-Off covers pre-transfer; this covers after unauthorized use occurs |
| 12 | Micromanagement / Boundary Violation | `boundary_violation` | Medium-High | No existing tool covers the professional relationship, only contractual events |
| 13 | Stakeholder Chaos | `stakeholder_chaos` | Medium-High | Scope Change covers additions; this covers organizational process failures |

---

## Suggested Implementation Notes

For the **highest-value additions** (top 5), the context fields needed:

### `lowball_negotiation`
- Original quote amount
- Client's counter-offer amount (optional)
- What the quote includes (scope summary)

### `goalpost_shift`
- Which milestone stages were approved
- What changed in the client's feedback
- Date of last approval

### `retroactive_discount`
- Original agreed amount
- Discount percentage/amount client is requesting
- Whether work has been delivered

### `project_abandonment`
- Last contact date
- Current project stage
- Whether a deposit was received
- Deadline to respond before dormancy clause triggers

### `ip_ownership`
- Type of files being demanded (source, editable, full codebase)
- What was included in original agreement
- Whether a license or full transfer was agreed

---

## Sources Consulted

- [Freelance Payment Problems: What Reddit Reveals — PainOnSocial](https://painonsocial.com/blog/freelance-payment-problems-reddit)
- [Freelance Contract Disputes: How to Avoid & Resolve Them — PainOnSocial](https://painonsocial.com/blog/freelance-contract-disputes-reddit)
- [Ask HN: Freelancer's Dilemma — Client Won't Pay Despite Clear Agreement](https://news.ycombinator.com/item?id=40943343)
- [How To Manage Clients Who Disappear Mid-Project — Jennifer Bourn](https://jenniferbourn.com/managing-clients-who-disappear/)
- [10 Red Flags for Bad Clients — Morgan Overholt](https://morganoverholt.com/entrepreneur/red-flags-for-bad-clients/)
- [Legalities 33: Do You Have to Give Your Client Digital Files? — AIGA SF / Owen, Wickersham & Erickson](https://aigasf.org/legalities-33-do-you-have-to-give-your-freelance-client-your-digital-files/)
- [Guide to Copyright for Freelancers — Better Proposals](https://betterproposals.io/blog/copyright-for-freelancers/)
- [The Ultimate Freelance Copyright Guide 2025 — SoloWise](https://solowise.com/blog/copyright-freelance-guide)
- [How Freelancers Can Prevent Chargebacks — Hongkiat](https://www.hongkiat.com/blog/prevent-chargebacks/)
- [What Are Chargebacks and How a Legally Vetted Template Can Help — Hello Bonsai](https://www.hellobonsai.com/blog/chargebacks-for-freelancers)
- [Moxie: Types of Difficult Clients](https://www.withmoxie.com/blog/freelancing-tips-for-spotting-and-managing-difficult-clients)
- [Teach Freelance Clients to Respect Your Time — Matt Olpinski](https://mattolpinski.com/articles/business-hours/)
- [My Client Constantly Pesters Me — Ask a Manager](https://www.askamanager.org/2015/02/my-client-constantly-pesters-me-and-micromanages-my-every-move.html)
- [Never Negotiate Your Freelance Rate — Double Your Freelancing](https://doubleyourfreelancing.com/never-negotiate-freelance-rate/)
- [How to Gracefully Tell a Client You're Raising Your Rates — Millo](https://millo.co/gracefully-tell-client-youre-raising-rates)
- [Client will not pay because "project has been paused" — Upwork Community](https://community.upwork.com/t5/Freelancers/Client-will-not-pay-because-quot-project-has-been-paused-quot/m-p/801353)
- [7 Ways to Deal with Freelance Project Delays — Invoice Ninja](https://invoiceninja.com/7-ways-to-deal-with-freelance-project-delays/)
- [Bonsai vs HoneyBook 2025 Comparison — Assembly](https://assembly.com/blog/bonsai-vs-honeybook)
- [Freelance Isn't Free — Freelancers Union](https://freelancersunion.org/advocacy/freelance-isnt-free/)
- [Client Issues — Freelancers Union](https://freelancersunion.org/resources/client-issues/)
- [A Guide to Prevent & Quell Disputes — Freelancers Union Blog](https://blog.freelancersunion.org/2024/06/18/a-guide-to-prevent-quell-disputes-with-your-clients/)
