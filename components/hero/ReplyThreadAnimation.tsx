'use client'

import { useEffect, useRef, useState } from 'react'

const SCENARIOS = [
  {
    project: 'Webflow Redesign',
    client: 'Sarah K.',
    tool: 'Scope Change',
    originalResponse: `Hi Sarah,\n\nOur agreement covers the 5-page desktop website. A mobile app is a separate project that needs its own scope and quote.\n\nI can put together a proposal as a follow-on once the site launches.\n\n— Alex`,
    clientReply: `Okay, I get it — let's keep the mobile app for later. Happy to stay focused on the website as agreed!`,
    stance: 'backing_down' as const,
    stanceLabel: 'Backing down',
    stanceColor: '#84cc16',
    explanation: 'Client accepted your scope boundaries and agreed to proceed as originally contracted.',
    followUp: `Thanks for understanding, Sarah — glad we're aligned.\n\nI'll continue on the website as scoped. We can revisit the mobile app as a separate project after handoff.\n\n— Alex`,
  },
  {
    project: 'Brand Identity — Noir Studio',
    client: 'Marcus T.',
    tool: 'Late Payment',
    originalResponse: `Hi Marcus,\n\nInvoice #1042 for €2,400 was due April 12th per our Net 14 terms. Late payment interest accrues at 8% per annum from the due date.\n\nPlease confirm when I can expect the transfer.\n\n— Alex`,
    clientReply: `This is ridiculous. If you keep pushing this I'll just dispute the charge with my bank.`,
    stance: 'escalating' as const,
    stanceLabel: 'Escalating',
    stanceColor: '#ef4444',
    explanation: 'Client is threatening a chargeback to avoid a legitimate contractual obligation.',
    followUp: `Marcus, a chargeback on a valid invoice is a serious step with real consequences.\n\nThe late fee is contractually valid per our signed agreement. Please arrange payment of €2,400 by Friday to avoid further action.\n\n— Alex`,
  },
  {
    project: 'E-comm Redesign — Volta',
    client: 'Priya M.',
    tool: 'Revision Limit',
    originalResponse: `Hi Priya,\n\nWe're now in round 4 — our agreement included 2 revision rounds. Additional work is billed at €90/hr. Based on what you've described, I'd estimate 3–4 hours.\n\nShall I send a quote?\n\n— Alex`,
    clientReply: `I feel like the revision limit is unfair. Other designers I've worked with don't charge extra for this.`,
    stance: 'doubling_down' as const,
    stanceLabel: 'Doubling down',
    stanceColor: '#f59e0b',
    explanation: 'Client is repeating their original objection without new information or justification.',
    followUp: `Priya, the 2-round limit was agreed and signed at project start.\n\nI've already completed 2 additional rounds at no charge. The remaining work is billable at €90/hr — let me know if you'd like a quote so we can finish strong.\n\n— Alex`,
  },
]

type Phase = 'idle' | 'typing-reply' | 'analyzing' | 'revealing' | 'done' | 'exit'

function StanceIcon({ stance, color }: { stance: string; color: string }) {
  if (stance === 'backing_down') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 17 13 8 8 13 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
  if (stance === 'escalating') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
  // doubling_down
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 7 13 16 8 11 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function ReplyTriggerIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  )
}

