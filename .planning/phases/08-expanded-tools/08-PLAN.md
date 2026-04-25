# Phase 08: Expanded Defense Tools

## Goal
Add 12 new defense tools covering the most common freelancer conflict scenarios not currently handled. Every tool is validated by community research (Reddit r/freelance, HN, freelancer forums) as high-frequency.

## Research Validation
Research confirmed these as the highest-frequency unaddressed scenarios:
1. Lowball/discount negotiation (very high frequency)
2. Goalpost shift — approved then rejected (high frequency)
3. Retroactive discount after delivery (high frequency)
4. Ghost client / project abandonment (very high frequency)
5. IP/source file ownership dispute (high frequency)
6. Rush deadline without rush fee (high frequency)
7. Rate increase pushback from existing clients (high frequency)
8. Feedback stall blocking delivery (high frequency)
9. Chargeback/payment reversal threat (medium-high)
10. Exposure/spec work pressure (high, especially creative fields)

Competitor gap confirmed: AND.CO, Hello Bonsai, HoneyBook, Moxie, Dubsado all help freelancers document and invoice — none generate situation-specific conflict communications.

## New Tools (12 total)

| type | label | urgency |
|------|-------|---------|
| `ghost_client` | Ghost Client | medium |
| `feedback_stall` | Feedback Delay | medium |
| `moving_goalposts` | Approved Then Rejected | high |
| `discount_pressure` | Rate Negotiation | medium |
| `retroactive_discount` | Post-Delivery Discount Demand | high |
| `rate_increase_pushback` | Rate Increase Pushback | medium |
| `rush_fee_demand` | Rush Without Rush Fee | medium |
| `ip_dispute` | IP / Source File Dispute | high |
| `chargeback_threat` | Chargeback Threat | high |
| `spec_work_pressure` | Exposure / Spec Work | low |
| `post_handoff_request` | Post-Handoff Request | high |
| `review_threat` | Review Threat | high |

## Exact Files to Change (in order)

### 1. `types/index.ts`
Add to DefenseTool union type:
`'ghost_client' | 'feedback_stall' | 'moving_goalposts' | 'discount_pressure' | 'retroactive_discount' | 'rate_increase_pushback' | 'rush_fee_demand' | 'ip_dispute' | 'chargeback_threat' | 'spec_work_pressure' | 'post_handoff_request' | 'review_threat'`

### 2. `lib/defenseTools.ts`
Append to DEFENSE_TOOLS array after `dispute_response`:

