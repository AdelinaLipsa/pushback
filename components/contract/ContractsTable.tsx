'use client'

import { useRouter } from 'next/navigation'
import { Contract } from '@/types'
import { RISK_COLORS } from '@/lib/ui'

interface Props {
  contracts: Contract[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  analyzed: { bg: 'rgba(34,197,94,0.1)',  color: 'var(--brand-green)',  label: 'Analyzed' },
  pending:  { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)',   label: 'Analyzing…' },
  error:    { bg: 'rgba(239,68,68,0.1)', color: 'var(--urgency-high)', label: 'Error' },
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

export default function ContractsTable({ contracts }: Props) {
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
            {['Contract', 'Project', 'Risk', 'Status', 'Date'].map(col => (
              <th key={col} style={TH_STYLE}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract, i) => {
            const statusStyle = STATUS_STYLES[contract.status] ?? STATUS_STYLES.pending

            return (
              <tr
                key={contract.id}
                onClick={() => router.push(`/contracts/${contract.id}`)}
                style={{
                  borderBottom: i < contracts.length - 1 ? '1px solid var(--bg-border)' : undefined,
                  cursor: 'pointer',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{contract.title}</div>
                  {contract.original_filename && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{contract.original_filename}</div>
                  )}
                </td>

                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {contract.projects?.title ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>

                <td style={{ padding: '1rem 1.25rem' }}>
                  {contract.risk_level ? (
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
                    {statusStyle.label}
                  </span>
                </td>

                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
