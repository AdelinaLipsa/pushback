'use client'

import { useState } from 'react'
import { DefenseResponse } from '@/types'
import CopyButton from '@/components/shared/CopyButton'

interface ResponseHistoryProps {
  responses: DefenseResponse[]
  lockedCount: number
}

const TOOL_LABELS: Record<string, string> = {
  scope_change: 'Scope Change',
  payment_first: 'Payment Reminder',
  payment_second: 'Payment Follow-Up',
  payment_final: 'Final Payment Notice',
  revision_limit: 'Revision Limit',
  kill_fee: 'Kill Fee',
  delivery_signoff: 'Delivery Sign-Off',
  dispute_response: 'Dispute Response',
}

export default function ResponseHistory({ responses, lockedCount }: ResponseHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  async function handleUpgrade() {
    setUpgradeLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setUpgradeLoading(false)
    }
  }

  if (responses.length === 0 && lockedCount === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No messages generated yet.</p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {responses.map((r) => (
        <div
          key={r.id}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                {TOOL_LABELS[r.tool_type] ?? r.tool_type}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {new Date(r.created_at).toLocaleDateString()} · {r.was_sent ? '✓ Sent' : r.was_copied ? '✓ Copied' : 'Not sent'}
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{expanded === r.id ? '▲' : '▼'}</span>
          </button>

          {expanded === r.id && (
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <pre style={{
                fontFamily: 'var(--font-mono), monospace', fontSize: '0.8rem', lineHeight: 1.7,
                color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
                borderRadius: '0.5rem', padding: '1rem', margin: '0 0 1rem',
              }}>
                {r.response}
              </pre>
              <CopyButton text={r.response} responseId={r.id} />
            </div>
          )}
        </div>
      ))}

      {lockedCount > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
            padding: '1.5rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {lockedCount} response{lockedCount === 1 ? '' : 's'} hidden — Upgrade to Pro
          </span>
          <button
            onClick={handleUpgrade}
            disabled={upgradeLoading}
            style={{
              backgroundColor: 'var(--brand-amber)',
              color: '#0a0a0a',
              fontWeight: 700,
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: upgradeLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: upgradeLoading ? 0.7 : 1,
            }}
          >
            {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
          </button>
        </div>
      )}
    </div>
  )
}
