import { CLIENT_RISK_COLORS, type ClientRiskLevel } from '@/lib/clientRisk'

interface ClientRiskBadgeProps {
  score: number
  level: ClientRiskLevel
}

export default function ClientRiskBadge({ score, level }: ClientRiskBadgeProps) {
  const color = CLIENT_RISK_COLORS[level]
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
