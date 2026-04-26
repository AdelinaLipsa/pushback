'use client'

import { useEffect, useRef, useState } from 'react'

const SCENARIOS = [
  {
    project: 'Webflow Redesign',
    client: 'Sarah K.',
    tool: 'Scope Change',
    message: `Hi Alex,\n\nQuick one — since we're already building the site, could we add a mobile app to the scope as well? Same budget, my boss just brought it up. It honestly doesn't seem like much extra work from our side.\n\nAlso, any chance we can move the deadline to next Friday?\n\nThanks! — Sarah`,
    response: `Hi Sarah,\n\nThanks for raising this — a mobile app is an exciting direction.\n\nTo be clear: our agreement covers the 5-page desktop website with 2 revision rounds. A native mobile app is a completely separate project that needs its own scope and quote to deliver properly.\n\nI can put together a proposal for the mobile app as a follow-on once the site launches. Alternatively, we stay focused on the current scope and revisit after handoff.\n\nWhich would you prefer?\n\n— Alex`,
  },
  {
    project: 'Brand Identity — Noir Studio',
    client: 'Marcus T.',
    tool: 'Late Payment',
    message: `Hey Alex! Heads up — things are a bit tight this month so the invoice might be a couple of weeks late. Just cash flow stuff, nothing serious. Hope that's okay!`,
    response: `Hi Marcus,\n\nThanks for the heads up. Just to flag: our agreement specifies Net 14 payment terms, and invoice #1042 for €2,400 was due on April 12th.\n\nAs outlined in section 4 of our contract, late payment interest accrues at 8% per annum after 7 days past the due date.\n\nPlease confirm when I can expect the transfer.\n\n— Alex`,
  },
  {
    project: 'E-comm Redesign — Volta',
    client: 'Priya M.',
    tool: 'Revision Limit',
    message: `Hi! Love the latest version, just a few more tweaks — can we move the hero image, rework the nav layout, update the colour palette to be warmer, and also revisit the footer? Shouldn't be too much work!`,
    response: `Hi Priya,\n\nHappy to make these adjustments — just a quick flag: our agreement included 2 revision rounds, and we're now into round 4.\n\nAdditional revision work is billed at my standard rate of €90/hr. Based on what you've described, I'd estimate 3–4 hours.\n\nShall I send a quick quote, or would you like to scope a revision package if you're expecting more rounds ahead?\n\n— Alex`,
  },
] as const

const SIDEBAR_TOOLS = ['Scope Change', 'Payment Reminder', 'Late Payment', 'Ghost Client', 'Revision Limit', 'Kill Fee', 'Dispute Response', 'Rate Negotiation']

type Phase = 'idle' | 'typing-msg' | 'analyzing' | 'detected' | 'typing-resp' | 'done' | 'exit'

