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

// One-sentence plain-English explanation per signal code. Answers "why does
// this matter for me as a freelancer?" so the user isn't decoding category
// labels like "no_kill_fee_clause" mentally. Codes not in this map fall back
// to no description (the label itself is the explanation in those cases —
// e.g. "Payment 5 days late" is self-evident).
const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  // Contract gaps — payment dimension
  no_late_fee_clause:
    "Your contract doesn't define what the client owes you when payment is late.",
  no_kill_fee_clause:
    'No agreed payout if the client cancels mid-project — you absorb the loss.',
  no_payment_schedule:
    'The entire fee depends on final approval; no milestone payments to fall back on.',
  // Contract gaps — scope dimension
  no_scope_clause:
    "Work scope isn't legally defined — scope creep has no contractual stop sign.",
  no_revision_cap:
    'No agreed limit on revisions — every "small tweak" is binding.',
  // Payment lateness (label already says how many days — these add behavioural read)
  late_severe: 'Sustained non-payment — usually a recovery problem, not a billing one.',
  late_moderate: 'Payment is past due and may indicate a stalling pattern.',
  late_minor: 'Just over the due date — most clients self-correct within a few days.',
  on_time: 'Client paid before the due date — they value the working relationship.',
  // Behavioural patterns
  partial_payment_pressure:
    "You've sent multiple cadence reminders — this client typically requires chasing.",
  // Chargeback risk patterns
  silence_14d:
    'Client has gone silent after recent activity — common precursor to a chargeback.',
  no_signoff_on_delivery:
    'Client engaged after delivery but never signed off — disputes love this ambiguity.',
  // Defensive messages sent (these reflect YOUR posture, not the client's behaviour)
  chargeback_threat_sent: 'You sent a chargeback-threat response — situation has escalated.',
  dispute_response_sent: 'You sent a dispute-response — actively defending against a claim.',
  review_threat_sent: 'You sent a review-threat response — reputational pressure in play.',
  scope_change_sent: 'You sent a scope-change pushback — client tried to expand the work.',
  revision_pressure_sent: 'You sent a revision-limit response — client wanted more rounds.',
  goalpost_shift_sent:
    "You sent a moving-goalposts response — client changed what 'done' means.",
  post_handoff_request_sent:
    'You sent a post-handoff pushback — client asked for work after sign-off.',
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

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
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
      <span>{label}</span>
    </div>
  )
}

function SignalRow({
  signal,
  dimension,
  dimensionLevelColor,
}: {
  signal: RiskSignal
  dimension: RiskDimension
  dimensionLevelColor: string
}) {
  // Dot tracks the DIMENSION's overall colour, not the signal's individual
  // points. Otherwise every low-point signal renders green even when the
  // dimension itself is orange/red — visually contradicts the donut.
  const dimColor = dimensionLevelColor
  const description = SIGNAL_DESCRIPTIONS[signal.code]
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        listStyle: 'none',
        padding: '0.5rem 0',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '9999px',
          backgroundColor: dimColor,
          marginTop: '0.45rem',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {humanizeLabel(signal.label)}
          <span
            style={{
              marginLeft: '0.5rem',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {DIMENSION_LABELS[dimension]}
          </span>
        </span>
        {description && (
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </span>
        )}
      </div>
    </li>
  )
}

export default function ClientBehaviorCard({ risk, clientName }: ClientBehaviorCardProps) {
  const accent = RISK_LEVEL_COLORS[risk.level]
  const top = topSignals(risk, 3)
  const totalPositive = countPositiveSignals(risk)
  const moreCount = Math.max(0, totalPositive - top.length)

  const dimensionColors: Record<RiskDimension, string> = {
    payment: RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.payment.score)],
    scope: RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.scope.score)],
    chargeback: RISK_LEVEL_COLORS[levelFromScore(risk.dimensions.chargeback.score)],
  }

  // Prefer the actionable mitigation when one is computed. When the level is
  // green AND there are still positive-points signals (e.g. contract gaps on a
  // healthy project), the generic "no action needed" verdict contradicts the
  // signal list — fall through to a constructive sentence instead.
  const ctaText =
    risk.topMitigation?.action ??
    (risk.level === 'green' && top.length > 0
      ? 'Address the items above to harden your contract template — protects every future project, not just this one.'
      : risk.nextAction)

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
            <LegendRow color={dimensionColors.payment} label={DIMENSION_LABELS.payment} />
            <LegendRow color={dimensionColors.scope} label={DIMENSION_LABELS.scope} />
            <LegendRow color={dimensionColors.chargeback} label={DIMENSION_LABELS.chargeback} />
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
                  <SignalRow
                    key={`${signal.code}-${i}`}
                    signal={signal}
                    dimension={dimension}
                    dimensionLevelColor={dimensionColors[dimension]}
                  />
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
