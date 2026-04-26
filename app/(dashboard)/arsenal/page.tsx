'use client'

import { useState } from 'react'
import { BookOpen, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert, EyeOff, Hourglass, Shuffle, TrendingDown, Receipt, TrendingUp, Zap, Copyright, CreditCard, Eye, PackageOpen, Star, Layers, Timer, Search } from 'lucide-react'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import type { DefenseToolMeta } from '@/types'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2,
  ShieldAlert, EyeOff, Hourglass, Shuffle, TrendingDown, Receipt,
  TrendingUp, Zap, Copyright, CreditCard, Eye, PackageOpen, Star, Timer,
}

// Distinct accent per group — no gray
const GROUPS: { label: string; color: string; types: string[] }[] = [
  {
    label: 'Payment',
    color: '#f97316',   // orange
    types: ['payment_first', 'payment_second', 'payment_final', 'retroactive_discount', 'chargeback_threat'],
  },
  {
    label: 'Scope & Delivery',
    color: '#84cc16',   // lime
    types: ['scope_change', 'revision_limit', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    label: 'Rates & Fees',
    color: '#eab308',   // amber/gold
    types: ['discount_pressure', 'rate_increase_pushback', 'rush_fee_demand', 'spec_work_pressure'],
  },
  {
    label: 'Communication',
    color: '#06b6d4',   // cyan
    types: ['ghost_client', 'feedback_stall'],
  },
  {
    label: 'Disputes & Legal',
    color: '#ef4444',   // red
    types: ['kill_fee', 'ip_dispute', 'dispute_response', 'review_threat', 'disputed_hours'],
  },
]

// Low → cyan instead of gray
const URGENCY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  low:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   label: 'Low'    },
  medium: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: 'Medium' },
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'High'   },
}

const WHEN_TO_USE: Record<string, string> = {
  payment_first:         'Invoice 0–7 days overdue. Assume oversight — stay friendly, one clear ask.',
  payment_second:        'Invoice 8–14 days overdue. Reference payment terms, state work pauses if not paid.',
  payment_final:         'Invoice 15+ days overdue. Final notice before formal escalation begins.',
  retroactive_discount:  'Work delivered, client now disputes the price. The invoice is not negotiable.',
  chargeback_threat:     'Client threatens a bank dispute after receiving and accepting the work.',
  scope_change:          'Client asks for something outside the agreed brief — even framed as "a small add".',
  revision_limit:        'Client exceeds the agreed revision rounds and expects more for free.',
  moving_goalposts:      'Client approved a direction, then rejects the final result as wrong.',
  post_handoff_request:  'Project closed and files delivered — client wants changes with no new agreement.',
  delivery_signoff:      'Work is done. Get written acceptance before transferring final files.',
  discount_pressure:     'Client counter-offers well below your quoted rate before work begins.',
  rate_increase_pushback:'Existing client resisting or guilting you about a new, higher rate.',
  rush_fee_demand:       "Client needs faster delivery but hasn't offered to pay a rush premium.",
  spec_work_pressure:    'Client asks for free or deeply discounted work in exchange for "exposure".',
  ghost_client:          'Client goes silent mid-project, blocking progress for 5+ business days.',
  feedback_stall:        'Client delays feedback past your agreed window, jeopardising your timeline.',
  kill_fee:              'Client cancels mid-project. Your kill fee clause activates.',
  ip_dispute:            'Client claims ownership of source files, tools, or assets beyond the agreed deliverables.',
  dispute_response:      'Client makes unfair claims or threatens a formal dispute about the work.',
  review_threat:         'Client threatens a negative public review to extract free work or a refund.',
  disputed_hours:        'Client on a T&M contract says your hours are inflated. Use this — not Dispute Response — when the disagreement is specifically about logged time, not quality.',
}

function ToolCard({ tool }: { tool: DefenseToolMeta }) {
  const Icon = ICON_MAP[tool.icon] ?? Layers
  const urgency = URGENCY_STYLE[tool.urgency]

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderLeft: '4px solid var(--bg-border)',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'background-color 150ms ease, border-left-color 150ms ease',
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Icon tinted by urgency */}
          <div style={{
            width: '30px', height: '30px', borderRadius: '0.5rem',
            backgroundColor: urgency.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={14} style={{ color: urgency.color }} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {tool.label}
          </span>
        </div>
        {/* Urgency badge */}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '0.2rem 0.55rem', borderRadius: '9999px', flexShrink: 0,
          backgroundColor: urgency.bg, color: urgency.color,
        }}>
          {urgency.label}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        {tool.description}
      </p>

      {/* When to use */}
      <div style={{
        borderTop: '1px solid var(--bg-border)',
        paddingTop: '0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.35rem',
      }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#84cc16',   // lime instead of gray
        }}>
          When to use
        </span>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {WHEN_TO_USE[tool.type] ?? tool.description}
        </p>
      </div>

      {/* Context field chips — lime tinted */}
      {tool.contextFields.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {tool.contextFields.map(f => (
            <span key={f.key} style={{
              fontSize: '0.65rem',
              color: 'rgba(132,204,22,0.7)',
              backgroundColor: 'rgba(132,204,22,0.07)',
              border: '1px solid rgba(132,204,22,0.18)',
              padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
            }}>
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ArsenalPage() {
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const toolMap = Object.fromEntries(DEFENSE_TOOLS.map(t => [t.type, t]))

  const q = query.trim().toLowerCase()
  const searchResults = q
    ? DEFENSE_TOOLS.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (WHEN_TO_USE[t.type] ?? '').toLowerCase().includes(q)
      )
    : []

  return (
    <div className="p-6 lg:p-8">
      {/* Header + Search */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <BookOpen size={18} style={{ color: '#84cc16' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Arsenal</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '52ch', margin: 0 }}>
            Every situation a freelancer faces — when to use each tool, what it does, and how the AI tailors the message.
          </p>
        </div>

        <div style={{
          position: 'relative', flexShrink: 0,
          width: searchFocused ? '340px' : '220px',
          transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <Search
            size={14}
            style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)',
              color: searchFocused ? 'var(--brand-lime)' : 'var(--text-muted)',
              pointerEvents: 'none', transition: 'color 150ms ease',
            }}
          />
          <input
            type="text"
            placeholder="Search tools…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: '2.25rem', paddingRight: '1rem',
              paddingTop: '0.55rem', paddingBottom: '0.55rem',
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${searchFocused ? 'var(--brand-lime)' : 'var(--bg-border)'}`,
              borderRadius: '0.625rem', fontSize: '0.875rem', color: 'var(--text-primary)',
              outline: 'none', transition: 'border-color 150ms ease',
              boxSizing: 'border-box',
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Search results */}
      {q ? (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{query.trim()}&rdquo;
          </p>
          {searchResults.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No tools match that search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(tool => <ToolCard key={tool.type} tool={tool} />)}
            </div>
          )}
        </div>
      ) : (
        /* Grouped view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {GROUPS.map(group => {
            const tools = group.types.map(t => toolMap[t]).filter(Boolean)
            return (
              <section key={group.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h2 style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: group.color, margin: 0,
                  }}>
                    {group.label}
                  </h2>
                  <div style={{ flex: 1, height: '1px', backgroundColor: group.color, opacity: 0.2 }} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: group.color, opacity: 0.7 }}>
                    {tools.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tools.map(tool => <ToolCard key={tool.type} tool={tool} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
