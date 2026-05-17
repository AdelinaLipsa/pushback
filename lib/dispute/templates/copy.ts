import type { DisputeType } from '@/types'

export const coverLetterTemplates: Record<DisputeType, string> = {
  not_as_described:
    'I am submitting this evidence package in response to the disputed transaction. The work delivered under this engagement matches the agreed scope and deliverables as outlined in our written agreement with {clientName}. The attached contract excerpt and dated communication log demonstrate that {clientName} reviewed and accepted the deliverables prior to the disputed charge.',
  not_received:
    'I am submitting this evidence package in response to the disputed transaction. The deliverables paid for under this engagement were transferred to {clientName} on the dates documented in the attached delivery timeline and sign-off proofs. The attached contract excerpt and message log demonstrate that delivery occurred and was acknowledged.',
  cancelled:
    'I am submitting this evidence package in response to the disputed transaction. The engagement was not unilaterally cancelled. The attached cancellation clause, dated communication log, and work-completed evidence demonstrate that the work performed and billed up to the cancellation date was contractually owed by {clientName}.',
  unauthorized:
    'I am submitting this evidence package in response to the disputed transaction. The charge was authorized by {clientName} in writing through the attached agreement and the dated correspondence in the communication log. The transaction reference, amount, and date all match the contracted engagement.',
}

export const summaryTemplates: Record<DisputeType, [string, string, string, string]> = {
  not_as_described: [
    'The dispute filed by {clientName} alleges the work was not as described. The attached agreement defines the scope and acceptance criteria explicitly; this evidence package shows those criteria were met.',
    'The contract excerpt on pages 2–3 cites the scope, acceptance, and revision clauses. Each was followed during execution. {revisionsNote}',
    'The communication log on pages 5–6 contains {messageCount} dated message(s) showing approval, sign-off, or absence of objection to the deliverables before the chargeback was filed.',
    'On the basis of the contract terms and the documented communications, the disputed charge of {transactionSummary} represents payment for delivered, accepted work and should stand.',
  ],
  not_received: [
    'The dispute filed by {clientName} alleges the deliverables were not received. The evidence in this package establishes the date, method, and acknowledgement of delivery.',
    'The delivery timeline on page 4 lists each milestone with timestamps. {signOffNote}',
    'The communication log on pages 5–6 contains {messageCount} dated message(s) referencing the transfer or acknowledgement of the deliverables.',
    'On the basis of the timeline, sign-off proofs, and correspondence, the disputed charge of {transactionSummary} represents payment for deliverables that were demonstrably transferred and received.',
  ],
  cancelled: [
    'The dispute filed by {clientName} characterizes the engagement as cancelled in a way that voids payment. The attached agreement and timeline establish the actual cancellation circumstances and the work performed up to that date.',
    'The contract excerpt on pages 2–3 cites the cancellation and kill-fee terms. {cancellationClauseNote}',
    'The communication log on pages 5–6 contains {messageCount} dated message(s) documenting the work completed and billed before cancellation.',
    'On the basis of the contract terms and the documented work-in-progress, the disputed charge of {transactionSummary} represents payment for work contractually owed at the point of cancellation.',
  ],
  unauthorized: [
    'The dispute filed by {clientName} characterizes the transaction as unauthorized. The attached agreement and correspondence establish written authorization for the charge.',
    'The contract excerpt on pages 2–3 contains the authorization, identity, and payment-terms clauses signed by {clientName}.',
    'The communication log on pages 5–6 contains {messageCount} dated message(s) under {clientName} confirming the engagement, the deliverables, and the agreed amount.',
    'On the basis of the signed agreement and the dated correspondence, the disputed charge of {transactionSummary} was authorized in writing and should stand.',
  ],
}
