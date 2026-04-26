'use client'

import { useState, useEffect } from 'react'
import {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt, type LucideIcon,
} from 'lucide-react'
import { DefenseToolMeta, RiskLevel } from '@/types'
import { inputStyle } from '@/lib/ui'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt,
}

interface SituationPanelProps {
  tool: DefenseToolMeta
  onGenerate: (situation: string, extraContext: Record<string, string | number>) => void
  onClose: () => void
  loading: boolean
  initialSituation?: string
  initialContextFields?: Record<string, string>
  hasContract?: boolean
  contractRiskLevel?: RiskLevel
}

export default function SituationPanel({ tool, onGenerate, onClose, loading, initialSituation, initialContextFields, hasContract, contractRiskLevel }: SituationPanelProps) {
  const riskDotColor: Record<RiskLevel, string> = {
    low: '#84cc16',
    medium: '#84cc16',
    high: '#f59e0b',
    critical: '#ef4444',
  }

  const [situation, setSituation] = useState(initialSituation ?? '')
  const [extra, setExtra] = useState<Record<string, string>>(initialContextFields ?? {})

  useEffect(() => {
    if (initialContextFields) setExtra(initialContextFields)
  }, [initialContextFields])

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
        borderRadius: '0.875rem', padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(() => { const Icon = ICON_MAP[tool.icon]; return Icon ? <Icon size={16} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} /> : null })()}
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

      {hasContract && contractRiskLevel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', display: 'inline-block', flexShrink: 0, backgroundColor: riskDotColor[contractRiskLevel] ?? '#84cc16' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {contractRiskLevel.charAt(0).toUpperCase() + contractRiskLevel.slice(1)} risk contract loaded
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            What happened?
          </label>
          <textarea
            required
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder={tool.situationPlaceholder ?? 'Describe what happened…'}
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
          {loading ? 'Writing your message…' : 'Write my message →'}
        </button>
      </form>
    </div>
  )
}
