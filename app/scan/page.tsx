'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import type { RedFlagAnalysis, RedFlag } from '@/types'
import Footer from '@/components/shared/Footer'

const PROCEED_CONFIG = {
  yes: { label: 'Safe to proceed', color: '#84cc16', bg: 'rgba(132,204,22,0.08)', border: 'rgba(132,204,22,0.22)' },
  caution: { label: 'Proceed with caution', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.22)' },
  no: { label: 'Do not accept', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
} as const

const SEVERITY_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '#ef4444' },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: '#ef4444' },
  medium:   { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: '#f97316' },
  low:      { color: '#a3a3a3', bg: 'rgba(163,163,163,0.08)', border: '#3f3f46' },
} as const

const SAMPLE = `Hi! We found you on LinkedIn — love your work. We're a pre-revenue startup and need a full brand identity, website, and social media templates. Budget is flexible for the right person. We need it pretty fast — maybe 2 weeks? Also, can you send us a few sample designs first so we can see if we like your style before we commit? We'll need to run everything by our investors before signing anything.`

function FlagCard({ flag }: { flag: RedFlag }) {
  const cfg = SEVERITY_CFG[flag.severity] ?? SEVERITY_CFG.medium
  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderLeft: `4px solid ${cfg.border}`, borderRadius: '0.75rem', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.color, backgroundColor: cfg.bg }}>
            {flag.severity}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{flag.title}</span>
        </div>
        {flag.quote && (
          <blockquote style={{ paddingLeft: '0.75rem', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', borderLeft: `3px solid ${cfg.border}` }}>
            &ldquo;{flag.quote}&rdquo;
          </blockquote>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, marginTop: '0.5rem' }}>{flag.what_it_means}</p>
      </div>
      <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Ask them</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{flag.question_to_ask}</p>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedFlagAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 20) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/public/red-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError("You've used all 3 free scans for today. Sign up free to keep going — no card required.")
        } else {
          setError(data.error ?? 'Something went wrong. Try again in a moment.')
        }
        return
      }
      setResult(data.analysis)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const proceedCfg = result ? PROCEED_CONFIG[result.proceed] : null

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Lightweight nav */}
      <nav style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', textDecoration: 'none' }}>
          pushback<span style={{ color: 'var(--brand-lime)' }}>.</span>
        </Link>
        <Link href="/signup" style={{ backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', padding: '0.45rem 1.1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '-0.01em' }} className="hover:opacity-90 transition-opacity">
          Try free →
        </Link>
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Hero */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.875rem' }}>
            Free tool · no signup
          </p>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '1rem' }}>
            Scan a prospect&apos;s message<br />for red flags.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.65, maxWidth: '54ch' }}>
            Paste a client&apos;s first email, project brief, or kickoff message. Pushback flags warning signs — scope creep risk, payment risk, IP grabs, ghosting patterns — before you reply. 3 free scans per day. No account needed.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Their message</label>
              <button
                type="button"
                onClick={() => setMessage(SAMPLE)}
                style={{ background: 'none', border: 'none', color: 'var(--brand-lime)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Use a sample →
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Paste the message a prospect sent you — their first email, project brief, kickoff DM, anything."
              rows={8}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '0.6rem',
                padding: '0.875rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'vertical' as const,
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', color: message.trim().length < 20 ? 'var(--text-muted)' : 'var(--brand-lime)' }}>
                {message.trim().length} / 8000
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || message.trim().length < 20}
            style={{
              backgroundColor: loading || message.trim().length < 20 ? 'rgba(132,204,22,0.4)' : 'var(--brand-lime)',
              color: '#0a0a0a',
              padding: '0.85rem 1.5rem',
              borderRadius: '0.55rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              cursor: loading || message.trim().length < 20 ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Scanning…' : 'Scan for red flags →'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '0.6rem',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}>
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && proceedCfg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: proceedCfg.bg, border: `1px solid ${proceedCfg.border}`, borderRadius: '0.75rem', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              {result.proceed === 'yes' ? <ShieldCheck size={20} style={{ color: proceedCfg.color, flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={20} style={{ color: proceedCfg.color, flexShrink: 0, marginTop: '2px' }} />}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: proceedCfg.color }}>{proceedCfg.label}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{result.verdict}</p>
              </div>
            </div>

            {result.red_flags.length > 0 && (
              <section>
                <h2 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
                  Red flags ({result.red_flags.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.red_flags.map((flag, i) => <FlagCard key={i} flag={flag} />)}
                </div>
              </section>
            )}

            {result.green_flags.length > 0 && (
              <section>
                <h2 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
                  Positive signals ({result.green_flags.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.green_flags.map((note, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderLeft: '3px solid var(--brand-lime)', borderRadius: '0.6rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{note}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.red_flags.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No red flags detected in this message.</p>
            )}

            {/* Watermark + CTA */}
            <div style={{
              marginTop: '1rem',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(132,204,22,0.2)',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.2rem' }}>This is one tool of four.</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55, maxWidth: '46ch' }}>
                  Sign up free to also analyze contracts for hidden risk, draft replies to difficult clients across 23 situations, and track overdue payments.
                </p>
              </div>
              <Link
                href="/signup"
                style={{
                  backgroundColor: 'var(--brand-lime)',
                  color: '#0a0a0a',
                  padding: '0.7rem 1.3rem',
                  borderRadius: '0.55rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
                className="hover:opacity-90 transition-opacity"
              >
                Start free →
              </Link>
            </div>
          </div>
        )}

        {/* Empty state CTA when no result yet */}
        {!result && !error && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
            <p>3 scans per IP per 24 hours. Need unlimited? <Link href="/signup" style={{ color: 'var(--brand-lime)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Sign up free</Link>.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
