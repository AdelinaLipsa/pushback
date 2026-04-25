'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import CopyButton from '@/components/shared/CopyButton'

interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
  contractClausesUsed?: string[]
}

export default function ResponseOutput({ response, responseId, onRegenerate }: ResponseOutputProps) {
  const [sent, setSent] = useState(false)

  async function handleMarkSent() {
    setSent(true)
    fetch(`/api/responses/${responseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ was_sent: true }),
    }).catch(() => {})
  }

  return (
    <div
      className="response-enter"
      style={{
        backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: '0.875rem', padding: '1.5rem', marginTop: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: 'var(--brand-lime)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Ready to send</span>
        </div>
        <button
          onClick={onRegenerate}
          style={{ background: 'none', border: '1px solid var(--bg-border)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '0.375rem' }}
          className="hover:border-white/20 hover:text-white transition-colors"
        >
          Regenerate
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
        borderRadius: '0.625rem', padding: '1.25rem', marginBottom: '1.25rem',
      }}>
        <pre style={{
          fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
          fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
        }}>
          {response}
        </pre>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CopyButton text={response} responseId={responseId} />
        <button
          onClick={handleMarkSent}
          disabled={sent}
          style={{
            background: 'none',
            border: `1px solid ${sent ? 'var(--brand-green)' : 'var(--bg-border)'}`,
            color: sent ? 'var(--brand-green)' : 'var(--text-secondary)',
            padding: '0.75rem 1.25rem', borderRadius: '0.5rem', cursor: sent ? 'default' : 'pointer',
            fontSize: '0.875rem', fontWeight: 500, transition: 'all 150ms ease',
          }}
        >
          {sent ? 'Marked as sent' : 'Mark as sent'}
        </button>
      </div>
    </div>
  )
}
