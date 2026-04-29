'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Copy, AlertTriangle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

// ─── Pre-computed responses (no AI calls in demo) ────────────────────────────

const SCENARIOS = [
  {
    id: 'chargeback_threat' as const,
    label: 'Chargeback threat',
    tool: 'Chargeback Threat',
    message: `Hi Alex, I've reviewed the website and honestly I'm not happy with how it turned out — the design feels off and it doesn't match what I had in mind. I've spoken to my bank and they said I can dispute the charge. I paid €2,400 and at this point I don't think that's justified. I'm giving you 48 hours to sort this out or I'll go ahead with the dispute.\n\n— Mark`,
    response: `Hi Mark,

Thank you for reaching out. I want to address this directly.

The website was built to the specification agreed in our contract and reviewed across three milestone sign-offs, including your written delivery confirmation on April 12th. I have complete documentation of every stage: the approved brief, all revision feedback, the signed delivery confirmation, and full correspondence.

Regarding a bank dispute — a chargeback filed against services that have been delivered and accepted constitutes a fraudulent dispute. If one is initiated, I will respond through the formal process with full documentation. That is standard practice and well within my rights.

If there is a specific deliverable you believe wasn't completed per our agreement, I'm genuinely open to reviewing it. Please identify the specific item so we can address it directly.

To resolve this without further escalation: reply with your specific concern by end of business Thursday.

Alex`,
  },
  {
    id: 'review_threat' as const,
    label: 'Review threat',
    tool: 'Review Threat',
    message: `Alex, I want to be upfront — I'm going to leave a 1-star review on Google and Trustpilot and post about this on LinkedIn unless you give me a full refund. The project came in 2 weeks late (even though we couldn't get you the content on time) and I just don't feel I got what I paid for. I have 8,000 LinkedIn followers and I'm prepared to use that if this isn't resolved.\n\n— Claire`,
    response: `Hi Claire,

I've noted your message and want to respond professionally.

The project was delivered per the agreed brief. The delay you've referenced was caused by a three-week wait on content from your team — this is documented in our email thread and was communicated to you in writing at the time. The final delivery date was adjusted accordingly, with your acknowledgement.

I maintain full records of every communication, approval, and deliverable exchanged during this project.

Regarding a public review or social media post: that's your right. However, it does not change the contractual situation, and a refund for completed and accepted work is not something I'm able to offer.

If there is a specific element of the delivery you believe was not completed per our agreement, please respond with the specific item and I'll address it directly.

Alex`,
  },
  {
    id: 'ip_dispute' as const,
    label: 'IP dispute',
    tool: 'IP / Source File Dispute',
    message: `Hi, now that the website is live I'd like all the working files — the Figma designs, the CSS source, and especially the custom icon set and component library you built. We paid for this project so everything created for it belongs to us. Can you send a zip of everything? Our dev team will need to make updates going forward.\n\n— Tom`,
    response: `Hi Tom,

Happy to clarify what's included in the handoff.

The deliverables under our agreement are the final website files — exported assets, production-ready code, and all materials created specifically for this project. These have been delivered in full.

The Figma working files, CSS architecture, and component library are not part of the contracted deliverables. The component library in particular is a proprietary framework developed across years of client work — it was never part of our agreement, and ownership of it was not transferred.

If your team needs to make updates going forward, the standard options are a maintenance retainer or a source file licence for the project-specific files. I'm happy to quote either option.

Alex`,
  },
]

// ─── Pre-computed red flag analysis ──────────────────────────────────────────

type RedFlag = {
  title: string
  quote: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  what_it_means: string
  question_to_ask: string
}

type RedFlagSample = {
  label: string
  message: string
  analysis: {
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    verdict: string
    proceed: 'yes' | 'caution' | 'no'
    red_flags: RedFlag[]
    green_flags: string[]
  }
}

