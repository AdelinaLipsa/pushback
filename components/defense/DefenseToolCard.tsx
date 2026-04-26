'use client'

import {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt,
  type LucideIcon,
} from 'lucide-react'
import { DefenseToolMeta } from '@/types'
import { URGENCY_COLORS } from '@/lib/defenseTools'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Clock,
  AlertTriangle,
  Ban,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ShieldAlert,
  EyeOff,
  Hourglass,
  Shuffle,
  TrendingDown,
  TrendingUp,
  Zap,
  Copyright,
  CreditCard,
  Eye,
  PackageOpen,
  Star,
  Receipt,
}

interface DefenseToolCardProps {
  tool: DefenseToolMeta
  selected: boolean
  loading: boolean
  onSelect: () => void
}

export default function DefenseToolCard({ tool, selected, loading, onSelect }: DefenseToolCardProps) {
  const colors = URGENCY_COLORS[tool.urgency]
  const Icon = ICON_MAP[tool.icon]

  return (
    <button
      onClick={onSelect}
      title={tool.description}
      style={{
        backgroundColor: selected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: selected ? `2px solid var(--brand-lime)` : `1px solid var(--bg-border)`,
        borderLeft: loading && selected ? `4px solid var(--brand-lime)` : `4px solid ${colors.border}`,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 150ms ease',
        transform: selected ? 'translateY(-1px)' : 'none',
        boxShadow: selected ? `0 4px 20px ${colors.glow}` : 'none',
        animation: loading && selected ? 'limepulse 1.5s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${colors.glow}`
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)'
        }
      }}
    >
      <div style={{ marginBottom: '0.6rem', color: colors.border }}>
        {Icon && <Icon size={20} strokeWidth={1.75} />}
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
        {tool.label}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {tool.description}
      </div>
      {loading && selected && (
        <div style={{ marginTop: '0.75rem', color: 'var(--brand-lime)', fontSize: '0.78rem', fontWeight: 500 }}>
          Writing your message<span className="animate-pulse">…</span>
        </div>
      )}
    </button>
  )
}
