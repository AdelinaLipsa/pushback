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
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
    }}>
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
        {CATEGORIES.map(cat => (
          <CategoryCard key={cat.label} category={cat} onToolClick={handleToolClick} />
        ))}
      </div>

      {pendingTool && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}
          onClick={() => setPendingTool(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderRadius: '1rem', padding: '1.5rem', width: '90vw', maxWidth: '400px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem' }}>Deploy to which project?</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {TOOL_MAP[pendingTool]?.label}
                </p>
              </div>
              <button
                onClick={() => setPendingTool(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProjectSelect(p.id)}
                  style={{
                    backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                    borderRadius: '0.625rem', padding: '0.75rem 1rem', textAlign: 'left',
                    cursor: 'pointer', color: 'var(--text-primary)', transition: 'border-color 120ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-lime)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)' }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.1rem' }}>{p.client_name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