```ts
{
  type: 'ghost_client',
  label: 'Ghost Client',
  description: 'Client has gone completely silent mid-project, blocking progress',
  icon: 'EyeOff',
  urgency: 'medium',
  contextFields: [
    { key: 'days_silent', label: 'Days since last response', placeholder: 'e.g. 10', type: 'number', required: false },
    { key: 'project_stage', label: 'Current project stage', placeholder: 'e.g. awaiting feedback on design round 2', type: 'text', required: false }
  ]
},
{
  type: 'feedback_stall',
  label: 'Feedback Delay',
  description: 'Client delays are past the agreed deadline — now threatening your timeline',
  icon: 'Hourglass',
  urgency: 'medium',
  contextFields: [
    { key: 'waiting_days', label: 'Days waiting for feedback', placeholder: 'e.g. 8', type: 'number', required: false },
    { key: 'blocked_on', label: 'What are you waiting on?', placeholder: 'e.g. homepage copy approval', type: 'text', required: false },
    { key: 'original_deadline', label: 'Original delivery deadline', placeholder: 'e.g. May 1', type: 'text', required: false }
  ]
},
{
  type: 'moving_goalposts',
  label: 'Approved Then Rejected',
  description: 'Client approved the direction, now rejecting the final result as wrong',
  icon: 'Shuffle',
  urgency: 'high',
  contextFields: [
    { key: 'approved_stage', label: 'What did they approve?', placeholder: 'e.g. wireframes and style guide on March 10', type: 'text', required: false },
    { key: 'new_request', label: 'What are they rejecting or changing now?', placeholder: 'e.g. now want a completely different visual style', type: 'text', required: false }
  ]
},
{
  type: 'discount_pressure',
  label: 'Rate Negotiation',
  description: 'Client counter-offering dramatically below your quoted rate',
  icon: 'TrendingDown',
  urgency: 'medium',
  contextFields: [
    { key: 'quoted_amount', label: 'Your quoted price', placeholder: 'e.g. 3000', type: 'number', required: false },
    { key: 'their_offer', label: 'What they offered or are requesting', placeholder: 'e.g. 1200 or "can you do 40% off?"', type: 'text', required: false }
  ]
},
{
  type: 'retroactive_discount',
  label: 'Post-Delivery Discount Demand',
  description: 'Work is delivered — client now claims the price is too high and wants a reduction',
  icon: 'ReceiptX',
  urgency: 'high',
  contextFields: [
    { key: 'invoice_amount', label: 'Invoice amount', placeholder: 'e.g. 2500', type: 'number', required: false },
    { key: 'their_claim', label: 'What reason are they giving?', placeholder: 'e.g. the work took less time than expected', type: 'text', required: false }
  ]
},
{
  type: 'rate_increase_pushback',
  label: 'Rate Increase Pushback',
  description: 'Existing client refusing or guilt-tripping about your rate increase',
  icon: 'TrendingUp',
  urgency: 'medium',
  contextFields: [
    { key: 'old_rate', label: 'Your previous rate', placeholder: 'e.g. 75/hr', type: 'text', required: false },
    { key: 'new_rate', label: 'Your new rate', placeholder: 'e.g. 95/hr', type: 'text', required: false }
  ]
},
{
  type: 'rush_fee_demand',
  label: 'Rush Without Rush Fee',
  description: 'Client suddenly needs faster delivery but is not offering to pay a rush fee',
  icon: 'Zap',
  urgency: 'medium',
  contextFields: [
    { key: 'original_deadline', label: 'Original agreed deadline', placeholder: 'e.g. May 15', type: 'text', required: false },
    { key: 'new_deadline', label: 'Their demanded deadline', placeholder: 'e.g. this Friday', type: 'text', required: false }
  ]
},
{
  type: 'ip_dispute',
  label: 'IP / Source File Dispute',
  description: 'Client claiming ownership of source files, tools, or pre-existing assets not included in the agreement',
  icon: 'Copyright',
  urgency: 'high',
  contextFields: [
    { key: 'disputed_asset', label: 'What are they claiming?', placeholder: 'e.g. full Figma source files and component library', type: 'text', required: false }
  ]
},
{
  type: 'chargeback_threat',
  label: 'Chargeback Threat',
  description: 'Client threatening to dispute the charge with their bank after receiving the work',
  icon: 'CreditCard',
  urgency: 'high',
  contextFields: [
    { key: 'amount', label: 'Amount at risk', placeholder: 'e.g. 1800', type: 'number', required: false }
  ]
},
{
  type: 'spec_work_pressure',
  label: 'Exposure / Spec Work',
  description: 'Client requesting free or heavily discounted work for "exposure" or a portfolio piece',
  icon: 'Eye',
  urgency: 'low',
  contextFields: [
    { key: 'their_offer', label: 'What are they offering in return?', placeholder: 'e.g. exposure to their 50k followers', type: 'text', required: false }
  ]
},
{
  type: 'post_handoff_request',
  label: 'Post-Handoff Request',
  description: 'Project is closed and delivered — client now wants free changes',
  icon: 'PackageOpen',
  urgency: 'high',
  contextFields: [
    { key: 'handoff_date', label: 'When was the project handed off?', placeholder: 'e.g. April 20', type: 'text', required: false },
    { key: 'requested_change', label: 'What are they asking for now?', placeholder: 'e.g. update all the homepage copy', type: 'text', required: false }
  ]
},
{
  type: 'review_threat',
  label: 'Review Threat',
  description: 'Client threatening a public bad review or social media complaint to extract free work',
  icon: 'Star',
  urgency: 'high',
  contextFields: []
}
```

Add to ICON_MAP in DefenseToolCard.tsx:
`EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard, Eye, PackageOpen, Star, ReceiptX`

Note: `ReceiptX` may not exist in lucide — use `Receipt` if not found.

### 3. `lib/anthropic.ts` — DEFENSE_SYSTEM_PROMPT tone blocks

Add after existing `dispute_response:` tone block:

