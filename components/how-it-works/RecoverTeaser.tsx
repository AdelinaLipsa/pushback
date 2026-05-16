'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Clock, AlertOctagon } from 'lucide-react'

type Phase = 'idle' | 'building' | 'final'

const DIMENSIONS = [
  { key: 'payment', label: 'Payment', score: 78, color: '#ef4444', delay: 600 },
  { key: 'scope', label: 'Scope', score: 42, color: '#f97316', delay: 1100 },
  { key: 'chargeback', label: 'Chargeback', score: 88, color: '#ef4444', delay: 1600 },
] as const

const COMPOSITE = Math.round(0.4 * 78 + 0.3 * 42 + 0.3 * 88) // 70

export default function RecoverTeaser() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState<Record<string, number>>({ payment: 0, scope: 0, chargeback: 0, composite: 0 })
  const rootRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && phase === 'idle') startCycle()
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function clearAll() {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }

  function startCycle() {
    clearAll()
    setPhase('building')
    setProgress({ payment: 0, scope: 0, chargeback: 0, composite: 0 })

    DIMENSIONS.forEach(d => {
      timeoutsRef.current.push(setTimeout(() => {
        setProgress(p => ({ ...p, [d.key]: d.score }))
      }, d.delay))
    })
    timeoutsRef.current.push(setTimeout(() => {
      setProgress(p => ({ ...p, composite: COMPOSITE }))
      setPhase('final')
    }, 2300))

    // Loop
    timeoutsRef.current.push(setTimeout(() => {
      setPhase('idle')
      setTimeout(() => startCycle(), 200)
    }, 7500))
  }

  useEffect(() => () => clearAll(), [])

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
          pushback / risk engine
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Overdue invoice header */}
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '0.55rem',
          padding: '0.65rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={13} style={{ color: '#ef4444' }} />
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e4e4e7' }}>Novo Digital · €2,400</p>
              <p style={{ fontSize: '0.6rem', color: '#a1a1aa' }}>Invoice 18 days overdue</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0.15rem 0.5rem', borderRadius: '3px',
            color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)',
          }}>Overdue</span>
        </div>

        {/* Composite score */}
        <div style={{ marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <p style={{ fontSize: '0.6rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              Composite risk
            </p>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: progress.composite >= 66 ? '#ef4444' : '#f97316',
              letterSpacing: '-0.04em',
              transition: 'color 0.4s ease',
            }}>
              {progress.composite || '—'}
              <span style={{ fontSize: '0.62rem', color: '#52525b', fontWeight: 500 }}> / 100</span>
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#1a1a1d', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress.composite}%`,
              background: 'linear-gradient(90deg, #f97316, #ef4444)',
              borderRadius: '999px',
              transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>

        {/* Dimensions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.9rem' }}>
          {DIMENSIONS.map(d => (
            <div key={d.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <p style={{ fontSize: '0.66rem', color: '#a1a1aa', fontWeight: 600 }}>{d.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: d.color, fontWeight: 700 }}>
                  {progress[d.key] || 0}
                </p>
              </div>
              <div style={{ height: '4px', backgroundColor: '#15151a', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progress[d.key]}%`,
                  backgroundColor: d.color,
                  borderRadius: '999px',
                  transition: 'width 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Mitigation callout */}
        <div style={{
          backgroundColor: 'rgba(132,204,22,0.06)',
          border: '1px solid rgba(132,204,22,0.22)',
          borderRadius: '0.55rem',
          padding: '0.7rem 0.85rem',
          display: 'flex',
          gap: '0.55rem',
          opacity: phase === 'final' ? 1 : 0,
          transform: phase === 'final' ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <TrendingUp size={13} style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '0.6rem', color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.18rem' }}>
              Highest-leverage move
            </p>
            <p style={{ fontSize: '0.74rem', color: '#e4e4e7', lineHeight: 1.5 }}>
              Compile dispute pack now — chargeback risk drops <strong style={{ color: 'var(--brand-lime)' }}>26 points</strong>.
            </p>
          </div>
        </div>

        {/* Scanning indicator */}
        {phase === 'building' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
            <AlertOctagon size={11} style={{ color: '#f97316' }} />
            <p style={{ fontSize: '0.6rem', color: '#71717a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Computing signals from 12 sent responses + contract gaps
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
