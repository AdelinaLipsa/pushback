'use client'

import { useRouter } from 'next/navigation'
import { Project } from '@/types'
import { RISK_COLORS } from '@/lib/ui'
import { timeAgo } from '@/lib/utils'

interface Props {
  projects: Project[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(34,197,94,0.1)',  color: 'var(--brand-green)' },
  completed: { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: 'var(--urgency-high)' },
}

function formatValue(project: Project) {
  if (!project.project_value) return '—'
  return `${project.currency} ${Number(project.project_value).toLocaleString()}`
}

function paymentCell(project: Project): { label: string; color: string; bold: boolean } {
  if (project.payment_received_at) return { label: 'Paid', color: 'var(--brand-green)', bold: false }
  if (!project.payment_due_date)   return { label: '—',    color: 'var(--text-muted)',   bold: false }
  if (new Date(project.payment_due_date) < new Date())
    return { label: 'Overdue', color: 'var(--urgency-high)', bold: true }
  return {
    label: new Date(project.payment_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: 'var(--text-secondary)',
    bold: false,
  }
}

function lastAction(project: Project) {
  const responses = project.defense_responses ?? []
  if (!responses.length) return '—'
  const last = responses[0]
  return `${last.tool_type.replace(/_/g, ' ')} · ${timeAgo(last.created_at)}`
}

const TH_STYLE: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}

export default function ProjectsTable({ projects }: Props) {
  const router = useRouter()

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
            {['Project', 'Value', 'Status', 'Contract', 'Payment', 'Last action'].map(col => (
              <th key={col} style={TH_STYLE}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project, i) => {
            const contract = Array.isArray(project.contracts) ? project.contracts[0] : project.contracts
            const payment  = paymentCell(project)
            const statusStyle = STATUS_STYLES[project.status] ?? STATUS_STYLES.active

            return (
              <tr
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{
                  borderBottom: i < projects.length - 1 ? '1px solid var(--bg-border)' : undefined,
                  cursor: 'pointer',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{project.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{project.client_name}</div>
                </td>

                <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {formatValue(project)}
                </td>

                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {project.status}
                  </span>
                </td>

                <td style={{ padding: '1rem 1.25rem' }}>
                  {contract?.risk_level ? (
                    <span style={{
                      border: `1px solid ${RISK_COLORS[contract.risk_level]}`,
                      color: RISK_COLORS[contract.risk_level],
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.375rem',
                      whiteSpace: 'nowrap',
                    }}>
                      {contract.risk_score}/10 · {contract.risk_level}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                  )}
                </td>

                <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: payment.color, fontWeight: payment.bold ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {payment.label}
                </td>

                <td style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {lastAction(project)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
