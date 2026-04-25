'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { FlaggedClause } from '@/types'
import { RISK_COLORS_RICH } from '@/lib/ui'

interface ClauseCardProps {
  clause: FlaggedClause
}

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const colors = RISK_COLORS_RICH[clause.risk_level] ?? RISK_COLORS_RICH.medium

  async function handleCopyPushback() {
    try {
      await navigator.clipboard.writeText(clause.pushback_language)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
      borderLeft: `4px solid ${colors.border}`, borderRadius: '0.75rem', overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', textAlign: 'left', gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <span style={{
            backgroundColor: colors.badge, color: colors.badgeText,
            fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
            borderRadius: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          }}>
            {clause.risk_level}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{clause.title}</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {clause.quote && (
            <blockquote style={{
              borderLeft: `3px solid ${colors.border}`, paddingLeft: '0.875rem', margin: 0,
              color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.6,
            }}>
              &ldquo;{clause.quote}&rdquo;
            </blockquote>
          )}

          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>What this means</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{clause.plain_english}</p>
          </div>

          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Why it matters</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{clause.why_it_matters}</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '0.5rem', padding: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>What to say back</p>
              <button
                onClick={handleCopyPushback}
                aria-label="Copy to clipboard"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: copied ? '#84cc16' : 'var(--text-muted)',
                  minHeight: '44px',
                  minWidth: '44px',
                  justifyContent: 'center',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{clause.pushback_language}</p>
          </div>
        </div>
      )}
    </div>
  )
}
