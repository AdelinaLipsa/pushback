'use client'

import { useEffect, useRef, useState } from 'react'

const CONTRACT_CLAUSE = '...Contractor waives all rights to claim additional compensation beyond the fixed fee, including overtime or revision fees regardless of scope changes...'
const RESPONSE_TEXT = 'I appreciate you raising this. My rate reflects the full scope as outlined — revisions beyond two rounds or scope changes outside the original brief are billed separately at my standard rate. Happy to clarify the project boundaries if helpful.'
const RISK_SCORE = '8/10'
const ACTIVE_TOOL_LABEL = 'Rate Negotiation'
const STEP_LABELS = {
  idle: '',
  pasting: 'Paste your contract',
  analyzing: 'Instant risk analysis',
  selecting: 'Pick your situation',
  responding: 'Send it. Done.',
} as const
type Step = keyof typeof STEP_LABELS

export default function DemoAnimation() {
  const [step, setStep] = useState<Step>('idle')
  const [typedClause, setTypedClause] = useState('')
  const [typedResponse, setTypedResponse] = useState('')
  const [entered, setEntered] = useState(false)
  const timers = useRef<{ t?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({})

  function beginStep(next: Step) {
    if (timers.current.t) clearTimeout(timers.current.t)
    if (timers.current.interval) clearInterval(timers.current.interval)
    setStep(next)

    if (next === 'pasting') {
      setTypedClause('')
      let i = 0
      timers.current.interval = setInterval(() => {
        i++
        setTypedClause(CONTRACT_CLAUSE.slice(0, i))
        if (i >= CONTRACT_CLAUSE.length) {
          clearInterval(timers.current.interval)
          timers.current.t = setTimeout(() => beginStep('analyzing'), 600)
        }
      }, 28)
    } else if (next === 'analyzing') {
      timers.current.t = setTimeout(() => beginStep('selecting'), 1500)
    } else if (next === 'selecting') {
      timers.current.t = setTimeout(() => beginStep('responding'), 1500)
    } else if (next === 'responding') {
      setTypedResponse('')
      let i = 0
      timers.current.interval = setInterval(() => {
        i++
        setTypedResponse(RESPONSE_TEXT.slice(0, i))
        if (i >= RESPONSE_TEXT.length) {
          clearInterval(timers.current.interval)
          timers.current.t = setTimeout(() => beginStep('idle'), 1500)
        }
      }, 28)
    } else if (next === 'idle') {
      setTypedClause('')
      setTypedResponse('')
      timers.current.t = setTimeout(() => beginStep('pasting'), 1500)
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    timers.current.t = setTimeout(() => beginStep('pasting'), 1500)
    return () => {
      if (timers.current.t) clearTimeout(timers.current.t)
      if (timers.current.interval) clearInterval(timers.current.interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0.75rem',
        border: '1px solid #27272a',
        backgroundColor: '#111112',
        maxWidth: '640px',
        margin: '0 auto',
        transform: entered ? 'scale(1)' : 'scale(0.92)',
        opacity: entered ? 1 : 0,
        transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ position: 'relative', padding: '1.5rem', minHeight: '260px' }}>
        {/* Step label (eyebrow) */}
        <p style={{
          color: 'var(--brand-lime)',
          fontSize: '0.625rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '0.75rem',
          minHeight: '0.85rem',
        }}>
          {STEP_LABELS[step]}
        </p>

        {/* Pasting panel — visible during pasting + analyzing + selecting + responding */}
        {(step === 'pasting' || step === 'analyzing' || step === 'selecting' || step === 'responding') && (
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            minHeight: '5rem',
          }}>
            {step === 'pasting' ? typedClause : CONTRACT_CLAUSE}
            {step === 'pasting' && (
              <span style={{
                display: 'inline-block',
                width: '2px',
                height: '0.9em',
                backgroundColor: 'var(--brand-lime)',
                verticalAlign: 'text-bottom',
                marginLeft: '1px',
                animation: 'blink 0.9s step-end infinite',
              }} />
            )}
          </div>
        )}

        {/* Risk badge — visible during analyzing + selecting + responding */}
        {(step === 'analyzing' || step === 'selecting' || step === 'responding') && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Risk score</span>
            <span style={{
              backgroundColor: 'rgba(132,204,22,0.1)',
              color: '#84cc16',
              border: '1px solid rgba(132,204,22,0.3)',
              borderRadius: '4px',
              padding: '0 0.5rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}>
              {RISK_SCORE}
            </span>
          </div>
        )}

        {/* Tool card row — visible during selecting + responding */}
        {(step === 'selecting' || step === 'responding') && (
          <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {['Scope Change', ACTIVE_TOOL_LABEL, 'Late Payment'].map((label) => {
              const isActive = label === ACTIVE_TOOL_LABEL
              return (
                <div key={label} style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: isActive ? '1px solid #84cc16' : '1px solid var(--bg-border)',
                  boxShadow: isActive ? '0 0 12px rgba(132,204,22,0.15)' : 'none',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'center',
                }}>
                  {label}
                </div>
              )
            })}
          </div>
        )}

        {/* Response panel — visible during responding */}
        {step === 'responding' && (
          <div style={{
            marginTop: '0.75rem',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            minHeight: '4.5rem',
          }}>
            {typedResponse}
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '0.9em',
              backgroundColor: 'var(--brand-lime)',
              verticalAlign: 'text-bottom',
              marginLeft: '1px',
              animation: 'blink 0.9s step-end infinite',
            }} />
          </div>
        )}
      </div>

      {/* Vignette overlay — last child so it sits on top */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  )
}
