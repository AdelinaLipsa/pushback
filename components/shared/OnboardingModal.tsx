'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// ─── Step 1 animation: form fills in ───────────────────────────────────────

const FIELD_SEQUENCE = [
  { label: 'Project name', value: 'Webflow Redesign' },
  { label: 'Client name', value: 'Sarah K.' },
  { label: 'Project value', value: 'EUR 4,500' },
]

function Step1Animation() {
  const [fieldIdx, setFieldIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState<boolean[]>([false, false, false])
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function clear() { clearTimeout(tRef.current); clearInterval(ivRef.current) }

  function typeField(fi: number) {
    const target = FIELD_SEQUENCE[fi].value
    let n = 0
    setTyped('')
    ivRef.current = setInterval(() => {
      n++
      setTyped(target.slice(0, n))
      if (n >= target.length) {
        clearInterval(ivRef.current)
        tRef.current = setTimeout(() => {
          setDone(prev => { const next = [...prev]; next[fi] = true; return next })
          if (fi < FIELD_SEQUENCE.length - 1) {
            tRef.current = setTimeout(() => { setFieldIdx(fi + 1); typeField(fi + 1) }, 400)
          } else {
            // reset after pause
            tRef.current = setTimeout(() => {
              setFieldIdx(0); setDone([false, false, false]); typeField(0)
            }, 2800)
          }
        }, 200)
      }
    }, 38)
  }

  useEffect(() => {
    tRef.current = setTimeout(() => typeField(0), 600)
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.75rem',
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem',
    }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e4e4e7', letterSpacing: '-0.01em' }}>New project</p>
      {FIELD_SEQUENCE.map((field, i) => {
        const isActive = i === fieldIdx && !done[i]
        const isDone = done[i]
        return (
          <div key={field.label}>
            <p style={{ fontSize: '0.55rem', color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{field.label}</p>
            <div style={{
              backgroundColor: '#0d0d10',
              border: `1px solid ${isDone ? 'rgba(132,204,22,0.3)' : isActive ? '#3f3f46' : '#1e1e22'}`,
              borderRadius: '0.375rem', padding: '0.5rem 0.625rem',
              fontSize: '0.7rem', color: isDone ? '#e4e4e7' : '#a1a1aa',
              minHeight: '2rem', display: 'flex', alignItems: 'center',
              transition: 'border-color 0.3s ease, color 0.3s ease',
            }}>
              {i < fieldIdx || isDone ? field.value : i === fieldIdx ? (
                <>
                  {typed}
                  <span style={{ display: 'inline-block', width: '1.5px', height: '0.8em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
                </>
              ) : <span style={{ color: '#2a2a2e' }}>—</span>}
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        <div style={{
          backgroundColor: done[2] ? '#84cc16' : '#1e1e22', color: done[2] ? '#0a0a0a' : '#52525b',
          borderRadius: '0.375rem', padding: '0.4rem 1rem', fontSize: '0.65rem', fontWeight: 700,
          transition: 'background-color 0.4s ease, color 0.4s ease',
          boxShadow: done[2] ? '0 0 16px rgba(132,204,22,0.35)' : 'none',
        }}>
          {done[2] ? 'Project created →' : 'Create project'}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 animation: tool selected + message typed ──────────────────────

const SITUATION_TEXT = `Hi, since we're already building the site could we add a mobile app to the scope? Same budget — my boss just brought it up.`

const TOOLS = ['Scope Change', 'Late Payment', 'Ghost Client', 'Revision Limit']

function Step2Animation() {
  const [detected, setDetected] = useState(false)
  const [typed, setTyped] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function clear() { clearTimeout(tRef.current); clearInterval(ivRef.current) }

  function run() {
    setDetected(false); setTyped(''); setAnalyzing(false)
    let n = 0
    tRef.current = setTimeout(() => {
      ivRef.current = setInterval(() => {
        n++
        setTyped(SITUATION_TEXT.slice(0, n))
        if (n >= SITUATION_TEXT.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => {
            setAnalyzing(true)
            tRef.current = setTimeout(() => {
              setDetected(true)
              tRef.current = setTimeout(run, 3200)
            }, 1600)
          }, 400)
        }
      }, 24)
    }, 500)
  }

  useEffect(() => { run(); return clear }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.75rem',
      overflow: 'hidden', display: 'grid', gridTemplateColumns: '100px 1fr',
    }}>
      {/* Mini sidebar */}
      <div style={{ borderRight: '1px solid #1a1a1e', backgroundColor: '#080809', padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <p style={{ fontSize: '0.48rem', color: '#3f3f46', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, paddingLeft: '0.375rem', marginBottom: '0.35rem' }}>Tools</p>
        {TOOLS.map(tool => {
          const active = tool === 'Scope Change' && detected
          return (
            <div key={tool} style={{
              padding: '0.35rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.58rem',
              fontWeight: active ? 700 : 400, color: active ? '#84cc16' : '#52525b',
              backgroundColor: active ? 'rgba(132,204,22,0.08)' : 'transparent',
              borderLeft: `2px solid ${active ? '#84cc16' : 'transparent'}`,
              transition: 'all 0.4s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{tool}</div>
          )
        })}
      </div>

      {/* Main */}
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div style={{ minHeight: '1rem' }}>
          {analyzing && !detected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#84cc16', animation: 'pulse 1.1s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.55rem', color: '#84cc16', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Analyzing…</span>
            </div>
          )}
          {detected && (
            <span style={{
              backgroundColor: 'rgba(132,204,22,0.1)', color: '#84cc16',
              border: '1px solid rgba(132,204,22,0.25)',
              borderRadius: '4px', padding: '0.08rem 0.4rem',
              fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Scope Change — detected</span>
          )}
        </div>
        <div style={{
          backgroundColor: '#0d0d10', border: `1px solid ${analyzing ? 'rgba(132,204,22,0.2)' : '#1e1e22'}`,
          borderRadius: '0.375rem', padding: '0.625rem 0.75rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#a1a1aa',
          lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          minHeight: '80px', transition: 'border-color 0.3s ease',
        }}>
          {typed}
          {!analyzing && (
            <span style={{ display: 'inline-block', width: '1.5px', height: '0.8em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            backgroundColor: analyzing ? '#6b9e11' : '#84cc16', color: '#0a0a0a',
            borderRadius: '0.375rem', padding: '0.35rem 0.75rem', fontSize: '0.62rem', fontWeight: 700,
            opacity: !typed ? 0.4 : 1, transition: 'opacity 0.3s ease, background-color 0.3s ease',
          }}>
            {analyzing ? (detected ? 'Done' : 'Analyzing…') : 'Analyze →'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 animation: response appears + copy flashes ────────────────────

const RESPONSE_TEXT = `Hi Sarah,\n\nOur agreement covers the 5-page desktop website. A mobile app is a separate project that needs its own scope and quote.\n\nI can put together a proposal as a follow-on once the site launches.\n\n— Alex`

function Step3Animation() {
  const [typed, setTyped] = useState('')
  const [copied, setCopied] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function clear() { clearTimeout(tRef.current); clearInterval(ivRef.current) }

  function run() {
    setCopied(false); setTyped('')
    let n = 0
    tRef.current = setTimeout(() => {
      ivRef.current = setInterval(() => {
        n++
        setTyped(RESPONSE_TEXT.slice(0, n))
        if (n >= RESPONSE_TEXT.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => {
            setCopied(true)
            tRef.current = setTimeout(run, 2800)
          }, 800)
        }
      }, 18)
    }, 400)
  }

  useEffect(() => { run(); return clear }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.75rem',
      padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          backgroundColor: 'rgba(132,204,22,0.1)', color: '#84cc16',
          border: '1px solid rgba(132,204,22,0.2)', borderRadius: '4px',
          padding: '0.08rem 0.4rem', fontSize: '0.52rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Scope Change</span>
        <span style={{ fontSize: '0.55rem', color: typed.length >= RESPONSE_TEXT.length ? '#22c55e' : '#52525b', fontWeight: 600, transition: 'color 0.4s ease' }}>
          {typed.length >= RESPONSE_TEXT.length ? 'Ready to send' : 'Generating…'}
        </span>
      </div>
      <div style={{
        backgroundColor: '#0b1a0c', border: '1px solid rgba(132,204,22,0.12)',
        borderRadius: '0.5rem', padding: '0.75rem 0.875rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#d4d4d8',
        lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        minHeight: '110px',
      }}>
        {typed}
        {typed.length < RESPONSE_TEXT.length && (
          <span style={{ display: 'inline-block', width: '1.5px', height: '0.8em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{
          backgroundColor: copied ? '#22c55e' : '#84cc16', color: '#0a0a0a',
          borderRadius: '0.375rem', padding: '0.4rem 1rem', fontSize: '0.65rem', fontWeight: 700,
          transition: 'background-color 0.25s ease',
          boxShadow: copied ? '0 0 20px rgba(34,197,94,0.45)' : '0 0 16px rgba(132,204,22,0.3)',
          opacity: typed.length < RESPONSE_TEXT.length ? 0.4 : 1,
        }}>
          {copied ? 'Copied!' : 'Copy Message'}
        </div>
        <div style={{ border: '1px solid #3f3f46', color: '#71717a', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.65rem' }}>
          Edit first
        </div>
      </div>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Add your first project',
    body: 'Create a project for each client. Give it a name, add the client\'s details, and set a payment due date if you\'re tracking one.',
    Animation: Step1Animation,
  },
  {
    n: '02',
    title: 'Paste the client message',
    body: 'Drop their email or DM into the analyze box. Pushback reads it and pre-selects the right defense tool automatically.',
    Animation: Step2Animation,
  },
  {
    n: '03',
    title: 'Copy and send',
    body: 'A firm, ready-to-send reply appears in seconds. Edit if you want — then copy and send. The whole flow takes under 30 seconds.',
    Animation: Step3Animation,
  },
]

const STORAGE_KEY = 'pushback_onboarding_v1'

interface OnboardingModalProps {
  isNew: boolean
}

export default function OnboardingModal({ isNew }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!isNew) return
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch { /* storage unavailable */ }
    // Slight delay so dashboard content loads first
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [isNew])

  function dismiss() {
    setExiting(true)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setTimeout(() => { setVisible(false); setExiting(false) }, 280)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const { title, body, n, Animation } = STEPS[step]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.25s ease',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7)',
        transform: exiting ? 'translateY(8px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
              color: 'var(--brand-lime)', letterSpacing: '0.04em',
            }}>{n}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>of 03</span>
          </div>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '0.375rem', padding: '0.75rem 1.5rem 0' }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                height: '3px', flex: i === step ? '2' : '1',
                borderRadius: '9999px', border: 'none', cursor: 'pointer', padding: 0,
                backgroundColor: i === step ? 'var(--brand-lime)' : i < step ? 'rgba(132,204,22,0.35)' : 'var(--bg-elevated)',
                transition: 'flex 0.35s ease, background-color 0.35s ease',
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <h2 style={{
            color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.15rem',
            letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2,
          }}>{title}</h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.875rem',
            lineHeight: 1.65, marginBottom: '1.25rem',
          }}>{body}</p>

          {/* Animation area */}
          <Animation />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--bg-border)',
        }}>
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.375rem 0',
            }}
          >
            Skip
          </button>
          <button
            onClick={next}
            style={{
              backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              padding: '0.5rem 1.5rem', fontSize: '0.875rem', fontWeight: 700,
            }}
          >
            {step < STEPS.length - 1 ? 'Next →' : 'Get started →'}
          </button>
        </div>
      </div>
    </div>
  )
}
