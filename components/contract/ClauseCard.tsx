'use client'

import { useState } from 'react'
import { FlaggedClause } from '@/types'

interface ClauseCardProps {
  clause: FlaggedClause
}

const RISK_COLORS: Record<string, { border: string; badge: string; badgeText: string }> = {
  low: { border: 'var(--urgency-low)', badge: 'rgba(107,114,128,0.15)', badgeText: 'var(--urgency-low)' },
  medium: { border: 'var(--urgency-medium)', badge: 'rgba(249,115,22,0.12)', badgeText: 'var(--urgency-medium)' },
  high: { border: 'var(--urgency-high)', badge: 'rgba(239,68,68,0.12)', badgeText: 'var(--urgency-high)' },
  critical: { border: 'var(--urgency-high)', badge: 'var(--urgency-high-dim)', badgeText: 'var(--urgency-high)' },
}

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = RISK_COLORS[clause.risk_level] ?? RISK_COLORS.medium

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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>What to say back</p>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{clause.pushback_language}</p>
          </div>
        </div>
      )}
    </div>
  )
}
