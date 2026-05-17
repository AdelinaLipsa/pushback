import type { DefenseTool } from '@/types'

// Phase 14 — deterministic, auditable, multi-dimensional risk engine.
// Locked output shape per CONTEXT D-06. Locked file layout per D-02.
// IMPORTANT: This module is type-only at runtime — no side effects, no imports
// from lib/clientRisk.ts (Phase 12 file). Plan 04 makes the legacy file delegate
// the other direction.

/** Top-level risk band — three states, locked per D-08. */
export type RiskLevel = 'green' | 'amber' | 'red'

/** The three independent dimensions composing the composite score (D-06). */
export type RiskDimension = 'payment' | 'scope' | 'chargeback'

/**
 * Per-signal evidence row. Each scorer emits one signal per finding and tags
 * the integer points it contributed (D-09 — auditability requirement). The
 * `source` field tells the UI which table the evidence came from so a per-signal
 * breakdown can group rows.
 *
 * Locked byte-for-byte per D-06 — downstream plans import this type, never
 * redefine it.
 */
export type RiskSignal = {
  code: string
  label: string
  points: number
  source: 'projects' | 'responses' | 'contracts'
}

/** Output of a single per-dimension scorer (D-01 contract). */
export type DimensionScore = {
  score: number
  signals: RiskSignal[]
}

/**
 * Locked composite output type per D-06. Plan 02's orchestrator builds this;
 * Plan 01 only defines it so downstream plans can type against a fixed contract.
 */
export type RiskResult = {
  /** 0–100, weighted composite per D-07. */
  composite: number
  level: RiskLevel
  /** Deterministic sentence from the static decision table (D-19). Plan 02 fills. */
  nextAction: string
  dimensions: {
    payment: DimensionScore
    scope: DimensionScore
    chargeback: DimensionScore
  }
  /** Deterministic top-mitigation simulation (D-20). Plan 02 fills. */
  topMitigation: {
    dimension: RiskDimension
    action: string
    deltaPoints: number
  } | null
}

/**
 * Shared input bundle that the orchestrator (Plan 02) builds from a Project +
 * its contract + its sent defense_responses and passes into each scorer.
 *
 * Scorers MUST NOT re-fetch from the DB (D-01, D-03) and MUST NOT call
 * `new Date()` in module scope — they use the injected `today` ISO string so
 * the same inputs always yield the same score (D-26 reproducibility).
 */
export type RiskInput = {
  /** Project ID — used only for signal attribution if needed; no DB use. */
  projectId: string
  /** ISO date string anchoring all date math. Orchestrator injects. */
  today: string
  /** ISO date string or null — `projects.payment_due_date`. */
  paymentDueDate: string | null
  /** ISO timestamp or null — `projects.payment_received_at`. */
  paymentReceivedAt: string | null
  /** `projects.project_value` — currency-agnostic numeric. */
  projectValue: number | null
  /**
   * Whether a freelance-protection contract (i.e. a service agreement, NOT
   * an NDA) is attached to the project. When `false`, scorers suppress
   * contract-gap signals (no_late_fee_clause, no_scope_clause, etc.) — the
   * gap signals only make sense for a contract that's meant to carry those
   * protections in the first place. Set by the orchestrator from
   * `project.contracts.contract_type === 'service_agreement'`. NDAs and
   * "no contract on file" both yield false here; the Contract tab handles
   * the upload prompt.
   */
  hasContract: boolean
  /**
   * Contract clause coverage — `contracts.analysis.clauses_present` array, or
   * empty array if no contract attached. Scorers check inclusion (D-10/D-13).
   * Only consulted when `hasContract === true`.
   */
  contractClauses: string[]
  /**
   * Defense responses pre-filtered to `was_sent === true` per D-14. Drafts
   * never contribute. Each entry carries the bare minimum the scorers need
   * (tool type + creation timestamp).
   */
  sentResponses: Array<{ tool_type: DefenseTool; created_at: string }>
  /**
   * Days since the most recent sent defense response, or null if no responses
   * have been sent. Used by the chargeback silence detector (D-16).
   */
  daysSinceLastResponse: number | null
}