export default function DemoAnimation() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [typedMsg, setTypedMsg] = useState('')
  const [typedResp, setTypedResp] = useState('')
  const [entered, setEntered] = useState(false)
  const [fading, setFading] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function clear() {
    clearTimeout(tRef.current)
    clearInterval(ivRef.current)
  }

  function go(next: Phase, i = idx) {
    clear()
    setPhase(next)
    const sc = SCENARIOS[i]

    if (next === 'typing-msg') {
      setTypedMsg('')
      setTypedResp('')
      let n = 0
      ivRef.current = setInterval(() => {
        n++
        setTypedMsg(sc.message.slice(0, n))
        if (n >= sc.message.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => go('analyzing', i), 500)
        }
      }, 20)
    } else if (next === 'analyzing') {
      tRef.current = setTimeout(() => go('detected', i), 2200)
    } else if (next === 'detected') {
      tRef.current = setTimeout(() => go('typing-resp', i), 1400)
    } else if (next === 'typing-resp') {
      setTypedResp('')
      let n = 0
      ivRef.current = setInterval(() => {
        n++
        setTypedResp(sc.response.slice(0, n))
        if (n >= sc.response.length) {
          clearInterval(ivRef.current)
          tRef.current = setTimeout(() => go('done', i), 300)
        }
      }, 16)
    } else if (next === 'done') {
      tRef.current = setTimeout(() => go('exit', i), 3000)
    } else if (next === 'exit') {
      setFading(true)
      tRef.current = setTimeout(() => {
        const ni = (i + 1) % SCENARIOS.length
        setIdx(ni)
        setFading(false)
        go('typing-msg', ni)
      }, 700)
    } else if (next === 'idle') {
      tRef.current = setTimeout(() => go('typing-msg', i), 900)
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    tRef.current = setTimeout(() => go('typing-msg', 0), 1200)
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sc = SCENARIOS[idx]
  const showDetected = phase === 'detected' || phase === 'typing-resp' || phase === 'done'
  const showResp = phase === 'typing-resp' || phase === 'done'

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred glow backdrop */}
      <div aria-hidden style={{
        position: 'absolute',
        inset: '-60px',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(132,204,22,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* App window */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        borderRadius: '0.875rem',
        border: '1px solid #222225',
        backgroundColor: '#09090b',
        width: '100%',
        overflow: 'hidden',
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        opacity: entered ? 1 : 0,
        transition: 'transform 800ms cubic-bezier(0.16,1,0.3,1), opacity 700ms ease',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.7)',
      }}>

        {/* Browser chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderBottom: '1px solid #1c1c1f', backgroundColor: '#060608' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{
            flex: 1,
            margin: '0 0.5rem',
            backgroundColor: '#111114',
            border: '1px solid #2a2a2e',
            borderRadius: '0.35rem',
            padding: '0.22rem 0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.575rem',
            color: '#52525b',
            letterSpacing: '0.04em',
            textAlign: 'center',
            transition: 'color 0.5s ease',
          }}>
            pushback.to / projects / {sc.project}
          </div>
        </div>

        {/* App body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '172px 1fr',
          height: '480px',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }}>

          {/* Sidebar */}
          <div style={{ borderRight: '1px solid #161619', backgroundColor: '#060608', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e4e4e7', marginBottom: '0.35rem', paddingLeft: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sc.project}
            </p>
            <p style={{ fontSize: '0.55rem', color: '#3f3f46', letterSpacing: '0.06em', marginBottom: '1.25rem', paddingLeft: '0.5rem' }}>
              1 project
            </p>
            <p style={{ fontSize: '0.5rem', color: '#3f3f46', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
              Defense tools
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {SIDEBAR_TOOLS.map(tool => {
                const isActive = tool === sc.tool && showDetected
                return (
                  <div key={tool} style={{
                    padding: '0.4rem 0.5rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.64rem',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#84cc16' : '#52525b',
                    backgroundColor: isActive ? 'rgba(132,204,22,0.08)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#84cc16' : 'transparent'}`,
                    transition: 'all 0.4s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {tool}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main content */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', minWidth: 0 }}>

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '1.5rem' }}>
              {phase === 'idle' && (
                <span style={{ fontSize: '0.58rem', color: '#3f3f46', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Waiting for message</span>
              )}
              {phase === 'typing-msg' && (
                <span style={{ fontSize: '0.58rem', color: '#84cc16', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Pasting client message...</span>
              )}
              {phase === 'analyzing' && (
                <span style={{ fontSize: '0.58rem', color: '#84cc16', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Analyzing situation...</span>
              )}
              {showDetected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: 'rgba(132,204,22,0.1)',
                    color: '#84cc16',
                    border: '1px solid rgba(132,204,22,0.25)',
                    borderRadius: '4px',
                    padding: '0.1rem 0.5rem',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {sc.tool} — detected
                  </span>
                  {phase === 'typing-resp' && <span style={{ fontSize: '0.58rem', color: '#52525b' }}>Generating response...</span>}
                  {phase === 'done' && <span style={{ fontSize: '0.58rem', color: '#22c55e', fontWeight: 600 }}>Ready to send</span>}
                </div>
              )}
            </div>

            {/* Client message panel */}
            {phase !== 'idle' && (
              <div>
                <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                  From: {sc.client}
                </p>
                <div style={{
                  backgroundColor: '#111114',
                  border: '1px solid #27272a',
                  borderRadius: '0.5rem',
                  padding: '0.875rem 1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: '#a1a1aa',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '130px',
                  overflowY: 'auto',
                }}>
                  {phase === 'typing-msg' ? typedMsg : sc.message}
                  {phase === 'typing-msg' && (
                    <span style={{ display: 'inline-block', width: '1.5px', height: '0.85em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
                  )}
                </div>
              </div>
            )}

            {/* Analyzing pulse */}
            {phase === 'analyzing' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', backgroundColor: 'rgba(132,204,22,0.04)', border: '1px solid rgba(132,204,22,0.1)', borderRadius: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#84cc16', flexShrink: 0, marginTop: '0.15rem', animation: 'pulse 1.1s ease-in-out infinite' }} />
                <div>
                  <p style={{ fontSize: '0.72rem', color: '#84cc16', fontWeight: 600, marginBottom: '0.25rem' }}>Reading situation...</p>
                  <p style={{ fontSize: '0.65rem', color: '#52525b', lineHeight: 1.5 }}>Identifying situation type · Checking contract context · Selecting best defense tool</p>
                </div>
              </div>
            )}

            {/* Response panel */}
            {showResp && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Your response — {sc.tool}
                </p>
                <div style={{
                  flex: 1,
                  backgroundColor: '#0b1a0c',
                  border: '1px solid rgba(132,204,22,0.15)',
                  borderRadius: '0.5rem',
                  padding: '0.875rem 1rem',
                  fontSize: '0.7rem',
                  color: '#d4d4d8',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: '110px',
                  maxHeight: '180px',
                  overflowY: 'hidden',
                }}>
                  {typedResp}
                  {phase === 'typing-resp' && (
                    <span style={{ display: 'inline-block', width: '1.5px', height: '0.85em', backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px', animation: 'blink 0.9s step-end infinite' }} />
                  )}
                </div>
                {phase === 'done' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button style={{ backgroundColor: '#84cc16', color: '#0a0a0a', border: 'none', borderRadius: '0.375rem', padding: '0.45rem 1.1rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(132,204,22,0.4)', letterSpacing: '0.02em' }}>
                      Copy Message
                    </button>
                    <button style={{ backgroundColor: 'transparent', color: '#71717a', border: '1px solid #3f3f46', borderRadius: '0.375rem', padding: '0.45rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer' }}>
                      Edit first
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