export default function ReplyThreadAnimation() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [typedReply, setTypedReply] = useState('')
  const [typedFollowUp, setTypedFollowUp] = useState('')
  const [entered, setEntered] = useState(false)
  const [fading, setFading] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const bodyRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLDivElement>(null)
  const followUpRef = useRef<HTMLDivElement>(null)

  function clear() {
    clearTimeout(tRef.current)
    clearInterval(ivRef.current)
  }

  function go(next: Phase, i = idx) {
    clear()
    setPhase(next)
    const sc = SCENARIOS[i]

    if (next === 'idle') {
      setTypedReply('')
      setTypedFollowUp('')
      tRef.current = setTimeout(() => go('typing-reply', i), 1000)
    } else if (next === 'typing-reply') {
      setTypedReply('')
      let n = 0
      ivRef.current = setInterval(() => {
        n++
        setTypedReply(sc.clientReply.slice(0, n))
        if (n >= sc.clientReply.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => go('analyzing', i), 500)
        }
      }, 22)
    } else if (next === 'analyzing') {
      tRef.current = setTimeout(() => go('revealing', i), 2000)
    } else if (next === 'revealing') {
      setTypedFollowUp('')
      let n = 0
      ivRef.current = setInterval(() => {
        n++
        setTypedFollowUp(sc.followUp.slice(0, n))
        if (n >= sc.followUp.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => go('done', i), 300)
        }
      }, 16)
    } else if (next === 'done') {
      tRef.current = setTimeout(() => go('exit', i), 3500)
    } else if (next === 'exit') {
      setFading(true)
      tRef.current = setTimeout(() => {
        const ni = (i + 1) % SCENARIOS.length
        setIdx(ni)
        setFading(false)
        go('idle', ni)
      }, 700)
    }
  }

  useEffect(() => {
    if (replyRef.current) replyRef.current.scrollTop = replyRef.current.scrollHeight
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [typedReply])

  useEffect(() => {
    if (followUpRef.current) followUpRef.current.scrollTop = followUpRef.current.scrollHeight
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [typedFollowUp])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [phase])

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    tRef.current = setTimeout(() => go('typing-reply', 0), 1200)
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sc = SCENARIOS[idx]
  const showTextarea = phase === 'typing-reply' || phase === 'analyzing'
  const showCard = phase === 'revealing' || phase === 'done'

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow — shifts to stance color once card appears */}
      <div aria-hidden style={{
        position: 'absolute', inset: '-60px',
        background: showCard
          ? `radial-gradient(ellipse 70% 60% at 50% 50%, ${sc.stanceColor}10 0%, transparent 70%)`
          : 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(132,204,22,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
        transition: 'background 0.8s ease',
      }} />

      {/* App window */}
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
            transition: 'color 0.5s ease',
          }}>
            pushback.to / projects / {sc.project} / history
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} style={{
          padding: '1.25rem 1.5rem',
          height: '480px',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }}>
          {/* Page heading */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.55rem', color: '#52525b', marginBottom: '0.2rem', letterSpacing: '0.06em' }}>← {sc.project}</p>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e4e4e7', letterSpacing: '-0.02em' }}>Message history</p>
            <p style={{ fontSize: '0.62rem', color: '#71717a' }}>{sc.client}</p>
          </div>

          {/* Response card */}
          <div style={{ backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.75rem', overflow: 'hidden' }}>

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #1a1a1e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  backgroundColor: 'rgba(132,204,22,0.1)', color: '#84cc16',
                  border: '1px solid rgba(132,204,22,0.2)', borderRadius: '4px',
                  padding: '0.08rem 0.4rem', fontSize: '0.52rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{sc.tool}</span>
                <span style={{ fontSize: '0.58rem', color: '#52525b' }}>Today at 9:41 AM</span>
              </div>
              {/* Chevron up = expanded */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>

            {/* Card body — expanded */}
            <div style={{ padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Original response preview */}
              <div style={{
                backgroundColor: '#0b1a0c', border: '1px solid rgba(132,204,22,0.12)',
                borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#a1a1aa',
                lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: '88px', overflow: 'hidden',
              }}>
                {sc.originalResponse}
              </div>

              {/* Copy Message button */}
              <div style={{ display: 'flex' }}>
                <div style={{
                  backgroundColor: '#84cc16', color: '#0a0a0a', borderRadius: '0.375rem',
                  padding: '0.3rem 0.75rem', fontSize: '0.6rem', fontWeight: 700,
                }}>
                  Copy Message
                </div>
              </div>

              {/* ── idle: show trigger button ── */}
              {phase === 'idle' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#84cc16', fontSize: '0.68rem', paddingTop: '0.125rem' }}>
                  <ReplyTriggerIcon color="#84cc16" />
                  Paste their reply →
                </div>
              )}

              {/* ── typing-reply / analyzing: textarea + buttons ── */}
              {showTextarea && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#84cc16', fontSize: '0.68rem' }}>
                    <ReplyTriggerIcon color="#84cc16" />
                    Cancel
                  </div>

                  {/* Reply textarea */}
                  <div ref={replyRef} style={{
                    backgroundColor: '#0d0d10',
                    border: `1px solid ${phase === 'analyzing' ? 'rgba(132,204,22,0.3)' : '#2a2a2e'}`,
                    borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#a1a1aa',
                    lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    minHeight: '72px', maxHeight: '110px', overflowY: 'auto', scrollbarWidth: 'none',
                    transition: 'border-color 0.3s ease',
                  }}>
                    {typedReply}
                    {phase === 'typing-reply' && (
                      <span style={{ display: 'inline-block', width: '1.5px', height: '0.85em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ border: '1px solid #3f3f46', color: '#71717a', borderRadius: '0.375rem', padding: '0.3rem 0.625rem', fontSize: '0.6rem' }}>
                      Cancel
                    </div>
                    <div style={{
                      backgroundColor: '#84cc16', color: '#0a0a0a',
                      borderRadius: '0.375rem', padding: '0.3rem 0.75rem',
                      fontSize: '0.6rem', fontWeight: 700,
                      opacity: phase === 'analyzing' ? 0.7 : 1,
                      transition: 'opacity 0.2s ease',
                    }}>
                      {phase === 'analyzing' ? 'Analyzing…' : 'Analyze reply →'}
                    </div>
                  </div>

                  {/* Analyzing pulse */}
                  {phase === 'analyzing' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(132,204,22,0.04)', border: '1px solid rgba(132,204,22,0.1)', borderRadius: '0.5rem' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#84cc16', flexShrink: 0, animation: 'pulse 1.1s ease-in-out infinite' }} />
                      <p style={{ fontSize: '0.6rem', color: '#84cc16', fontWeight: 600 }}>Reading stance · Drafting follow-up</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── revealing / done: ReplyThreadCard ── */}
              {showCard && (
                <div style={{
                  backgroundColor: '#0e0e11',
                  border: '1px solid #222225',
                  borderLeft: `3px solid ${sc.stanceColor}`,
                  borderRadius: '0.5rem', padding: '0.875rem 1rem',
                }}>
                  {/* Stance row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.375rem' }}>
                    <StanceIcon stance={sc.stance} color={sc.stanceColor} />
                    <span style={{ color: sc.stanceColor, fontSize: '0.78rem', fontWeight: 700 }}>{sc.stanceLabel}</span>
                  </div>

                  {/* Explanation */}
                  <p style={{ fontSize: '0.62rem', color: '#71717a', lineHeight: 1.55, marginBottom: '0' }}>
                    {sc.explanation}
                  </p>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: '#1e1e22', margin: '0.625rem 0' }} />

                  {/* Follow-up pre block */}
                  <div ref={followUpRef} style={{
                    backgroundColor: '#0a0a0a', border: '1px solid #1e1e22',
                    borderRadius: '0.375rem', padding: '0.625rem 0.75rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#d4d4d8',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    marginBottom: '0.625rem', minHeight: '52px', maxHeight: '120px',
                    overflowY: 'auto', scrollbarWidth: 'none',
                  }}>
                    {typedFollowUp}
                    {phase === 'revealing' && (
                      <span style={{ display: 'inline-block', width: '1.5px', height: '0.85em', backgroundColor: sc.stanceColor, verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
                    )}
                  </div>

                  {/* Copy Follow-Up button */}
                  {phase === 'done' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      backgroundColor: '#84cc16', color: '#0a0a0a',
                      borderRadius: '0.375rem', padding: '0.3rem 0.75rem',
                      fontSize: '0.6rem', fontWeight: 700,
                      boxShadow: '0 0 16px rgba(132,204,22,0.3)',
                    }}>
                      Copy Follow-Up
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
