'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import Link from 'next/link'

const SCENARIOS = [
  {
    id: 'scope_change' as const,
    label: 'Scope creep',
    tool: 'Scope Change',
    message: `Hi Alex,\n\nQuick one — since we're already building the site, could we add a mobile app to the scope as well? Same budget, my boss just brought it up. It honestly doesn't seem like much extra work from our side.\n\nAlso, any chance we can move the deadline to next Friday?\n\nThanks! — Sarah`,
  },
  {
    id: 'payment_final' as const,
    label: 'Payment dispute',
    tool: 'Payment Notice',
    message: `Hey Alex, just reviewing the invoice before we send payment. Honestly, the project took longer than expected on our end to review and the back-and-forth added up. We feel €1,800 is more in line with the value delivered. Can you reissue at that amount?\n\n— Marcus`,
  },
  {
    id: 'revision_limit' as const,
    label: 'Revision demand',
    tool: 'Revision Limit',
    message: `Hi! Love the latest version, just a few more tweaks — can we move the hero image, rework the nav layout, update the colour palette to be warmer, and also revisit the footer? Shouldn't be too much work!\n\n— Priya`,
  },
]

type ScenarioId = (typeof SCENARIOS)[number]['id']
type DemoState = 'idle' | 'loading' | 'typing' | 'done' | 'error' | 'limited'

const DOT_DELAY = ['0s', '0.2s', '0.4s']

