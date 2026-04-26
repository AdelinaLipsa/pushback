'use client'

import { TrendingDown, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RiskSignal, ReplyThread } from '@/types'
import CopyButton from '@/components/shared/CopyButton'

// 999.1 D-05/D-06: stance → icon + label + color (per UI-SPEC §5).
const SIGNAL_ICON: Record<RiskSignal, LucideIcon> = {
  backing_down: TrendingDown,
  doubling_down: TrendingUp,
  escalating: AlertTriangle,
  unclear: HelpCircle,
}

const SIGNAL_LABEL: Record<RiskSignal, string> = {
  backing_down: 'Backing down',
  doubling_down: 'Doubling down',
  escalating: 'Escalating',
  unclear: 'Unclear',
}

const SIGNAL_COLOR: Record<RiskSignal, string> = {
  backing_down: 'var(--brand-lime)',
  doubling_down: 'var(--urgency-medium)',
  escalating: 'var(--urgency-high)',
  unclear: 'var(--urgency-medium)',
}

interface ReplyThreadCardProps {
  thread: Pick<ReplyThread, 'risk_signal' | 'signal_explanation' | 'follow_up'>
}

export default function ReplyThreadCard({ thread }: ReplyThreadCardProps) {
  const Icon = SIGNAL_ICON[thread.risk_signal]
  const label = SIGNAL_LABEL[thread.risk_signal]
  const color = SIGNAL_COLOR[thread.risk_signal]

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: '0.5rem',
        padding: '1rem 1.25rem',
        marginTop: '0.75rem',
      }}
    >
      {/* Stance icon + label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={16} color={color} aria-hidden={true} />
        <span style={{ color, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>
          {label}
        </span>
      </div>

      {/* Explanation */}
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        {thread.signal_explanation}
      </p>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--bg-border)',
          margin: '12px 0',
        }}
      />

      {/* Follow-up pre block */}
      <pre
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '0.8rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--bg-border)',
          borderRadius: '0.5rem',
          padding: '1rem',
          margin: '0 0 1rem',
        }}
      >
        {thread.follow_up}
      </pre>

      <CopyButton text={thread.follow_up} label="Copy Follow-Up" />
    </div>
  )
}
