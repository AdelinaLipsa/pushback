import * as LucideIcons from 'lucide-react'
import { CLIENT_RISK_COLORS, LEVEL_LABELS, type ClientRiskLevel, type ClientRiskSignal } from '@/lib/clientRisk'

interface ClientBehaviorCardProps {
  score: number
  level: ClientRiskLevel
  signals: ClientRiskSignal[]
  clientName: string
}

type IconComponent = React.ComponentType<{ size?: number; color?: string; 'aria-hidden'?: boolean }>

function resolveIcon(name: string): IconComponent | null {
  const lib = LucideIcons as unknown as Record<string, IconComponent>
  return lib[name] ?? null
}

export default function ClientBehaviorCard({ score, level, signals, clientName }: ClientBehaviorCardProps) {
  const accent = CLIENT_RISK_COLORS[level]
  const levelLabel = LEVEL_LABELS[level]

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
      {/* Header row */}
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
            {score}
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

      {/* Signal list */}
      {signals.length > 0 && (
        <div style={{
          marginTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {signals.map((signal, i) => {
            const Icon = resolveIcon(signal.icon)
            return (
              <div
                key={`${signal.icon}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {Icon && (
                  <span style={{ flexShrink: 0, display: 'inline-flex', color: 'var(--text-muted)' }}>
                    <Icon size={14} aria-hidden={true} />
                  </span>
                )}
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: 'var(--text-secondary)',
                }}>
                  {signal.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
