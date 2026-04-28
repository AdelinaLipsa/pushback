'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react'
import { detectRedFlags } from '@/lib/api'
import { RedFlagAnalysis, RedFlag, RiskLevel } from '@/types'
import { inputStyle, btnCls } from '@/lib/ui'
import { RISK_COLORS_RICH } from '@/lib/ui'

const PROCEED_CONFIG = {
  yes: { label: 'Safe to proceed', color: 'var(--brand-lime)', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.2)' },
  caution: { label: 'Proceed with caution', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  no: { label: 'Do not accept', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
} as const

const CATEGORY_COLORS: Record<string, { label: string; color: string }> = {
  scope: { label: 'Scope', color: '#a78bfa' },
  payment: { label: 'Payment', color: '#f97316' },
  rights: { label: 'Rights', color: '#ef4444' },
  timeline: { label: 'Timeline', color: '#facc15' },
  client: { label: 'Client', color: '#22d3ee' },
}

function CopyableQuestion({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }
  return (
    <div className="flex items-start gap-2 group">
      <span className="flex-1 text-zinc-300 text-[0.875rem] leading-relaxed">{text}</span>
      <button onClick={handleCopy} className="shrink-0 p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100 bg-transparent border-0 cursor-pointer">
        {copied ? <Check size={13} className="text-brand-lime" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

function FlagCard({ flag }: { flag: RedFlag }) {
  const colors = RISK_COLORS_RICH[flag.severity] ?? RISK_COLORS_RICH.medium
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${colors.border}` }}>
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-[0.06em]" style={{ backgroundColor: colors.badge, color: colors.badgeText }}>
            {flag.severity}
          </span>
          <span className="font-semibold text-[0.9rem] text-zinc-100">{flag.title}</span>
        </div>
        {flag.quote && (
          <blockquote className="pl-3 my-2 m-0 text-zinc-400 text-[0.8rem] italic" style={{ borderLeft: `3px solid ${colors.border}` }}>
            &ldquo;{flag.quote}&rdquo;
          </blockquote>
        )}
        <p className="text-zinc-300 text-[0.875rem] leading-relaxed mt-2 m-0">{flag.what_it_means}</p>
      </div>
      <div className="px-5 py-3 bg-bg-elevated border-t border-bg-border">
        <p className="text-zinc-400 text-[0.65rem] font-bold uppercase tracking-[0.07em] mb-1.5">Ask them:</p>
        <CopyableQuestion text={flag.question_to_ask} />
      </div>
    </div>
  )
}

export default function RedFlagPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedFlagAnalysis | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 20) return
    setLoading(true)
    setResult(null)
    const data = await detectRedFlags(message.trim())
    setLoading(false)
    if (data) setResult(data.analysis)
  }

  const proceedCfg = result ? PROCEED_CONFIG[result.proceed] : null

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Client Red Flag Detector</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Paste a prospect&apos;s first message or project description. We&apos;ll flag warning signs before you commit to anything.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div>
          <div className="flex justify-between mb-1.5">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Prospect message or project description</label>
            <span style={{ fontSize: '0.75rem', color: message.trim().length < 20 ? 'var(--text-muted)' : 'var(--brand-lime)' }}>
              {message.trim().length} chars
            </span>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. 'Hi, we found you on LinkedIn. We're a startup looking to redesign our entire platform — budget is flexible. We need it done quickly and may need ongoing changes after launch. Can you send over some examples and maybe a quick sample of what you'd do for us?'"
            rows={7}
            style={{ ...inputStyle, resize: 'vertical' as const }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
        <button type="submit" disabled={loading || message.trim().length < 20} className={btnCls.primary}>
          {loading ? 'Analyzing…' : 'Detect red flags →'}
        </button>
      </form>

      {result && (
        <div className="flex flex-col gap-6 fade-up">
          {/* Verdict */}
          <div
            className="rounded-xl px-5 py-4 flex items-start gap-3 border"
            style={{ backgroundColor: proceedCfg!.bg, borderColor: proceedCfg!.border }}
          >
            <AlertTriangle size={18} style={{ color: proceedCfg!.color, flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p className="font-bold text-[0.9rem] m-0 mb-1" style={{ color: proceedCfg!.color }}>{proceedCfg!.label}</p>
              <p className="text-zinc-300 text-[0.875rem] m-0">{result.verdict}</p>
            </div>
          </div>

          {/* Red flags */}
          {result.red_flags.length > 0 && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-200 mb-3">
                Red flags ({result.red_flags.length})
              </h3>
              <div className="flex flex-col gap-3">
                {result.red_flags.map((flag, i) => <FlagCard key={i} flag={flag} />)}
              </div>
            </section>
          )}

          {/* Green flags */}
          {result.green_flags.length > 0 && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-200 mb-3">
                Positive signals ({result.green_flags.length})
              </h3>
              <div className="flex flex-col gap-1.5">
                {result.green_flags.map((note, i) => (
                  <div key={i} className="flex items-start gap-3 bg-bg-surface border border-bg-border border-l-[3px] border-l-brand-lime rounded-xl px-4 py-3">
                    <CheckCircle2 size={14} className="text-brand-lime shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-[0.875rem] leading-relaxed">{note}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.red_flags.length === 0 && (
            <p className="text-zinc-400 text-sm">No red flags detected in this message.</p>
          )}
        </div>
      )}
    </div>
  )
}
