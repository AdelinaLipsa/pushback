'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'uploading' | 'scanning' | 'risk' | 'clauses' | 'expand' | 'done' | 'exit'

const CONTRACT = {
  name: 'freelance-design-agreement.pdf',
  pages: 4,
  client: 'Novo Digital',
  verdict: 'Review before signing — 3 clauses need renegotiation',
}

const SCAN_STEPS = ['Reading 4 pages', 'Mapping clause types', 'Calculating risk score']

const CLAUSES = [
  {
    level: 'CRITICAL',
    color: '#ef4444',
    title: 'Unlimited Revisions',
    quote: '"Client may request revisions until fully satisfied with the deliverables."',
    pushback: 'This agreement includes 2 rounds of revisions. Additional rounds are billed at €90/hr. Client approvals at each milestone close that revision window.',
  },
  {
    level: 'HIGH',
    color: '#f97316',
    title: 'Immediate IP Transfer',
    quote: '"All work product transfers to Client upon creation."',
    pushback: 'IP transfers to Client upon receipt of full payment. Until payment is received, I retain all rights to work product.',
  },
  {
    level: 'HIGH',
    color: '#f97316',
    title: 'Net 60 Payment Terms',
    quote: '"Invoices are due within sixty (60) days of receipt."',
    pushback: 'Payment terms are Net 14. Late payment accrues interest at 8% per annum from the due date.',
  },
]

const POSITIVE_NOTES = [
  'Confidentiality clause protects your client list',
  'Deliverable scope is clearly defined with milestone list',
]

const SCAN_LINES = [
  { w: '85%', flagged: true  },
  { w: '72%', flagged: false },
  { w: '90%', flagged: true  },
  { w: '60%', flagged: false },
  { w: '78%', flagged: true  },
  { w: '45%', flagged: false },
  { w: '83%', flagged: true  },
  { w: '55%', flagged: false },
]

