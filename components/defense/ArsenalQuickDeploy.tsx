'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt, X, ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { DEFENSE_TOOLS, URGENCY_COLORS } from '@/lib/defenseTools'
import { DefenseTool, DefenseToolMeta } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt,
}

const TOOL_MAP = Object.fromEntries(DEFENSE_TOOLS.map(t => [t.type, t])) as Record<DefenseTool, DefenseToolMeta>

const CATEGORIES: { label: string; types: DefenseTool[] }[] = [
  {
    label: 'Payment',
    types: ['payment_first', 'payment_second', 'payment_final', 'kill_fee', 'retroactive_discount', 'rush_fee_demand'],
  },
  {
    label: 'Scope & Revisions',
    types: ['scope_change', 'revision_limit', 'feedback_stall', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    label: 'Disputes',
    types: ['dispute_response', 'chargeback_threat', 'review_threat', 'ip_dispute'],
  },
  {
    label: 'Client Behaviour',
    types: ['ghost_client', 'discount_pressure', 'rate_increase_pushback', 'spec_work_pressure'],
  },
]

interface ProjectStub {
  id: string
  title: string
  client_name: string
}

interface Props {
  projects: ProjectStub[]
}

function ToolRow({ tool, onClick }: { tool: DefenseToolMeta; onClick: () => void }) {
  const Icon = ICON_MAP[tool.icon]
  const colors = URGENCY_COLORS[tool.urgency]

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        width: '100%',
        padding: '0.5rem 0.625rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0.4rem',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.backgroundColor = 'var(--bg-elevated)'
        el.style.color = 'var(--text-primary)'
        const chevron = el.querySelector('.chevron') as HTMLElement | null
        if (chevron) chevron.style.opacity = '1'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.backgroundColor = 'transparent'
        el.style.color = 'var(--text-secondary)'
        const chevron = el.querySelector('.chevron') as HTMLElement | null
        if (chevron) chevron.style.opacity = '0'
      }}
    >
      {Icon && (
        <Icon size={13} strokeWidth={1.75} style={{ color: colors.border, flexShrink: 0 }} />
      )}
      <span style={{ fontSize: '0.82rem', fontWeight: 500, flex: 1 }}>{tool.label}</span>
      <ChevronRight size={11} className="chevron" style={{ opacity: 0, color: 'var(--text-muted)', transition: 'opacity 120ms ease', flexShrink: 0 }} />
    </button>
  )
}

function CategoryCard({ category, onToolClick }: { category: typeof CATEGORIES[number]; onToolClick: (t: DefenseTool) => void }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderLeft: '4px solid var(--bg-border)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.backgroundColor = 'var(--bg-elevated)'
        el.style.borderLeftColor = 'var(--brand-lime)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.backgroundColor = 'var(--bg-surface)'
        el.style.borderLeftColor = 'var(--bg-border)'
      }}
    >
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {category.label}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {category.types.length}
        </span>
      </div>
      <div style={{ padding: '0.375rem' }}>
        {category.types.map(type => (
          <ToolRow
            key={type}
            tool={TOOL_MAP[type]}
            onClick={() => onToolClick(type)}
          />
        ))}
      </div>
    </div>
  )
}

export default function ArsenalQuickDeploy({ projects }: Props) {
  const router = useRouter()
  const [pendingTool, setPendingTool] = useState<DefenseTool | null>(null)

  function handleToolClick(toolType: DefenseTool) {
    if (projects.length === 0) {
      router.push('/projects/new')
      return
    }
    if (projects.length === 1) {
      router.push(`/projects/${projects[0].id}?tool=${toolType}`)
      return
    }
    setPendingTool(toolType)
  }

  function handleProjectSelect(projectId: string) {
    if (!pendingTool) return
    router.push(`/projects/${projectId}?tool=${pendingTool}`)
    setPendingTool(null)
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat.label} className="fade-up" style={{ animationDelay: `${0.12 + i * 0.07}s` }}>
            <CategoryCard category={cat} onToolClick={handleToolClick} />
          </div>
        ))}
      </div>

      {pendingTool && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(6px)',
          }}
          onClick={() => setPendingTool(null)}
        >
          <div
            style={{
              backgroundColor: '#0d0d10',
              border: '1px solid #222225',
              borderTop: '2px solid #84cc16',
              borderRadius: '0.875rem',
              width: '90vw', maxWidth: '420px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #1c1c1f',
            }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f4f4f5', letterSpacing: '-0.01em' }}>
                  Which project?
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', backgroundColor: '#84cc16', flexShrink: 0,
                  }} />
                  <p style={{ fontSize: '0.75rem', color: '#52525b' }}>
                    {TOOL_MAP[pendingTool]?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingTool(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#52525b', padding: '0.125rem', lineHeight: 1,
                  transition: 'color 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#52525b' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Project list */}
            <div style={{ padding: '0.75rem' }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProjectSelect(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.875rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    borderLeft: '3px solid transparent',
                    borderRadius: '0.5rem', textAlign: 'left',
                    cursor: 'pointer', transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = '#111114'
                    el.style.borderColor = '#2a2a2e'
                    el.style.borderLeftColor = '#84cc16'
                    const arrow = el.querySelector('.arrow') as HTMLElement | null
                    if (arrow) arrow.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = 'transparent'
                    el.style.borderColor = 'transparent'
                    el.style.borderLeftColor = 'transparent'
                    const arrow = el.querySelector('.arrow') as HTMLElement | null
                    if (arrow) arrow.style.opacity = '0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e4e4e7' }}>{p.title}</div>
                    <div style={{ color: '#52525b', fontSize: '0.75rem', marginTop: '0.15rem' }}>{p.client_name}</div>
                  </div>
                  <ChevronRight size={14} className="arrow" style={{ opacity: 0, color: '#84cc16', flexShrink: 0, transition: 'opacity 150ms ease' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
