'use client'

import { useState } from 'react'
import { DefenseToolMeta } from '@/types'
import { inputStyle } from '@/lib/ui'

interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
  initialSituation?: string
}

export default function SituationPanel({ tool, onGenerate, onClose, loading, initialSituation }: SituationPanelProps) {
  const [situation, setSituation] = useState(initialSituation ?? '')
  const [extra, setExtra] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const extraContext: Record<string, string | number> = {}
    tool.contextFields.forEach(field => {
      if (extra[field.key]) {
        extraContext[field.key] = field.type === 'number' ? Number(extra[field.key]) : extra[field.key]
      }
    })
    onGenerate(situation, extraContext)
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
          <span style={{ fontSize: '1.2rem' }}>{tool.icon}</span>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{tool.label}</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0.25rem' }}
          className="hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            Describe what&apos;s happening
          </label>
          <textarea
            required
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="e.g. Client just emailed asking to add a mobile app to the website project, same budget..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>

        {tool.contextFields.map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              {field.label}
            </label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={extra[field.key] ?? ''}
              onChange={e => setExtra(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || !situation.trim()}
          style={{
            backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 700,
            padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
            cursor: loading || !situation.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem', opacity: loading || !situation.trim() ? 0.6 : 1,
            marginTop: '0.25rem',
          }}
        >
          {loading ? 'Writing your message…' : 'Generate Message →'}
        </button>
      </form>
    </div>
  )
}
