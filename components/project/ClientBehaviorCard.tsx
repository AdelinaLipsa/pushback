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

// Composite-weighting per D-18: payment 0.4, scope 0.3, chargeback 0.3.
// The donut arcs are sized by these weights — what dominates the composite
// math is visually dominant — and each arc is coloured by its own sub-level
// so an amber dimension inside a green composite still reads amber.
const DIMENSION_WEIGHTS: Record<RiskDimension, number> = {
  payment: 0.4,
  scope: 0.3,
  chargeback: 0.3,
}

// "Contract has no X clause" → "Missing X clause". Reduces three-row vertical
// stack of near-identical phrasing into something scannable.
function humanizeLabel(label: string): string {
  return label.replace(/^Contract has no /, 'Missing ')
}

function topSignals(
  risk: RiskResult,
  limit: number,
): Array<{ signal: RiskSignal; dimension: RiskDimension }> {
  const all: Array<{ signal: RiskSignal; dimension: RiskDimension }> = []
  for (const dim of ['payment', 'scope', 'chargeback'] as RiskDimension[]) {
    for (const s of risk.dimensions[dim].signals) {
      if (s.points > 0) all.push({ signal: s, dimension: dim })
    }
  }
  all.sort((a, b) => b.signal.points - a.signal.points)
  return all.slice(0, limit)
}

function countPositiveSignals(risk: RiskResult): number {
  let n = 0
  for (const dim of ['payment', 'scope', 'chargeback'] as RiskDimension[]) {
    for (const s of risk.dimensions[dim].signals) if (s.points > 0) n++
  }
  return n
}

interface DonutProps {
  risk: RiskResult
}

function Donut({ risk }: DonutProps) {
  const R = 64
  const STROKE = 14
  const SIZE = R * 2 + STROKE
  const CX = SIZE / 2
  const C = 2 * Math.PI * R
  const GAP_PX = 6

  const compositeColor = RISK_LEVEL_COLORS[risk.level]

  // For each arc: dasharray = visible-length + remaining; offset starts the
  // arc at the end of the previous one. Negative dashoffset rotates *forward*
  // along the perimeter; the parent transform rotates -90deg so 0° = top.
  const dims: RiskDimension[] = ['payment', 'scope', 'chargeback']
  let cumulative = 0
  const arcs = dims.map((dim) => {
    const weight = DIMENSION_WEIGHTS[dim]
    const fullLen = weight * C
    const visibleLen = Math.max(0, fullLen - GAP_PX)
    const offset = -cumulative
    const color = RISK_LEVEL_COLORS[levelFromScore(risk.dimensions[dim].score)]
    const score = risk.dimensions[dim].score
    cumulative += fullLen
    return { dim, visibleLen, offset, color, score }
  })

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label={`Composite risk score ${risk.composite}, level ${LEVEL_LABELS[risk.level]}. Payment subscore ${risk.dimensions.payment.score}, scope subscore ${risk.dimensions.scope.score}, chargeback subscore ${risk.dimensions.chargeback.score}.`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Background ring */}
      <circle
        cx={CX}
        cy={CX}
        r={R}
        fill="none"
        stroke="var(--bg-elevated)"
        strokeWidth={STROKE}
      />
      {/* Weighted arcs */}
      <g transform={`rotate(-90 ${CX} ${CX})`}>
        {arcs.map((arc) => (
          <circle
            key={arc.dim}
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={`${arc.visibleLen} ${C - arc.visibleLen}`}
            strokeDashoffset={arc.offset}
          />
        ))}
      </g>
      {/* Center text */}
      <text
        x={CX}
        y={CX - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          fill: compositeColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {risk.composite}
      </text>
      <text
        x={CX}
        y={CX + 22}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          fill: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {LEVEL_LABELS[risk.level]}
      </text>
    </svg>
  )
}

function LegendRow({
  color,
  label,
  weight,
}: {
  color: string
  label: string
  weight: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '9999px',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{weight}</span>
    </div>
  )
}

function SignalRow({
  signal,
  dimension,
}: {
  signal: RiskSignal
  dimension: RiskDimension
}) {
  const dimColor = RISK_LEVEL_COLORS[levelFromScore(signal.points)]
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        listStyle: 'none',
        padding: '0.25rem 0',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '9999px',
          backgroundColor: dimColor,
          marginTop: '0.4rem',
          flexShrink: 0,
        }}
      />
      <span>
        {humanizeLabel(signal.label)}
        <span
          style={{
            marginLeft: '0.4rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          · {DIMENSION_LABELS[dimension]}
        </span>
      </span>
    </li>
  )
}

export default function ClientBehaviorCard({ risk, clientName }: ClientBehaviorCardProps) {
  const accent = RISK_LEVEL_COLORS[risk.level]
  const top = topSignals(risk, 3)
  const totalPositive = countPositiveSignals(risk)
  const moreCount = Math.max(0, totalPositive - top.length)

  const paymentColor = RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.payment.score)]
  const scopeColor = RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.scope.score)]
  const chargebackColor = RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.chargeback.score)]

  // Prefer the actionable mitigation as the closing CTA. Fall back to the
  // deterministic nextAction sentence (always present) for green / no-lever
  // states.
  const ctaText = risk.topMitigation?.action ?? risk.nextAction

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
        padding: '1.25rem 1.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Client Risk
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
            · {clientName}
          </span>
        </span>
      </div>

      {/* Two-column: donut + content */}
      <div
        style={{
          display: 'flex',
          gap: '1.75rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Left column: donut + weighted legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', flexShrink: 0 }}>
          <Donut risk={risk} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              minWidth: '140px',
            }}
          >
            <LegendRow color={paymentColor} label={DIMENSION_LABELS.payment} weight="40%" />
            <LegendRow color={scopeColor} label={DIMENSION_LABELS.scope} weight="30%" />
            <LegendRow color={chargebackColor} label={DIMENSION_LABELS.chargeback} weight="30%" />
          </div>
        </div>

        {/* Right column: what's driving + action */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {top.length > 0 ? (
            <div>
              <p
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                What&apos;s driving it
              </p>
              <ul style={{ margin: 0, padding: 0 }}>
                {top.map(({ signal, dimension }, i) => (
                  <SignalRow key={`${signal.code}-${i}`} signal={signal} dimension={dimension} />
                ))}
              </ul>
              {moreCount > 0 && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: '0.4rem 0 0 0.625rem',
                  }}
                >
                  +{moreCount} more signal{moreCount === 1 ? '' : 's'}
                </p>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {risk.nextAction}
            </p>
          )}

          {/* CTA — uses topMitigation when present (the actionable one),
              falls back to nextAction for green / no-lever states. */}
          {top.length > 0 && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderLeft: '3px solid var(--brand-lime)',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              {ctaText}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
