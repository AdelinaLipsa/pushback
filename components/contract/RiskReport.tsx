'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { ContractAnalysis, RiskLevel } from '@/types'
import RiskScoreBadge from './RiskScoreBadge'
import ClauseCard from './ClauseCard'
import CounterOfferSection from './CounterOfferSection'
import { startCheckout } from '@/lib/checkout'

interface RiskReportProps {
  analysis: ContractAnalysis
  contractId?: string
  isPro?: boolean
}

function SectionHeader({ label, count, countColor }: { label: string; count?: number; countColor?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-200 m-0">{label}</h3>
      {count !== undefined && (
        <span className="text-[0.68rem] font-bold" style={{ color: countColor }}>({count})</span>
      )}
    </div>
  )
}

const SEV: Record<string, { border: string; badge: string }> = {
  CRITICAL: { border: 'border-l-urgency-high',  badge: 'bg-urgency-high/10 border border-urgency-high/30 text-urgency-high' },
  HIGH:     { border: 'border-l-urgency-medium', badge: 'bg-urgency-medium/10 border border-urgency-medium/30 text-urgency-medium' },
  MEDIUM:   { border: 'border-l-yellow-500',     badge: 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500' },
  LOW:      { border: 'border-l-urgency-low',    badge: 'bg-urgency-low/10 border border-urgency-low/30 text-urgency-low' },
}

export default function RiskReport({ analysis, contractId, isPro }: RiskReportProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const flaggedClauses = analysis.flagged_clauses ?? []
  const missingProtections = analysis.missing_protections ?? []
  const positiveNotes = analysis.positive_notes ?? []
  const negotiationPriority = analysis.negotiation_priority ?? []

  return (
    <div className="flex flex-col gap-6">

      {/* Summary — always visible */}
      <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <RiskScoreBadge score={analysis.risk_score} level={analysis.risk_level as RiskLevel} />
          <span className="text-zinc-200 text-xs font-bold uppercase tracking-widest">Recommendation:</span>
          <span className="text-text-primary text-sm font-semibold">{analysis.verdict}</span>
        </div>
        <p className="text-zinc-300 leading-[1.75] text-[0.9rem] m-0">{analysis.summary}</p>
      </div>

      {/* Clause details — Pro only */}
      {!isPro && (
        <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6 flex items-start justify-between gap-6" style={{ animationDelay: '120ms' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-text-muted shrink-0" />
              <p className="font-bold text-[0.9rem] m-0">Full analysis locked</p>
            </div>
            <p className="text-zinc-400 text-[0.82rem] leading-relaxed m-0">
              {flaggedClauses.length > 0 && `${flaggedClauses.length} flagged clause${flaggedClauses.length !== 1 ? 's' : ''}`}
              {flaggedClauses.length > 0 && missingProtections.length > 0 && ' · '}
              {missingProtections.length > 0 && `${missingProtections.length} missing protection${missingProtections.length !== 1 ? 's' : ''}`}
              {(flaggedClauses.length > 0 || missingProtections.length > 0) && ' — upgrade to see every clause, what to negotiate, and draft the counter-offer.'}
            </p>
          </div>
          <button
            onClick={() => startCheckout(setUpgradeLoading)}
            disabled={upgradeLoading}
            className="shrink-0 bg-brand-lime text-[#0a0a0a] font-bold text-[0.82rem] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5"
          >
            {upgradeLoading ? <><Loader2 size={13} className="animate-spin" /> Loading…</> : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      {/* Mosaic grid + counter-offer — Pro only */}
      {isPro && (
      <>
      <div className="fade-up grid grid-cols-[3fr_2fr] gap-6 items-start" style={{ animationDelay: '120ms' }}>

        {/* Left column: flagged clauses + missing protections */}
        <div className="flex flex-col gap-8">
          {flaggedClauses.length > 0 && (
            <section>
              <SectionHeader label="Flagged clauses" count={flaggedClauses.length} countColor="var(--urgency-high)" />
              <div className="flex flex-col gap-2">
                {flaggedClauses.map((clause, i) => (
                  <ClauseCard key={i} clause={clause} delay={i * 40} />
                ))}
              </div>
            </section>
          )}

          {missingProtections.length > 0 && (
            <section>
              <SectionHeader label="Missing protections" count={missingProtections.length} countColor="var(--urgency-medium)" />
              <div className="flex flex-col gap-3">
                {missingProtections.map((p, i) => (
                  <div
                    key={i}
                    className="fade-up bg-bg-surface border border-bg-border border-l-[3px] border-l-urgency-medium rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="px-5 pt-4 pb-3.5">
                      <p className="font-bold text-[0.9rem] mb-2 m-0 text-zinc-100">{p.title}</p>
                      <p className="text-zinc-300 text-[0.85rem] leading-[1.65] m-0">{p.why_you_need_it}</p>
                    </div>
                    <div className="bg-bg-elevated border-t border-bg-border px-5 py-3.5">
                      <p className="text-zinc-200 font-bold text-[0.65rem] uppercase tracking-[0.08em] mb-1.5">Suggested clause</p>
                      <p className="text-zinc-300 text-[0.825rem] leading-[1.7] m-0">{p.suggested_clause}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column: what's working + what to negotiate */}
        <div className="flex flex-col gap-8">
          {positiveNotes.length > 0 && (
            <section>
              <SectionHeader label="What's working for you" />
              <div className="flex flex-col gap-1.5">
                {positiveNotes.map((note, i) => (
                  <div
                    key={i}
                    className="fade-up flex items-start gap-3 bg-bg-surface border border-bg-border border-l-[3px] border-l-brand-lime rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-lime/60 hover:shadow-md hover:shadow-black/20"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-brand-lime">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-zinc-300 text-[0.825rem] leading-[1.65]">{note}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {negotiationPriority.length > 0 && (
            <section>
              <SectionHeader label="What to negotiate" />
              <div className="flex flex-col gap-1.5">
                {negotiationPriority.map((item, i) => {
                  const sevMatch = item.match(/^(CRITICAL|HIGH|MEDIUM|LOW)\s*[—–-]+\s*(.+)/)
                  const severity = sevMatch?.[1] ?? ''
                  const rest = sevMatch?.[2] ?? item
                  const colonIdx = rest.indexOf(': ')
                  const title = colonIdx > -1 ? rest.substring(0, colonIdx) : rest
                  const detail = colonIdx > -1 ? rest.substring(colonIdx + 2) : ''
                  const sev = SEV[severity]
                  return (
                    <div
                      key={i}
                      className={`fade-up flex gap-3 items-start bg-bg-surface border border-bg-border rounded-xl px-4 py-3 border-l-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-bg-elevated/60 hover:shadow-md hover:shadow-black/20 ${sev?.border ?? 'border-l-bg-border'}`}
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <span className="shrink-0 w-5 h-5 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-[0.6rem] font-bold text-zinc-300 mt-0.5 transition-colors duration-200">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 flex-wrap ${detail ? 'mb-1' : ''}`}>
                          {severity && sev && (
                            <span className={`text-[0.58rem] font-bold tracking-[0.06em] rounded px-1.5 py-0.5 shrink-0 ${sev.badge}`}>
                              {severity}
                            </span>
                          )}
                          <span className="font-semibold text-[0.825rem] text-zinc-100 leading-snug">{title}</span>
                        </div>
                        {detail && (
                          <p className="text-zinc-400 text-[0.775rem] leading-[1.55] m-0">{detail}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {contractId && (flaggedClauses.length > 0 || missingProtections.length > 0) && (
        <CounterOfferSection contractId={contractId} isPro={true} />
      )}
      </>
      )}
    </div>
  )
}