export default function LiveDemo() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('scope_change')
  const [message, setMessage] = useState(SCENARIOS[0].message)
  const [state, setState] = useState<DemoState>('idle')
  const [typedResponse, setTypedResponse] = useState('')
  const [fullResponse, setFullResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => clearInterval(ivRef.current), [])

  useEffect(() => {
    if (responseRef.current && (state === 'typing' || state === 'done')) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [typedResponse, state])

  function selectScenario(id: ScenarioId) {
    clearInterval(ivRef.current)
    setActiveScenario(id)
    setMessage(SCENARIOS.find(s => s.id === id)!.message)
    setTypedResponse('')
    setFullResponse('')
    setState('idle')
    setErrorMsg('')
  }

  const generate = useCallback(async () => {
    if (state === 'loading' || state === 'typing') return
    if (message.trim().length < 20) {
      setErrorMsg('Please describe the client situation (at least 20 characters).')
      setState('error')
      return
    }

    clearInterval(ivRef.current)
    setState('loading')
    setTypedResponse('')
    setFullResponse('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_type: activeScenario, situation: message.trim() }),
      })

      if (res.status === 429) { setState('limited'); return }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong — please try again.')
        setState('error')
        return
      }

      const data = await res.json() as { response: string }
      const text = data.response ?? ''
      setFullResponse(text)
      setState('typing')
      let n = 0
      ivRef.current = setInterval(() => {
        n += 4
        setTypedResponse(text.slice(0, n))
        if (n >= text.length) { clearInterval(ivRef.current); setState('done') }
      }, 16)
    } catch {
      setErrorMsg('Connection error — please try again.')
      setState('error')
    }
  }, [state, message, activeScenario])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); generate() }
  }

  function copyResponse() {
    navigator.clipboard.writeText(fullResponse)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scenario = SCENARIOS.find(s => s.id === activeScenario)!
  const showResponse = state === 'typing' || state === 'done'
  const busy = state === 'loading' || state === 'typing'

  return (
    <section id="live-demo" style={{ borderTop: '1px solid #1c1c1e' }} className="py-28">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes demo-dot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12" data-animate>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>
            Live demo
          </p>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
            Try it. No account needed.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '40ch', margin: '0 auto' }}>
            Real AI. Same response engine as the full product. Pick a scenario or paste your own.
          </p>
        </div>

        <div
          data-animate
          data-animate-delay="150"
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #222225',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 120px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', inset: '-80px',
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(132,204,22,0.05) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            {/* Scenario chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {SCENARIOS.map(sc => {
                const isActive = activeScenario === sc.id
                return (
                  <button
                    key={sc.id}
                    onClick={() => selectScenario(sc.id)}
                    disabled={busy}
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: busy ? 'not-allowed' : 'pointer',
                      border: `1px solid ${isActive ? 'rgba(132,204,22,0.45)' : '#2a2a2e'}`,
                      backgroundColor: isActive ? 'rgba(132,204,22,0.1)' : 'transparent',
                      color: isActive ? '#84cc16' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {sc.label}
                  </button>
                )
              })}
              <span style={{ fontSize: '0.68rem', color: '#2a2a2e', marginLeft: '0.25rem' }}>
                or type your own
              </span>
            </div>

            {/* Two-column layout */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Client message
                  </p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={busy}
                    style={{
                      width: '100%',
                      height: '192px',
                      backgroundColor: '#111114',
                      border: '1px solid #27272a',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: '#a1a1aa',
                      lineHeight: 1.75,
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Paste or type a client message..."
                  />
                </div>

                <button
                  onClick={generate}
                  disabled={busy}
                  style={{
                    backgroundColor: busy ? 'rgba(132,204,22,0.45)' : '#84cc16',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    letterSpacing: '-0.01em',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {state === 'loading' ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Generating...
                    </>
                  ) : (
                    <>Generate response <span style={{ opacity: 0.65, fontSize: '0.75rem' }}>⌘↵</span></>
                  )}
                </button>

                {state === 'error' && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', lineHeight: 1.5 }}>{errorMsg}</p>
                )}
                {state === 'limited' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    You&apos;ve used your free demo.{' '}
                    <Link href="/signup" style={{ color: 'var(--brand-lime)', fontWeight: 600, textDecoration: 'none' }}>
                      Sign up free
                    </Link>{' '}
                    — no card required, 5 responses included.
                  </p>
                )}
              </div>

              {/* Response */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {!showResponse ? (
                  <div style={{
                    height: '100%',
                    minHeight: '192px',
                    backgroundColor: '#0b0b0e',
                    border: '1px solid #1a1a1d',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    padding: '1.5rem',
                  }}>
                    {state === 'loading' ? (
                      <>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {DOT_DELAY.map((d, i) => (
                            <div key={i} style={{
                              width: 7, height: 7, borderRadius: '50%',
                              backgroundColor: '#84cc16',
                              animation: `demo-dot 1.4s ease-in-out ${d} infinite`,
                            }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '0.62rem', color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                          Analyzing situation...
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 32, height: 32, borderRadius: '0.375rem', border: '1px solid #1e1e22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1e1e22' }} />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#2a2a2e', fontWeight: 600 }}>Response appears here</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Your response — {scenario.tool}
                    </p>
                    <div ref={responseRef} style={{
                      flex: 1,
                      backgroundColor: '#0b1a0c',
                      border: '1px solid rgba(132,204,22,0.15)',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1rem',
                      fontSize: '0.72rem',
                      color: '#d4d4d8',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      minHeight: '192px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      scrollbarWidth: 'none',
                    }}>
                      {typedResponse}
                      {state === 'typing' && (
                        <span style={{
                          display: 'inline-block', width: '1.5px', height: '0.85em',
                          backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px',
                          animation: 'blink 0.9s step-end infinite',
                        }} />
                      )}
                    </div>

                    {state === 'done' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={copyResponse}
                          style={{
                            backgroundColor: copied ? 'rgba(132,204,22,0.12)' : '#84cc16',
                            color: copied ? '#84cc16' : '#0a0a0a',
                            border: copied ? '1px solid rgba(132,204,22,0.25)' : 'none',
                            borderRadius: '0.375rem',
                            padding: '0.45rem 1rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copied' : 'Copy message'}
                        </button>
                        <Link href="/signup" style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid #2a2a2e',
                          borderRadius: '0.375rem',
                          padding: '0.45rem 1rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'border-color 0.2s ease, color 0.2s ease',
                          whiteSpace: 'nowrap',
                        }} className="hover:border-white/20 hover:text-white transition-colors">
                          Try free →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA — visible after response */}
            {state === 'done' && (
              <div style={{
                marginTop: '1.75rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #1a1a1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Sign up to save responses, analyze your contract, and access all 23 situations.
                </p>
                <Link href="/signup" style={{
                  backgroundColor: '#84cc16',
                  color: '#0a0a0a',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }} className="hover:opacity-90 transition-opacity">
                  Start free — no card required
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
