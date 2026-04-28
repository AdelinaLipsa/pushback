'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QuotaBarProps {
  plan: 'free' | 'pro'
  responsesUsed: number
  responsesLimit: number
  contractsUsed: number
  contractsLimit: number | null // null = unlimited
}

function barColor(pct: number): string {
  if (pct >= 1) return '#ef4444'
  if (pct >= 0.8) return '#f59e0b'
  return '#84cc16'
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const [width, setWidth] = useState(0)
  const pct = limit === null ? 0 : Math.min(used / limit, 1)
  const color = limit === null ? '#84cc16' : barColor(pct)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct * 100), 80)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {used}{limit !== null ? ` / ${limit}` : ' used'}
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '9999px', backgroundColor: 'var(--bg-border)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            backgroundColor: color,
            borderRadius: '9999px',
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  )
}

export default function QuotaBar({ plan, responsesUsed, responsesLimit, contractsUsed, contractsLimit }: QuotaBarProps) {
  const responsesPct = Math.min(responsesUsed / responsesLimit, 1)

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '0.75rem',
      padding: '0.875rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        Usage
      </span>

      <UsageBar label="AI actions" used={responsesUsed} limit={responsesLimit} />
      <UsageBar label="Contract analyses" used={contractsUsed} limit={contractsLimit} />

      {plan === 'free' && responsesPct >= 0.6 && (
        <Link
          href="/settings?upgrade=1"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '0.375rem 0.75rem',
            backgroundColor: 'rgba(132,204,22,0.08)',
            border: '1px solid rgba(132,204,22,0.25)',
            borderRadius: '0.375rem',
            color: 'var(--brand-lime)',
            fontSize: '0.72rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 150ms ease',
          }}
          className="hover:opacity-80"
        >
          Upgrade to Pro
        </Link>
      )}

      {plan === 'pro' && (
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {responsesLimit} responses &middot; {contractsLimit ?? '∞'} analyses per period
        </span>
      )}
    </div>
  )
}