const RF_SAMPLES: RedFlagSample[] = [
  {
    label: 'Classic red flags',
    message: `Hi! I found your portfolio and love your style. I run a small startup and have a really exciting project — we need a full brand identity, website, social media templates, the whole package. Budget is a bit flexible right now (we're pre-revenue) but this would be great exposure and we can discuss payment once we see how the first round goes. We need it pretty much ASAP — like 2 weeks. Oh and we'll need to run it by our investors before officially signing off, so there might be some back and forth. Let me know your thoughts!`,
    analysis: {
      risk_level: 'high' as const,
      verdict: 'Multiple serious red flags — budget deflection, spec work framing, ASAP pressure, and decision-maker ambiguity all present in one message.',
      proceed: 'no' as const,
      red_flags: [
        {
          title: 'Budget deflection',
          quote: 'Budget is a bit flexible right now (we\'re pre-revenue)',
          severity: 'high' as const,
          what_it_means: 'No real budget has been set. "Flexible" typically means they want to negotiate down after seeing your work.',
          question_to_ask: 'What is the maximum budget you\'ve allocated for this project?',
        },
        {
          title: 'Spec work / exposure payment',
          quote: 'this would be great exposure and we can discuss payment once we see how the first round goes',
          severity: 'critical' as const,
          what_it_means: 'They want to see work before committing to pay. "First round" implies delivery before any payment is agreed.',
          question_to_ask: 'Are you prepared to sign a contract and pay a 50% deposit before work begins?',
        },
        {
          title: 'Decision-maker ambiguity',
          quote: 'we\'ll need to run it by our investors before officially signing off',
          severity: 'medium' as const,
          what_it_means: 'You\'re not talking to the person who can approve the work or release payment. Every decision will involve a hidden stakeholder.',
          question_to_ask: 'Who has final sign-off authority, and will they be available to join the kickoff call?',
        },
      ],
      green_flags: ['Mentioned they found your portfolio, suggesting genuine interest in your style'],
    },
  },
  {
    label: 'Scope minimization',
    message: `Hey, we need a quick e-commerce site built. It's pretty straightforward — just a shop with a few products, a cart, checkout, account management, maybe a blog, and integrations with our CRM. Shouldn't take more than a few days for someone experienced. The last developer quoted us €8,000 which seemed way too high. We're thinking more like €1,200. Can you do it?`,
    analysis: {
      risk_level: 'high' as const,
      verdict: 'Scope minimization, competitor price undercutting, and a €6,800 gap between expectation and market rate — proceed only with firm scope and payment terms in writing.',
      proceed: 'caution' as const,
      red_flags: [
        {
          title: 'Scope minimization',
          quote: 'Shouldn\'t take more than a few days for someone experienced',
          severity: 'high' as const,
          what_it_means: 'They\'ve decided how long your work should take. This mindset leads to disputes when billing exceeds their estimate.',
          question_to_ask: 'Are you open to a fixed-scope contract where the price is agreed upfront regardless of hours?',
        },
        {
          title: 'Competitor price pressure',
          quote: 'The last developer quoted us €8,000 which seemed way too high',
          severity: 'medium' as const,
          what_it_means: 'The market quote was €8,000 — they\'re asking you to undercut it by 85%. Either the scope is being undersold or they\'ll push back on every invoice.',
          question_to_ask: 'The previous quote was from a professional — can you share what was included in their scope so I can compare accurately?',
        },
      ],
      green_flags: ['Specific list of features suggests they\'ve thought about what they need', 'Direct about budget expectations upfront'],
    },
  },
  {
    label: 'IP grab',
    message: `Hi, looking for a designer for a brand identity project. Quick question before we start — we'll need full ownership of absolutely everything you create, including any tools, templates, or components you use in the process. Also we'd need you to sign an NDA saying you can't show any of this work publicly or add it to your portfolio. Budget is flexible. Interesting?`,
    analysis: {
      risk_level: 'critical' as const,
      verdict: 'Demanding ownership of pre-existing tools and portfolio blackout before even discussing budget — these terms would permanently limit your business.',
      proceed: 'no' as const,
      red_flags: [
        {
          title: 'Pre-existing IP grab',
          quote: 'full ownership of absolutely everything you create, including any tools, templates, or components you use',
          severity: 'critical' as const,
          what_it_means: 'They want to own your design system, templates, and tools — assets you\'ve built over years and use across clients. Agreeing would prevent you from using your own work.',
          question_to_ask: 'Can you clarify whether you\'re asking to own the final brand deliverables, or also any pre-existing tools and components I brought to the project?',
        },
        {
          title: 'Portfolio blackout NDA',
          quote: 'sign an NDA saying you can\'t show any of this work publicly or add it to your portfolio',
          severity: 'high' as const,
          what_it_means: 'No portfolio credit means no future work from this project. This kind of NDA typically requires a significant premium to compensate.',
          question_to_ask: 'Portfolio rights are a significant concession — is there a fee uplift on the table for waiving them?',
        },
      ],
      green_flags: [],
    },
  },
]

type ScenarioId = (typeof SCENARIOS)[number]['id']
type DemoTab = 'situation' | 'red-flag'

const DOT_DELAY = ['0s', '0.2s', '0.4s']

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#ef4444' },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: '#ef4444' },
  medium:   { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: '#f97316' },
  low:      { color: '#a3a3a3', bg: 'rgba(163,163,163,0.08)', border: '#3f3f46' },
}

