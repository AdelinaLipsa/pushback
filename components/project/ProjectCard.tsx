import Link from 'next/link'
import { Project } from '@/types'
import { RISK_COLORS } from '@/lib/ui'
import { timeAgo } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const responses = project.defense_responses ?? []
  const lastResponse = responses[0]
  const contract = Array.isArray(project.contracts) ? project.contracts[0] : project.contracts
  const riskLevel = contract?.risk_level
  const riskScore = contract?.risk_score

  const isOverdue =
    project.payment_due_date !== null &&
    project.payment_received_at === null &&
    new Date(project.payment_due_date) < new Date()

  function formatValue() {
    if (!project.project_value) return null
    return `${project.currency} ${Number(project.project_value).toLocaleString()}`
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{
        display: 'block', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: '0.875rem', padding: '1.25rem 1.5rem', textDecoration: 'none', color: 'inherit',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
      className="hover:border-white/20 hover:bg-[#141414]"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{project.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {project.client_name}
            {formatValue() && <span> · {formatValue()}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{
            backgroundColor: project.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
            color: project.status === 'active' ? 'var(--brand-green)' : 'var(--text-muted)',
            fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {project.status}
          </span>
          {riskLevel && (
            <span style={{
              backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${RISK_COLORS[riskLevel]}`,
              color: RISK_COLORS[riskLevel], fontSize: '0.7rem', fontWeight: 600,
              padding: '0.2rem 0.6rem', borderRadius: '9999px',
            }}>
              Risk {riskScore}/10
            </span>
          )}
          {isOverdue && (
            <span style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--urgency-high)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}>
              OVERDUE
            </span>
          )}
        </div>
      </div>

      {lastResponse && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Last: {lastResponse.tool_type.replace(/_/g, ' ')} · {timeAgo(lastResponse.created_at)}
        </div>
      )}

      {!riskLevel && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No contract linked</div>
      )}
    </Link>
  )
}
