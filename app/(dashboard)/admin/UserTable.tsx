'use client'

import { useTransition } from 'react'
import { setPlan, resetPeriodUsage, deleteUser } from './actions'
import { PLANS } from '@/lib/plans'

type Profile = {
  id: string
  email: string
  plan: string
  period_responses_used: number
  period_contracts_used: number
  defense_responses_used: number
  contracts_used: number
  created_at: string | null
}

function ActionButton({
  onClick,
  pending,
  children,
  danger,
}: {
  onClick: () => void
  pending: boolean
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 6,
        border: danger ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--bg-border)',
        background: danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)',
        color: danger ? '#ef4444' : 'var(--text-muted)',
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.5 : 1,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </button>
  )
}

export function UserTable({ profiles }: { profiles: Profile[] }) {
  const [pending, startTransition] = useTransition()

  function handleSetPlan(userId: string, currentPlan: string) {
    const next = currentPlan === 'pro' ? 'free' : 'pro'
    startTransition(() => setPlan(userId, next))
  }

  function handleResetUsage(userId: string) {
    startTransition(() => resetPeriodUsage(userId))
  }

  function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete ${email}? This removes all their data permanently.`)) return
    startTransition(() => deleteUser(userId))
  }

  return (
    <div className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden" style={{ animationDelay: '120ms' }}>
      <div className="px-5 py-4 border-b border-bg-border">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400">
          All users ({profiles.length})
        </h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="px-5 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Email</th>
            <th className="px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Plan</th>
            <th className="px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Period usage</th>
            <th className="px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Joined</th>
            <th className="px-4 py-2.5 text-right text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p, i) => {
            const planLimits = p.plan === 'pro' ? PLANS.pro : PLANS.free
            const joined = p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'
            return (
              <tr key={p.id} className={i < profiles.length - 1 ? 'border-b border-bg-border' : ''}>
                <td className="px-5 py-3 text-text-secondary text-xs truncate max-w-[200px]">{p.email}</td>
                <td className="px-4 py-3">
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 999,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    background: p.plan === 'pro' ? 'rgba(132,204,22,0.15)' : 'var(--bg-elevated)',
                    color: p.plan === 'pro' ? '#84cc16' : 'var(--text-muted)',
                  }}>
                    {p.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-[0.7rem] text-text-muted whitespace-nowrap">
                  {p.period_responses_used}/{planLimits.defense_responses} msg
                  {' · '}
                  {p.period_contracts_used}/{planLimits.contracts} analyses
                </td>
                <td className="px-4 py-3 text-[0.7rem] text-text-muted whitespace-nowrap">{joined}</td>
                <td className="px-4 py-3">
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <ActionButton pending={pending} onClick={() => handleSetPlan(p.id, p.plan)}>
                      {p.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
                    </ActionButton>
                    <ActionButton pending={pending} onClick={() => handleResetUsage(p.id)}>
                      Reset usage
                    </ActionButton>
                    <ActionButton pending={pending} danger onClick={() => handleDelete(p.id, p.email)}>
                      Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
