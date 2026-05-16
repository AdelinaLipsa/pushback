'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

const MESSAGE = `Hi! Pre-revenue startup here — need a full brand identity, website, and templates. Budget is flexible. Need it in 2 weeks. Can you send some sample designs first so we can see your style?`

const FLAGS = [
  { severity: 'high', title: 'Budget deflection', quote: 'Budget is flexible', delay: 800 },
  { severity: 'critical', title: 'Spec work request', quote: 'send some sample designs first', delay: 1500 },
  { severity: 'medium', title: 'Unrealistic timeline', quote: 'Need it in 2 weeks', delay: 2200 },
] as const

const SEV_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  medium:   { color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
} as const

export default function VetTeaser() {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'flagged'>('idle')
  const [shown, setShown] = useState<number>(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && phase === 'idle') {
          startCycle()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }

  function startCycle() {
    clearAllTimeouts()
    setShown(0)
    setPhase('scanning')
    FLAGS.forEach((flag, i) => {
      timeoutsRef.current.push(setTimeout(() => setShown(i + 1), flag.delay))
    })
    timeoutsRef.current.push(setTimeout(() => setPhase('flagged'), FLAGS[FLAGS.length - 1].delay + 200))
    // Loop after a pause
    timeoutsRef.current.push(setTimeout(() => {
      setPhase('idle')
      setShown(0)
      setTimeout(() => startCycle(), 200)
    }, FLAGS[FLAGS.length - 1].delay + 5000))
  }

  useEffect(() => () => clearAllTimeouts(), [])

  return (
    <div
      ref={rootRef}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '0.9rem',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Window chrome */}
      <div style={{ padding: '0.6rem 0.9rem', borderBottom: '1px solid var(--bg-border)', backgroundColor: '#08080a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.6 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.6 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.6 }} />
        </div>
        <div style={{ flex: 1, fontSize: '0.55rem', color: '#52525b', fontFamily: 'var(--font-mono)', textAlign: 'center', letterSpacing: '0.06em' }}>
          pushback / red-flag detector
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem' }}>
        {/* Input */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#52525b', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.4rem' }}>
            Prospect message
          </p>
          <div style={{
            backgroundColor: '#0a0a0c',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.5rem',
            padding: '0.75rem 0.9rem',
            fontSize: '0.74rem',
            color: '#a1a1aa',
            lineHeight: 1.65,
            fontFamily: 'var(--font-mono)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <span>{MESSAGE}</span>
            {phase === 'scanning' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(132,204,22,0.10) 50%, transparent 100%)',
                animation: 'vet-scan 1.6s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', minHeight: '1.3rem' }}>
          {phase === 'scanning' && shown < FLAGS.length && (
            <>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--brand-lime)',
                    animation: `vet-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <p style={{ fontSize: '0.6rem', color: '#71717a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Scanning for warning patterns
              </p>
            </>
          )}
          {phase === 'flagged' && (
            <>
              <ShieldAlert size={13} style={{ color: '#ef4444' }} />
              <p style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                3 red flags · Do not accept
              </p>
            </>
          )}
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '170px' }}>
          {FLAGS.map((flag, i) => {
            const visible = i < shown
            const cfg = SEV_CFG[flag.severity]
            return (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: `1px solid ${cfg.color}33`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: '0.45rem',
                  padding: '0.55rem 0.75rem',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                  <AlertTriangle size={11} style={{ color: cfg.color }} />
                  <span style={{
                    fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                    padding: '0.1rem 0.35rem', borderRadius: '3px',
                    color: cfg.color, backgroundColor: cfg.bg,
                  }}>{flag.severity}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>{flag.title}</span>
                </div>
                <p style={{ fontSize: '0.66rem', color: '#71717a', fontStyle: 'italic', paddingLeft: '1.2rem' }}>
                  &ldquo;{flag.quote}&rdquo;
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes vet-scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes vet-dot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