```
ghost_client:
No accusation — assume life got busy. Open warmly, state what you have been waiting on
and for how long. Set a specific response deadline (e.g. 5 business days). Note calmly:
if no response by that date, you will need to pause the project slot and a restart may
require a re-scheduling fee. Leave the door open.

feedback_stall:
Professional and factual. State what you are waiting on and the number of days elapsed.
Recalibrate the delivery deadline clearly: the new deadline is X business days from when
feedback is received. This is not a threat — it is a timeline update based on actual work
start date.

moving_goalposts:
Do not argue. Acknowledge the new direction positively. Then make the situation clear in
neutral, factual terms: the direction that was approved on [date] has been delivered per
the brief. A new creative direction constitutes new scope — include a revised quote and
timeline offer. Professional, no blame.

discount_pressure:
Hold the rate. No apology. Briefly acknowledge their budget constraint, then state your
rate is set based on the work required. Option: offer a reduced scope at their budget —
never the same scope for less. One paragraph. Final.

retroactive_discount:
Zero negotiation on delivered work. State clearly that the work was delivered per the
agreed brief and the invoice reflects the agreed price. If there is a genuine quality
concern, you are open to discussing it — but the price is not negotiable after delivery.
Professional, firm, short.

rate_increase_pushback:
Hold the new rate without apology or excessive justification. Briefly acknowledge the
change, then state the rate reflects your current expertise and market positioning. Offer
one concession if appropriate: a short transition period at the old rate (e.g. one more
project). No guilt.

rush_fee_demand:
Acknowledge the urgency without assuming blame. State clearly: rush delivery is available
at a rush fee (suggest 25–50% of project value or a specific rate). Give them the binary:
rush delivery at the rush rate, or original timeline at the current rate. No hedging.

ip_dispute:
State clearly and factually: IP ownership under the agreement covers the specific
deliverables created for this project — not pre-existing tools, templates, frameworks, or
source files unless explicitly included in the contract. Reference the contract if
available. Offer to clarify in a short call. Matter-of-fact, no hostility.

chargeback_threat:
Do not panic. State calmly that you have complete documentation of all work delivered,
approved, and communicated. Chargebacks for received and accepted services may be
considered fraudulent disputes. You are happy to resolve genuine concerns directly —
but a chargeback would require you to respond through the formal dispute process with
full documentation. One paragraph, professional.

spec_work_pressure:
No apology for valuing your work. Briefly acknowledge their situation, then decline the
exposure offer. If you are interested in the project, state your standard rate. One to two
sentences. No hostility — just clarity.

post_handoff_request:
Friendly and unambiguous. Project is complete and closed — what they are describing is
new work. Quote a rate for the new work (hourly or fixed). No guilt, no apology — just a
clear path forward if they want to continue.

review_threat:
Zero emotion. Do not threaten back. State calmly: your work was delivered per the agreed
brief, you maintain full records of communications and deliverables, and you are happy to
address any genuine concerns through proper channels. Threats of negative reviews do not
change contractual obligations. One paragraph. Professional.
```

### 4. `app/api/projects/[id]/defend/route.ts` — TOOL_LABELS additions

```ts
ghost_client: 'GHOST CLIENT — RADIO SILENCE',
feedback_stall: 'FEEDBACK DELAY — TIMELINE RECALIBRATION',
moving_goalposts: 'APPROVED THEN REJECTED — GOALPOST SHIFT',
discount_pressure: 'RATE NEGOTIATION — HOLD YOUR RATE',
retroactive_discount: 'POST-DELIVERY DISCOUNT DEMAND',
rate_increase_pushback: 'RATE INCREASE — HOLD THE NEW RATE',
rush_fee_demand: 'RUSH DEMAND WITHOUT RUSH FEE',
ip_dispute: 'IP / SOURCE FILE OWNERSHIP DISPUTE',
chargeback_threat: 'CHARGEBACK / PAYMENT REVERSAL THREAT',
spec_work_pressure: 'EXPOSURE / SPEC WORK DEMAND',
post_handoff_request: 'POST-HANDOFF REQUEST — CLOSED PROJECT',
review_threat: 'REVIEW / REPUTATION THREAT',
```

### 5. `app/api/projects/[id]/analyze-message/route.ts`

Add all 12 new tool types to `DEFENSE_TOOL_VALUES`.

### 6. `lib/anthropic.ts` — CLASSIFY_SYSTEM_PROMPT

Add descriptions for all 12 new tools:
```
- ghost_client: Client has stopped responding entirely, blocking project progress
- feedback_stall: Client is not providing feedback on time, threatening the delivery deadline
- moving_goalposts: Client approved work then rejected the final deliverable as not what they wanted
- discount_pressure: Client is pushing back on the quoted price before work begins
- retroactive_discount: Client is demanding a price reduction after the work has been delivered
- rate_increase_pushback: Existing client is resisting or guilt-tripping about a rate increase
- rush_fee_demand: Client needs faster delivery but is not offering a rush fee
- ip_dispute: Client is claiming ownership of source files or assets beyond the agreed deliverables
- chargeback_threat: Client is threatening to dispute the payment with their bank or card provider
- spec_work_pressure: Client is requesting free or heavily discounted work in exchange for exposure
- post_handoff_request: Client is requesting changes or additions after the project was delivered and closed
- review_threat: Client is threatening to leave a negative review to pressure free work or a refund
```

## Success Criteria
1. All 20 tools render in the defense grid (8 existing + 12 new)
2. Each generates a relevant, professional message via the defend API
3. analyze-message correctly classifies all 20 tool types
4. No TypeScript errors — DefenseTool union is complete
5. No missing icons — all icon names resolve in lucide-react
