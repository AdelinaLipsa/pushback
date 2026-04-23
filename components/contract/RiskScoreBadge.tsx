import { RiskLevel } from '@/types'

interface RiskScoreBadgeProps {
  score: number
  level: RiskLevel
}

const LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'rgba(34,197,94,0.1)', text: 'var(--brand-green)', border: 'var(--brand-green)' },
  medium: { bg: 'rgba(249,115,22,0.1)', text: 'var(--urgency-medium)', border: 'var(--urgency-medium)' },
  high: { bg: 'rgba(239,68,68,0.1)', text: 'var(--urgency-high)', border: 'var(--urgency-high)' },
  critical: { bg: 'var(--urgency-high-dim)', text: 'var(--urgency-high)', border: 'var(--urgency-high)' },
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical',
}

export default function RiskScoreBadge({ score, level }: RiskScoreBadgeProps) {
  const colors = LEVEL_COLORS[level]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
      backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: '0.625rem', padding: '0.6rem 1rem',
    }}>
      <span style={{ fontWeight: 800, fontSize: '1.5rem', color: colors.text }}>{score}/10</span>
      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: colors.text }}>{LEVEL_LABEL[level]}</span>
    </div>
  )
}
