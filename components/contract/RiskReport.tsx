import { ContractAnalysis, RiskLevel } from '@/types'
import RiskScoreBadge from './RiskScoreBadge'
import ClauseCard from './ClauseCard'

interface RiskReportProps {
  analysis: ContractAnalysis
}

export default function RiskReport({ analysis }: RiskReportProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Summary */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <RiskScoreBadge score={analysis.risk_score} level={analysis.risk_level as RiskLevel} />
          <span style={{
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
            borderRadius: '0.375rem', padding: '0.4rem 0.875rem', fontSize: '0.85rem', fontWeight: 500,
          }}>
            {analysis.verdict}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{analysis.summary}</p>
      </div>

      {/* Flagged clauses */}
      {analysis.flagged_clauses.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>
            Flagged clauses <span style={{ color: 'var(--urgency-high)', fontWeight: 700 }}>({analysis.flagged_clauses.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analysis.flagged_clauses.map((clause, i) => (
              <ClauseCard key={i} clause={clause} />
            ))}
          </div>
        </div>
      )}

      {/* Missing protections */}
      {analysis.missing_protections.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>
            Missing protections <span style={{ color: 'var(--urgency-medium)', fontWeight: 700 }}>({analysis.missing_protections.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analysis.missing_protections.map((p, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderLeft: '4px solid var(--urgency-medium)', borderRadius: '0.75rem', padding: '1rem 1.25rem',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>{p.title}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{p.why_you_need_it}</p>
                <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '0.375rem', padding: '0.75rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Suggested clause</p>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.6, fontFamily: 'var(--font-mono), monospace' }}>{p.suggested_clause}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive notes */}
      {analysis.positive_notes.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>What&apos;s working for you</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {analysis.positive_notes.map((note, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--brand-green)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority */}
      {analysis.negotiation_priority.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>Push back on this first</h3>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1rem' }}>
            {analysis.negotiation_priority.map((item, i) => (
              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
