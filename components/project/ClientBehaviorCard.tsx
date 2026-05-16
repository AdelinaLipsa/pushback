import {
  RISK_LEVEL_COLORS,
  levelFromScore,
  type RiskDimension,
  type RiskLevel,
  type RiskResult,
  type RiskSignal,
} from '@/lib/risk'

interface ClientBehaviorCardProps {
  risk: RiskResult
  clientName: string
}

// D-21 expanded copy — locked for v1. The label expands the Phase 12 strings
// ("No concerns" / "Watch this client" / "High-risk client") into action-oriented
// guidance that pairs naturally with the deterministic nextAction sentence.
const LEVEL_LABELS: Record<RiskLevel, string> = {
  green: 'Healthy',
  amber: 'Watch closely',
  red: 'Act now',
}

const DIMENSION_LABELS: Record<RiskDimension, string> = {
  payment: 'Payment',
  scope: 'Scope',
  chargeback: 'Chargeback',
}

const SOURCE_LABELS: Record<RiskSignal['source'], string> = {
  projects: 'Project',
  responses: 'Responses',
  contracts: 'Contract',
}

function formatPoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return `${points}` // already has a minus sign
  return '0'
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  // Per D-21 / Plan 03 spec: each dimension bar uses the colour that the
  // *individual* dimension score maps to via levelFromScore — so a dimension
  // that's amber inside a red composite still renders amber. Renders zero
  // dimensions as a flat empty track in green colour (subtle visual).
  const dimLevel = levelFromScore(score)
  const fillColor = RISK_LEVEL_COLORS[dimLevel]
  const widthPct = Math.max(0, Math.min(100, score))

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <span style={{
        width: '90px',
        flexShrink: 0,
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '6px',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${widthPct}%`,
          height: '100%',
          backgroundColor: fillColor,
          transition: 'width 200ms ease',
        }} />
      </div>
      <span style={{
        width: '32px',
        flexShrink: 0,
        textAlign: 'right',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {score}
      </span>
    </div>
  )
}

function SignalGroup({
  label,
  signals,
}: {
  label: string
  signals: RiskSignal[]
}) {
  // Sub-header row per D-23. When the dimension has zero signals we still
  // render a placeholder row so the table structure is consistent and the
  // user can audit that we checked the dimension (auditability — SC #4).
  return (
    <>
      <tr>
        <td
          colSpan={3}
          style={{
            padding: '0.5rem 0.625rem 0.25rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
          }}
        >
          {label}
        </td>
      </tr>
      {signals.length === 0 ? (
        <tr>
          <td
            colSpan={3}
            style={{
              padding: '0.4rem 0.625rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '0.375rem',
            }}
          >
            No signals
          </td>
        </tr>
      ) : (
        signals.map((signal, i) => (
          <tr
            key={`${signal.code}-${i}`}
            style={{
              backgroundColor: i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent',
            }}
          >
            <td style={{
              padding: '0.4rem 0.625rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              {signal.label}
            </td>
            <td style={{
              padding: '0.4rem 0.625rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {SOURCE_LABELS[signal.source]}
            </td>
            <td style={{
              padding: '0.4rem 0.625rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: signal.points > 0 ? 'var(--urgency-high)' : signal.points < 0 ? 'var(--brand-green)' : 'var(--text-muted)',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {formatPoints(signal.points)}
            </td>
          </tr>
        ))
      )}
    </>
  )
}

export default function ClientBehaviorCard({ risk, clientName }: ClientBehaviorCardProps) {
  const accent = RISK_LEVEL_COLORS[risk.level]
  const levelLabel = LEVEL_LABELS[risk.level]
  const composite = risk.composite
  const compositeWidth = Math.max(0, Math.min(100, composite))

  const showTopMitigation = risk.topMitigation !== null && risk.level !== 'green'

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: '0.1s',
        marginBottom: '2rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: '0.875rem',
        padding: '1rem 1.5rem',
      }}
    >
      {/* 1. Header row — Phase 12 carryover */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}>
          Client Risk
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
            · {clientName}
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: accent,
            lineHeight: 1,
          }}>
            {composite}
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--text-muted)',
          }}>
            · {levelLabel}
          </span>
        </span>
      </div>

      {/* 2. Composite bar */}
      <div style={{
        marginTop: '0.875rem',
        height: '8px',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${compositeWidth}%`,
          height: '100%',
          backgroundColor: accent,
          transition: 'width 200ms ease',
        }} />
      </div>

      {/* 3. Three dimension bars */}
      <div style={{
        marginTop: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <DimensionBar label={DIMENSION_LABELS.payment} score={risk.dimensions.payment.score} />
        <DimensionBar label={DIMENSION_LABELS.scope} score={risk.dimensions.scope.score} />
        <DimensionBar label={DIMENSION_LABELS.chargeback} score={risk.dimensions.chargeback.score} />
      </div>

      {/* 4. nextAction line — text only per D-22 */}
      <p style={{
        marginTop: '0.875rem',
        marginBottom: 0,
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
      }}>
        {risk.nextAction}
      </p>

      {/* 5. topMitigation callout */}
      {showTopMitigation && risk.topMitigation !== null && (
        <div style={{
          marginTop: '0.875rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderLeft: '3px solid var(--brand-lime)',
          borderRadius: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
        }}>
          <span style={{
            fontSize: '0.825rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Biggest lever: {risk.topMitigation.action}
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            Removing this signal would drop the composite by ~{risk.topMitigation.deltaPoints} points.
          </span>
        </div>
      )}

      {/* 6. Per-signal evidence table — D-23 (Success Criteria #4) */}
      <div style={{ marginTop: '1rem' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 2px',
          tableLayout: 'auto',
        }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left',
                padding: '0 0.625rem 0.375rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Signal
              </th>
              <th style={{
                textAlign: 'left',
                padding: '0 0.625rem 0.375rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Source
              </th>
              <th style={{
                textAlign: 'right',
                padding: '0 0.625rem 0.375rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            <SignalGroup label="Payment" signals={risk.dimensions.payment.signals} />
            <SignalGroup label="Scope" signals={risk.dimensions.scope.signals} />
            <SignalGroup label="Chargeback" signals={risk.dimensions.chargeback.signals} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
