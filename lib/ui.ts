import type React from 'react'

export const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
  marginBottom: '0.5rem',
}

// Tailwind class strings — use className={btnCls.x} for proper hover/focus/disabled states.
export const btnCls = {
  primary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-lime text-[#0a0a0a] text-sm font-bold rounded-lg border-0 cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-bg-border text-text-muted text-sm rounded-lg cursor-pointer transition-all duration-150 hover:border-white/20 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 bg-transparent border-0 text-text-muted text-sm cursor-pointer transition-colors duration-150 hover:text-text-primary disabled:opacity-50',
  destructive:
    'inline-flex items-center justify-center gap-2 px-4 py-2 bg-urgency-high-dim border border-urgency-high text-urgency-high text-sm font-bold rounded-lg cursor-pointer transition-all duration-150 hover:bg-urgency-high/20 disabled:opacity-50 disabled:cursor-not-allowed',
}

// Legacy inline-style objects — kept for components not yet migrated to Tailwind.
export const btnStyles = {
  primary: {
    backgroundColor: 'var(--brand-lime)',
    color: '#0a0a0a',
    fontWeight: 700,
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.9rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  ghost: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    padding: '0.5rem 0.75rem',
  } as React.CSSProperties,
  outline: {
    background: 'none',
    border: '1px solid var(--bg-border)',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  destructive: {
    backgroundColor: 'var(--urgency-high-dim)',
    border: '1px solid var(--urgency-high)',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    color: 'var(--urgency-high)',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
}

export const dialogContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.875rem',
  padding: '1.5rem',
  maxWidth: '440px',
  width: '100%',
}

// Canonical risk-level color map — import this instead of redefining per component
export const RISK_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
}

// Rich variant for ClauseCard-style badge rendering
export const RISK_COLORS_RICH: Record<string, { border: string; badge: string; badgeText: string }> = {
  high: { border: '#ef4444', badge: 'rgba(239,68,68,0.12)', badgeText: '#ef4444' },
  medium: { border: '#f97316', badge: 'rgba(249,115,22,0.12)', badgeText: '#f97316' },
  low: { border: '#22c55e', badge: 'rgba(34,197,94,0.12)', badgeText: '#22c55e' },
}
