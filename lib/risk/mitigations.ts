// Phase 14 — Static mitigation table per D-20.
//
// The engine is LLM-free at runtime (D-26). The `topMitigation.action` sentence
// rendered alongside a simulated point-drop is sourced from a pure lookup keyed
// on the signal `code` strings emitted by the Plan 01 scorers. The orchestrator
// (lib/risk/index.ts) concatenates the deltaPoints at render time — this module
// only owns the locked counter-action copy, never the score math.
//
// Locked v1 phrasing — every key here corresponds 1:1 to a signal code one of
// the three scorers (payment / scope / chargeback) emits in Plan 01. Future
// variants are a copy-only change to this table.

/**
 * Map signal `code` → recommended counter-action sentence. Keys are the
 * canonical signal-code inventory from Plan 01's three scorers (19 codes total
 * — see 14-01-SUMMARY.md "Signal inventory"). Each value is the final sentence
 * the UI renders; no concatenation, no template variables.
 *
 * Caller responsibility (orchestrator): if a signal's code is missing from this
 * table, treat the topMitigation as null rather than rendering a misleading
 * default. The `pickMitigationAction` helper below returns `null` for misses
 * so the orchestrator's branching stays declarative.
 */
export const MITIGATION_TABLE: Record<string, string> = {
  // Payment-dimension signal codes (D-10) — order matches 14-01-SUMMARY.md
  'late_severe':
    'Issue a final payment notice and put new work on hold until paid.',
  'late_moderate':
    'Send a firm payment reminder and confirm the next invoice date in writing.',
  'late_minor':
    'Send a courteous reminder and confirm the payment schedule.',
  'on_time':
    "Keep doing what you're doing — on-time payment is your strongest signal.",
  'no_late_fee_clause':
    'Add a late-fee clause to your contract template — protects every future project.',
  'no_kill_fee_clause':
    'Add a kill-fee clause to your contract template — covers early termination.',
  'no_payment_schedule':
    'Move to a milestone-based payment schedule in writing before next deliverable.',
  'partial_payment_pressure':
    'Stop sending repeat reminders — escalate to a final notice or pause work.',

  // Scope-dimension signal codes (D-13)
  'scope_change_sent':
    'Issue a written scope-change order with revised price before any more changes.',
  'revision_pressure_sent':
    'Enforce your revision cap in writing — any further revisions are billable.',
  'goalpost_shift_sent':
    'Re-confirm the agreed deliverable in writing — flag any approved-then-rejected items.',
  'post_handoff_request_sent':
    'Send a post-handoff rate sheet — anything past delivery is a new engagement.',
  'no_scope_clause':
    'Add a scope-of-work clause to your contract template.',
  'no_revision_cap':
    'Add a revision-cap clause to your contract template (e.g. 2 rounds included).',

  // Chargeback-dimension signal codes (D-16). The chargeback_threat_sent value
  // intentionally contains the literal "Phase 15 trigger" substring — Plan 02
  // done-criterion + cross-phase coupling with the Phase 15 evidence pack.
  'chargeback_threat_sent':
    'Compile a dispute evidence pack now — see Phase 15 trigger.',
  'dispute_response_sent':
    'Save every chat message and email related to this project in one folder.',
  'review_threat_sent':
    'Do not respond emotionally — document the threat and contact the platform if applicable.',
  'silence_14d':
    'Send a single follow-up with a deadline — if no reply, escalate.',
  'no_signoff_on_delivery':
    'Get written sign-off on the most recent delivery — chargeback risk drops sharply.',
}

/**
 * Pure lookup into `MITIGATION_TABLE`. Returns `null` for unknown codes so the
 * orchestrator can branch on the null instead of rendering a misleading
 * default string. Never throws.
 */
export function pickMitigationAction(code: string): string | null {
  return MITIGATION_TABLE[code] ?? null
}