export default function ContractAnimation() {
  const [phase, setPhase]               = useState<Phase>('idle')
  const [uploadPct, setUploadPct]       = useState(0)
  const [scanStep, setScanStep]         = useState(0)
  const [visibleClauses, setVisible]    = useState(0)
  const [entered, setEntered]           = useState(false)
  const [fading, setFading]             = useState(false)
  const tRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function clear() {
    clearTimeout(tRef.current)
    clearInterval(ivRef.current)
  }

  function go(next: Phase) {
    clear()
    setPhase(next)

    if (next === 'idle') {
      setUploadPct(0); setScanStep(0); setVisible(0)
      tRef.current = setTimeout(() => go('uploading'), 700)

    } else if (next === 'uploading') {
      setUploadPct(0)
      let p = 0
      ivRef.current = setInterval(() => {
        p += 3
        setUploadPct(Math.min(p, 100))
        if (p >= 100) { clearInterval(ivRef.current); tRef.current = setTimeout(() => go('scanning'), 400) }
      }, 35)

    } else if (next === 'scanning') {
      setScanStep(0)
      let s = 0
      ivRef.current = setInterval(() => {
        s++; setScanStep(s)
        if (s >= SCAN_STEPS.length) { clearInterval(ivRef.current); tRef.current = setTimeout(() => go('risk'), 700) }
      }, 750)

    } else if (next === 'risk') {
      tRef.current = setTimeout(() => go('clauses'), 1500)

    } else if (next === 'clauses') {
      setVisible(0)
      let c = 0
      ivRef.current = setInterval(() => {
        c++; setVisible(c)
        if (c >= CLAUSES.length) { clearInterval(ivRef.current); tRef.current = setTimeout(() => go('expand'), 900) }
      }, 480)

    } else if (next === 'expand') {
      tRef.current = setTimeout(() => go('done'), 3800)

    } else if (next === 'done') {
      tRef.current = setTimeout(() => go('exit'), 3200)

    } else if (next === 'exit') {
      setFading(true)
      tRef.current = setTimeout(() => { setFading(false); go('idle') }, 700)
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    tRef.current = setTimeout(() => go('uploading'), 1100)
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showResults = phase === 'risk' || phase === 'clauses' || phase === 'expand' || phase === 'done'

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: '-60px',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Window */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: '0.875rem', border: '1px solid #222225',
        backgroundColor: '#09090b', width: '100%', overflow: 'hidden',
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        opacity: entered ? 1 : 0,
        transition: 'transform 800ms cubic-bezier(0.16,1,0.3,1), opacity 700ms ease',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.7)',
      }}>

        {/* Browser chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderBottom: '1px solid #1c1c1f', backgroundColor: '#060608' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{
            flex: 1, margin: '0 0.5rem', backgroundColor: '#111114',
            border: '1px solid #2a2a2e', borderRadius: '0.35rem',
            padding: '0.22rem 0.75rem', fontFamily: 'var(--font-mono)',
            fontSize: '0.575rem', color: '#52525b', letterSpacing: '0.04em', textAlign: 'center',
          }}>
            pushback.to / projects / {CONTRACT.client} / contracts
          </div>
        </div>

        {/* Body */}
        <div style={{
          height: '480px', display: 'flex', flexDirection: 'column',
          opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease', overflow: 'hidden',
        }}>

          {/* ── UPLOAD ── */}
          {(phase === 'idle' || phase === 'uploading') && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div style={{
                width: '100%', maxWidth: '380px',
                border: `2px dashed ${phase === 'uploading' ? 'rgba(132,204,22,0.4)' : '#2a2a2e'}`,
                borderRadius: '0.875rem', padding: '2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
                backgroundColor: phase === 'uploading' ? 'rgba(132,204,22,0.025)' : 'transparent',
                transition: 'all 0.35s ease',
              }}>
                {/* PDF icon */}
                <div style={{ position: 'relative', width: 40, height: 48, backgroundColor: '#111114', border: '1px solid #3f3f46', borderRadius: '0.35rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 10px 10px 0', borderColor: `transparent #09090b transparent transparent` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em' }}>PDF</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#e4e4e7', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>{CONTRACT.name}</p>
                  <p style={{ color: '#52525b', fontSize: '0.68rem' }}>{CONTRACT.pages} pages · 84 KB</p>
                </div>

                {phase === 'uploading' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ height: 3, backgroundColor: '#1a1a1a', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '9999px', backgroundColor: '#84cc16',
                        width: `${uploadPct}%`, transition: 'width 0.08s linear',
                        boxShadow: '0 0 8px rgba(132,204,22,0.6)',
                      }} />
                    </div>
                    <p style={{ color: '#52525b', fontSize: '0.6rem', textAlign: 'center' }}>
                      {uploadPct < 100 ? `Uploading... ${uploadPct}%` : 'Processing...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SCANNING ── */}
          {phase === 'scanning' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#84cc16', flexShrink: 0, animation: 'pulse 1.1s ease-in-out infinite' }} />
                  <p style={{ color: '#84cc16', fontSize: '0.75rem', fontWeight: 600 }}>
                    {scanStep < SCAN_STEPS.length ? SCAN_STEPS[scanStep] : 'Analysis complete'}
                  </p>
                </div>

                {/* Document skeleton with highlighted lines */}
                <div style={{ backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.5rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {SCAN_LINES.map((line, i) => (
                    <div key={i} style={{
                      height: '6px', borderRadius: '9999px', width: line.w,
                      backgroundColor: line.flagged && scanStep >= 1 ? 'rgba(249,115,22,0.35)' : '#1e1e22',
                      transition: 'background-color 0.5s ease',
                    }} />
                  ))}
                </div>

                {/* Step checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {SCAN_STEPS.map((step, i) => {
                    const done = scanStep > i
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: done ? 1 : 0.3, transition: 'opacity 0.35s ease' }}>
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                          border: `1.5px solid ${done ? '#84cc16' : '#3f3f46'}`,
                          backgroundColor: done ? 'rgba(132,204,22,0.15)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.35s ease',
                        }}>
                          {done && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#84cc16' }} />}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: done ? '#a1a1aa' : '#52525b', transition: 'color 0.35s ease' }}>{step}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {showResults && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '1.25rem 1.5rem', gap: '0.875rem' }}>

              {/* Risk badge + verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{
                  backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.28)',
                  borderRadius: '0.375rem', padding: '0.3rem 0.7rem',
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700, color: '#f97316', letterSpacing: '0.08em' }}>HIGH RISK</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#f97316' }}>72</span>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(249,115,22,0.5)' }}>/100</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.45 }}>{CONTRACT.verdict}</p>
              </div>

              {/* Flagged clauses */}
              {(phase === 'clauses' || phase === 'expand' || phase === 'done') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
                    Flagged clauses ({CLAUSES.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflow: 'auto' }}>
                    {CLAUSES.slice(0, visibleClauses).map((clause, i) => {
                      const isExpanded = i === 0 && (phase === 'expand' || phase === 'done')
                      return (
                        <div key={i} style={{
                          backgroundColor: '#111114',
                          border: '1px solid #222225',
                          borderLeft: `3px solid ${clause.color}`,
                          borderRadius: '0.5rem', overflow: 'hidden',
                          transition: 'all 0.4s ease',
                        }}>
                          {/* Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.875rem' }}>
                            <span style={{
                              fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.06em',
                              padding: '0.12rem 0.4rem', borderRadius: '3px',
                              backgroundColor: `${clause.color}1a`, color: clause.color,
                            }}>{clause.level}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e4e4e7' }}>{clause.title}</span>
                          </div>

                          {/* Expanded body */}
                          {isExpanded && (
                            <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                              <p style={{
                                fontSize: '0.62rem', color: '#71717a', fontStyle: 'italic',
                                borderLeft: `2px solid ${clause.color}`, paddingLeft: '0.5rem', lineHeight: 1.55,
                              }}>{clause.quote}</p>
                              <div>
                                <p style={{ fontSize: '0.52rem', color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>What to say back</p>
                                <div style={{
                                  backgroundColor: '#0a0a0a', border: '1px solid #1e1e22',
                                  borderRadius: '0.375rem', padding: '0.625rem 0.75rem',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
                                }}>
                                  <p style={{ fontSize: '0.63rem', color: '#d4d4d8', lineHeight: 1.65 }}>{clause.pushback}</p>
                                  <div style={{
                                    backgroundColor: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.2)',
                                    borderRadius: '0.25rem', padding: '0.2rem 0.45rem', flexShrink: 0,
                                    fontSize: '0.52rem', fontWeight: 700, color: '#84cc16', letterSpacing: '0.04em',
                                  }}>Copy</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Positive notes — done phase */}
              {phase === 'done' && (
                <div style={{ flexShrink: 0, borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.52rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Working in your favor
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {POSITIVE_NOTES.map((note, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{
                          width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <p style={{ fontSize: '0.63rem', color: '#71717a' }}>{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