const PROCEED_CONFIG = {
  yes:     { label: 'Safe to proceed',    color: '#84cc16', bg: 'rgba(132,204,22,0.08)', border: 'rgba(132,204,22,0.2)' },
  caution: { label: 'Proceed with caution', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  no:      { label: 'Do not accept',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
}

const RISK_LEVEL_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  medium:   { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  low:      { color: '#84cc16', bg: 'rgba(132,204,22,0.08)' },
}

// ─── Situation tab ────────────────────────────────────────────────────────────

function SituationTab() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('chargeback_threat')
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'typing' | 'done'>('idle')
  const [typedResponse, setTypedResponse] = useState('')
  const [copied, setCopied] = useState(false)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => clearInterval(ivRef.current), [])

  useEffect(() => {
    if (responseRef.current && (demoState === 'typing' || demoState === 'done')) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [typedResponse, demoState])

  function selectScenario(id: ScenarioId) {
    clearInterval(ivRef.current)
    setActiveScenario(id)
    setTypedResponse('')
    setDemoState('idle')
  }

  function runDemo() {
    if (demoState === 'loading' || demoState === 'typing') return
    const scenario = SCENARIOS.find(s => s.id === activeScenario)!
    clearInterval(ivRef.current)
    setTypedResponse('')
    setDemoState('loading')

    // Simulate short network delay then type out the pre-written response
    setTimeout(() => {
      setDemoState('typing')
      const text = scenario.response
      let n = 0
      ivRef.current = setInterval(() => {
        n += 5
        setTypedResponse(text.slice(0, n))
        if (n >= text.length) { clearInterval(ivRef.current); setDemoState('done') }
      }, 16)
    }, 900)
  }

  function copyResponse() {
    const scenario = SCENARIOS.find(s => s.id === activeScenario)!
    navigator.clipboard.writeText(scenario.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scenario = SCENARIOS.find(s => s.id === activeScenario)!
  const showResponse = demoState === 'typing' || demoState === 'done'
  const busy = demoState === 'loading' || demoState === 'typing'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SCENARIOS.map(sc => {
          const isActive = activeScenario === sc.id
          return (
            <button
              key={sc.id}
              onClick={() => selectScenario(sc.id)}
              disabled={busy}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
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
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Client message — read-only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
              Client message
            </p>
            <div style={{
              height: '192px', backgroundColor: '#111114', border: '1px solid #27272a', borderRadius: '0.5rem',
              padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: '#71717a', lineHeight: 1.75, overflowY: 'auto', scrollbarWidth: 'none', whiteSpace: 'pre-wrap',
            }}>
              {scenario.message}
            </div>
          </div>
          <button
            onClick={runDemo}
            disabled={busy}
            style={{
              backgroundColor: busy ? 'rgba(132,204,22,0.45)' : '#84cc16',
              color: '#0a0a0a', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem',
              fontWeight: 700, fontSize: '0.85rem', cursor: busy ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              letterSpacing: '-0.01em', transition: 'background-color 0.2s ease',
            }}
          >
            {busy ? 'Generating...' : 'Generate response'}
          </button>
          <p style={{ fontSize: '0.65rem', color: '#3f3f46', lineHeight: 1.5 }}>
            Showing a real example.{' '}
            <Link href="/signup" style={{ color: '#52525b', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Sign up
            </Link>
            {' '}to generate one for your situation.
          </p>
        </div>

        {/* Response */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {!showResponse ? (
            <div style={{
              height: '100%', minHeight: '192px', backgroundColor: '#0b0b0e', border: '1px solid #1a1a1d',
              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '0.625rem', padding: '1.5rem',
            }}>
              {demoState === 'loading' ? (
                <>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {DOT_DELAY.map((d, i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', backgroundColor: '#84cc16',
                        animation: `demo-dot 1.4s ease-in-out ${d} infinite`,
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.62rem', color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Drafting response...
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
                flex: 1, backgroundColor: '#0b1a0c', border: '1px solid rgba(132,204,22,0.15)',
                borderRadius: '0.5rem', padding: '0.875rem 1rem', fontSize: '0.72rem', color: '#d4d4d8',
                lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                minHeight: '192px', maxHeight: '260px', overflowY: 'auto', scrollbarWidth: 'none',
              }}>
                {typedResponse}
                {demoState === 'typing' && (
                  <span style={{
                    display: 'inline-block', width: '1.5px', height: '0.85em',
                    backgroundColor: '#84cc16', verticalAlign: 'text-bottom', marginLeft: '1px',
                    animation: 'blink 0.9s step-end infinite',
                  }} />
                )}
              </div>
              {demoState === 'done' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={copyResponse}
                    style={{
                      backgroundColor: copied ? 'rgba(132,204,22,0.12)' : '#84cc16',
                      color: copied ? '#84cc16' : '#0a0a0a',
                      border: copied ? '1px solid rgba(132,204,22,0.25)' : 'none',
                      borderRadius: '0.375rem', padding: '0.45rem 1rem', fontSize: '0.7rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: '0.375rem', transition: 'all 0.2s ease',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy message'}
                  </button>
                  <Link href="/signup" style={{
                    display: 'flex', alignItems: 'center', backgroundColor: 'transparent',
                    color: 'var(--text-secondary)', border: '1px solid #2a2a2e',
                    borderRadius: '0.375rem', padding: '0.45rem 1rem', fontSize: '0.7rem',
                    fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                  }} className="hover:border-white/20 hover:text-white transition-colors">
                    Try with your situation →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {demoState === 'done' && (
        <div style={{
          marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid #1a1a1d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Sign up to use your own situation, analyze your contract, and access all 23 tools.
          </p>
          <Link href="/signup" style={{
            backgroundColor: '#84cc16', color: '#0a0a0a', padding: '0.6rem 1.4rem',
            borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none',
            whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }} className="hover:opacity-90 transition-opacity">
            Start free — no card required
          </Link>
        </div>
      )}
    </>
  )
}

// ─── Red Flag tab ─────────────────────────────────────────────────────────────

function RedFlagTab() {
  const [activeSample, setActiveSample] = useState(0)
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'done'>('idle')

  function selectSample(i: number) {
    setActiveSample(i)
    setDemoState('idle')
  }

  function runDemo() {
    if (demoState === 'loading') return
    setDemoState('loading')
    setTimeout(() => setDemoState('done'), 1100)
  }

  const sample = RF_SAMPLES[activeSample]
  const result = demoState === 'done' ? sample.analysis : null
  const proceedCfg = result ? PROCEED_CONFIG[result.proceed] : null
  const riskCfg = result ? RISK_LEVEL_CONFIG[result.risk_level] : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {RF_SAMPLES.map((s, i) => {
          const isActive = activeSample === i
          return (
            <button
              key={i}
              onClick={() => selectSample(i)}
              disabled={demoState === 'loading'}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                cursor: demoState === 'loading' ? 'not-allowed' : 'pointer',
                border: `1px solid ${isActive ? 'rgba(239,68,68,0.4)' : '#2a2a2e'}`,
                backgroundColor: isActive ? 'rgba(239,68,68,0.08)' : 'transparent',
                color: isActive ? '#ef4444' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Prospect message — read-only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
              Prospect message
            </p>
            <div style={{
              height: '192px', backgroundColor: '#111114', border: '1px solid #27272a', borderRadius: '0.5rem',
              padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: '#71717a', lineHeight: 1.75, overflowY: 'auto', scrollbarWidth: 'none', whiteSpace: 'pre-wrap',
            }}>
              {sample.message}
            </div>
          </div>
          <button
            onClick={runDemo}
            disabled={demoState === 'loading'}
            style={{
              backgroundColor: demoState === 'loading' ? 'rgba(239,68,68,0.35)' : '#ef4444',
              color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem',
              fontWeight: 700, fontSize: '0.85rem', cursor: demoState === 'loading' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              letterSpacing: '-0.01em', transition: 'background-color 0.2s ease',
            }}
          >
            {demoState === 'loading' ? 'Scanning...' : 'Scan this prospect'}
          </button>
          <p style={{ fontSize: '0.65rem', color: '#3f3f46', lineHeight: 1.5 }}>
            Showing a real example.{' '}
            <Link href="/signup" style={{ color: '#52525b', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Sign up
            </Link>
            {' '}to scan your own prospects.
          </p>
        </div>

        {/* Analysis output */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {!result ? (
            <div style={{
              height: '100%', minHeight: '192px', backgroundColor: '#0b0b0e', border: '1px solid #1a1a1d',
              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '0.625rem', padding: '1.5rem',
            }}>
              {demoState === 'loading' ? (
                <>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {DOT_DELAY.map((d, i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444',
                        animation: `demo-dot 1.4s ease-in-out ${d} infinite`,
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.62rem', color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Analyzing prospect...
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle size={22} style={{ color: '#27272a' }} />
                  <p style={{ fontSize: '0.72rem', color: '#2a2a2e', fontWeight: 600 }}>Risk analysis appears here</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '320px', overflowY: 'auto', scrollbarWidth: 'none' }}>
              {/* Verdict bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                backgroundColor: proceedCfg!.bg, border: `1px solid ${proceedCfg!.border}`,
                borderRadius: '0.5rem', padding: '0.625rem 0.875rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {result.proceed === 'yes'
                    ? <ShieldCheck size={13} style={{ color: proceedCfg!.color, flexShrink: 0 }} />
                    : <AlertTriangle size={13} style={{ color: proceedCfg!.color, flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: proceedCfg!.color }}>{proceedCfg!.label}</span>
                </div>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem', borderRadius: '3px',
                  color: riskCfg!.color, backgroundColor: riskCfg!.bg,
                }}>
                  {result.risk_level} risk
                </span>
              </div>

              <p style={{ fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.6, padding: '0 0.125rem' }}>
                {result.verdict}
              </p>

              {result.red_flags.map((flag, i) => {
                const cfg = SEVERITY_CONFIG[flag.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.medium
                return (
                  <div key={i} style={{
                    backgroundColor: '#0d0d0d', border: `1px solid #222225`,
                    borderLeft: `3px solid ${cfg.border}`, borderRadius: '0.5rem', padding: '0.75rem 0.875rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        padding: '0.1rem 0.4rem', borderRadius: '3px', color: cfg.color, backgroundColor: cfg.bg,
                      }}>
                        {flag.severity}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e4e4e7' }}>{flag.title}</span>
                    </div>
                    {flag.quote && (
                      <p style={{ fontSize: '0.68rem', color: '#71717a', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                        &ldquo;{flag.quote}&rdquo;
                      </p>
                    )}
                    <p style={{ fontSize: '0.7rem', color: '#a1a1aa', lineHeight: 1.55 }}>{flag.what_it_means}</p>
                  </div>
                )
              })}

              {result.green_flags.length > 0 && (
                <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'rgba(132,204,22,0.04)', border: '1px solid rgba(132,204,22,0.1)', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.55rem', color: '#84cc16', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Green flags</p>
                  {result.green_flags.map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: i < result.green_flags.length - 1 ? '0.25rem' : 0 }}>
                      <Check size={10} style={{ color: '#84cc16', flexShrink: 0, marginTop: '0.2rem' }} />
                      <p style={{ fontSize: '0.7rem', color: '#71717a', lineHeight: 1.5 }}>{g}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {demoState === 'done' && (
        <div style={{
          marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid #1a1a1d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Sign up to scan your own prospects — full flag list, questions to ask, and all 23 defense tools.
          </p>
          <Link href="/signup" style={{
            backgroundColor: '#84cc16', color: '#0a0a0a', padding: '0.6rem 1.4rem',
            borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none',
            whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }} className="hover:opacity-90 transition-opacity">
            Start free — no card required
          </Link>
        </div>
      )}
    </>
  )
}

// ─── Outer shell ──────────────────────────────────────────────────────────────

export default function LiveDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>('situation')

  const TABS: { id: DemoTab; label: string; sub: string }[] = [
    { id: 'situation',  label: 'Draft a response',   sub: 'Client sent a difficult message' },
    { id: 'red-flag',   label: 'Vet a client',        sub: 'New prospect — spot warning signs first' },
  ]

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
            Real examples from our engine. Sign up to run it against your own situations.
          </p>
        </div>

        <div
          data-animate
          data-animate-delay="150"
          style={{
            backgroundColor: '#0d0d0d', border: '1px solid #222225', borderRadius: '1rem', overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 120px rgba(0,0,0,0.6)', position: 'relative',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', inset: '-80px',
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(132,204,22,0.04) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Tab bar */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderBottom: '1px solid #1a1a1d' }}>
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: '1rem 1.25rem', textAlign: 'left', cursor: 'pointer',
                    backgroundColor: isActive ? '#111114' : 'transparent',
                    borderBottom: `2px solid ${isActive ? (tab.id === 'red-flag' ? '#ef4444' : '#84cc16') : 'transparent'}`,
                    border: 'none',
                    borderRight: i < TABS.length - 1 ? '1px solid #1a1a1d' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#e4e4e7' : '#52525b', marginBottom: '0.15rem', transition: 'color 0.2s ease' }}>
                    {tab.label}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: isActive ? '#71717a' : '#3f3f46', transition: 'color 0.2s ease' }}>
                    {tab.sub}
                  </p>
                </button>
              )
            })}
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            {activeTab === 'situation' ? <SituationTab /> : <RedFlagTab />}
          </div>
        </div>
      </div>
    </section>
  )
}
