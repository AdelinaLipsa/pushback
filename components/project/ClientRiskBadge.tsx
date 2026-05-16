import { RISK_LEVEL_COLORS, type RiskLevel } from '@/lib/risk'

interface ClientRiskBadgeProps {
  score: number
  level: RiskLevel
}

export default function ClientRiskBadge({ score, level }: ClientRiskBadgeProps) {
  const color = RISK_LEVEL_COLORS[level]
  return (
    <span style={{
      backgroundColor: 'rgba(0,0,0,0.3)',
      border: `1px solid ${color}`,
      color,
      fontSize: '0.7rem',
      fontWeight: 600,
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
    }}>
      Client {score}
    </span>
  )
}
