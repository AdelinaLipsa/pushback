'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { PLANS } from '@/lib/plans'
import PushbackHero from '@/components/hero/PushbackHero'
import Footer from '@/components/shared/Footer'
import DemoAnimation from '@/components/hero/DemoAnimation'

const TICKER_ITEMS = [
  'Client wants free revisions',
  'Invoice is 3 weeks overdue',
  'They approved it, now they don\'t like it',
  'Client went silent',
  'They\'re threatening a bad review',
  '"Can we also do a mobile app?"',
  'Project cancelled mid-build',
  'You quoted €3,000, they came back with €900',
  'Delivered and signed off — now they want changes',
  'They want source files you didn\'t include',
  '"This took you less time than expected"',
  'Rush delivery, no rush fee',
]

const BEFORE_EMAIL = `Hi,

I was thinking — since we're already doing the website, could we also add a mobile app? Same budget obviously. My boss really wants it and I think it would be a quick add.

Also can we get this done by next Friday? The original deadline was too long anyway.

Thanks`

const AFTER_MESSAGE = `Hi [Client Name],

Thanks for thinking of me for the mobile app — that sounds like an exciting direction for the business.

That said, our current agreement covers the 5-page website with 2 revision rounds. A mobile app is a separate project scope entirely, and I'd need to scope and price it properly to give you something solid.

I can put together a proposal for the mobile app as a follow-on project. Alternatively, we keep the current project on track and revisit this after launch.

Which would you prefer?

[Your name]`

const DEMO_TOOLS: { label: string; response: string }[] = [
  {
    label: 'Scope Change',
    response: `Hi Sarah,

Thanks for reaching out about the mobile app — sounds like an exciting direction.

That said, our agreement covers the 5-page website with 2 revision rounds. A mobile app is a separate scope entirely, and I'd need to price it properly to deliver something solid.

I can put together a proposal as a follow-on project, or we keep the current work on track and revisit after launch.

Which would you prefer?

— Alex`,
  },
  {
    label: 'Payment Reminder',
    response: `Hi Sarah,

Just a quick note — invoice #1042 for €1,500 was due on April 15th and I haven't seen it come through yet.

Could you confirm payment is on its way? Happy to resend the invoice if that's helpful.

Thanks for sorting this out.

— Alex`,
  },
  {
    label: 'Kill Fee',
    response: `Hi Sarah,

Thanks for letting me know you're pausing the project. As per our agreement, a kill fee of 50% applies to all work completed to date.

I've attached an updated invoice for €750. Once that's settled, I'll send over all files and assets produced so far.

Let me know if you have any questions.

— Alex`,
  },
  {
    label: 'Ghost Client',
    response: `Hi Sarah,

I've followed up a few times without hearing back — just checking in to make sure everything's okay on your end.

If the project direction has changed, no problem at all. I'll hold the work here until I hear from you. After 5 business days of no response, I'll formally pause the project.

— Alex`,
  },
  {
    label: 'Revision Limit',
    response: `Hi Sarah,

Happy to make these changes — just a heads-up that our agreement included 2 revision rounds, and this would be the third.

I can continue at my standard rate of €90/hr, or we can scope a revision package if you're expecting more changes ahead.

Let me know how you'd like to proceed.

— Alex`,
  },
  {
    label: 'Dispute Response',
    response: `Hi Sarah,

I understand you're not satisfied, and I want to resolve this professionally.

The deliverables were completed as agreed, and I have full records of all approvals and communications. I'm happy to discuss specific concerns, but I'm not in a position to issue a refund for completed work.

Let me know what you'd like to address directly.

— Alex`,
  },
]

type DemoPhase = 'idle' | 'selecting' | 'typing' | 'done'

function HowItWorksDemo() {
  const [activeTool, setActiveTool] = useState(0)
  const [phase, setPhase] = useState<DemoPhase>('idle')
  const [typed, setTyped] = useState('')
  const [copied, setCopied] = useState(false)
  const timers = useRef<{ t?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({})
  const responseContainerRef = useRef<HTMLDivElement>(null)

  function beginTool(index: number) {
    if (timers.current.t) clearTimeout(timers.current.t)
    if (timers.current.interval) clearInterval(timers.current.interval)
    setActiveTool(index)
    setTyped('')
    setCopied(false)
    setPhase('selecting')
    timers.current.t = setTimeout(() => {
      setPhase('typing')
      const response = DEMO_TOOLS[index].response
      let i = 0
      timers.current.interval = setInterval(() => {
        i++
        setTyped(response.slice(0, i))
        if (responseContainerRef.current) {
          responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight
        }
        if (i >= response.length) {
          clearInterval(timers.current.interval)
          setPhase('done')
          timers.current.t = setTimeout(() => beginTool((index + 1) % DEMO_TOOLS.length), 4500)
        }
      }, 18)
    }, 700)
  }

  useEffect(() => {
    timers.current.t = setTimeout(() => beginTool(0), 600)
    return () => {
      if (timers.current.t) clearTimeout(timers.current.t)
      if (timers.current.interval) clearInterval(timers.current.interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-[860px] mx-auto">
      {/* Mock app window */}
      <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(132,204,22,0.07),0_32px_80px_rgba(0,0,0,0.4)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-bg-border bg-bg-base">
          <div className="flex gap-1.5">
            {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full opacity-70" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="ml-3 font-mono text-[0.65rem] text-text-muted tracking-[0.1em]">
            pushback.app / projects / Webflow Redesign
          </span>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-2 h-[380px]">
          {/* Left: tool selection */}
          <div className="p-6 border-r border-bg-border">
            <p className="font-mono text-[0.6rem] text-text-muted tracking-[0.12em] uppercase mb-4">
              Select the situation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_TOOLS.map((tool, i) => {
                const isSelected = i === activeTool && phase !== 'idle'
                return (
                  <button
                    key={tool.label}
                    onClick={() => beginTool(i)}
                    className={[
                      'px-3 py-2 rounded-lg text-[0.72rem] text-left border cursor-pointer select-none transition-all duration-300',
                      isSelected
                        ? 'bg-brand-lime text-[#0a0a0a] border-brand-lime font-semibold shadow-[0_0_20px_rgba(132,204,22,0.35)]'
                        : 'bg-bg-elevated text-text-secondary border-bg-border font-normal hover:bg-[#252525] hover:text-text-primary',
                    ].join(' ')}
                  >
                    {tool.label}
                  </button>
                )
              })}
            </div>

            {/* Generate button */}
            <div className="mt-5">
              <div className={[
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-[0.75rem] font-bold select-none transition-all duration-400',
                phase === 'idle'
                  ? 'bg-bg-elevated text-text-muted border border-bg-border'
                  : 'bg-brand-lime text-[#0a0a0a] border border-brand-lime',
              ].join(' ')}>
                <span className={[
                  'inline-block w-1.5 h-1.5 rounded-full transition-colors duration-400',
                  phase === 'idle' ? 'bg-text-muted' : 'bg-[#0a0a0a]',
                ].join(' ')} />
                Generate response
              </div>
            </div>
          </div>

          {/* Right: response with typing animation */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[0.6rem] text-text-muted tracking-[0.12em] uppercase">
                Response
              </p>
              {phase === 'typing' && (
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-brand-lime"
                      style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              )}
              {phase === 'done' && (
                <span className="bg-[rgba(132,204,22,0.15)] text-brand-lime text-[0.58rem] font-bold px-2 py-0.5 rounded tracking-[0.08em]">
                  READY
                </span>
              )}
            </div>

            {/* Text area */}
            <div className="flex-1 relative overflow-hidden">
              {phase === 'idle' && (
                <div className="w-full h-full bg-bg-elevated rounded-lg border border-bg-border flex items-center justify-center">
                  <span className="text-text-muted text-[0.78rem]">Pick a situation to get started</span>
                </div>
              )}
              {phase !== 'idle' && (
                <div
                  ref={responseContainerRef}
                  className={[
                    'bg-bg-elevated rounded-lg p-4 h-full overflow-y-auto transition-all duration-500',
                    phase === 'done'
                      ? 'border border-[rgba(132,204,22,0.3)] shadow-[0_0_30px_rgba(132,204,22,0.08)]'
                      : 'border border-bg-border',
                  ].join(' ')}>
                  {phase === 'selecting' ? (
                    <div className="flex gap-2 items-center">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-brand-lime opacity-50"
                          style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <pre className="text-text-primary text-[0.78rem] leading-[1.75] whitespace-pre-wrap font-[inherit] m-0">
                      {typed}
                      {phase === 'typing' && (
                        <span className="inline-block w-0.5 h-[0.9em] bg-brand-lime align-text-bottom ml-px [animation:blink_0.9s_step-end_infinite]" />
                      )}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Copy button */}
            <div className={[
              'mt-3.5 transition-opacity duration-400',
              phase === 'done' ? 'opacity-100' : 'opacity-0',
            ].join(' ')}>
              <button
                onClick={() => { navigator.clipboard.writeText(DEMO_TOOLS[activeTool].response).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className={[
                  'px-4 py-2 rounded-md text-[0.75rem] font-bold cursor-pointer transition-all duration-200 border',
                  copied
                    ? 'bg-[rgba(132,204,22,0.15)] text-brand-lime border-[rgba(132,204,22,0.4)]'
                    : 'bg-brand-lime text-[#0a0a0a] border-transparent hover:opacity-90',
                ].join(' ')}
              >
                {copied ? 'Copied!' : 'Copy message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step labels below */}
      <div className="flex justify-around mt-8 px-8">
        {[
          { num: '01', label: 'Identify the situation' },
          { num: '02', label: 'Review your position' },
          { num: '03', label: 'Send with confidence' },
        ].map(({ num, label }) => (
          <div key={num} className="text-center">
            <div className="font-mono text-brand-lime text-[0.65rem] font-bold tracking-[0.12em] mb-1">{num}</div>
            <div className="text-text-secondary text-[0.8rem]">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolCarousel() {
  const [active, setActive] = useState(0)
  const [autopaused, setAutopaused] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const dotNavRef = useRef<HTMLDivElement>(null)
  const cardDragRef = useRef(0)
  const n = DEFENSE_TOOLS.length

  useEffect(() => {
    if (autopaused) return
    const id = setInterval(() => setActive(i => (i + 1) % n), 2800)
    return () => clearInterval(id)
  }, [autopaused, n])

  // Card drag — each 60px swept = rotate one card
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId)
      cardDragRef.current = e.clientX
      setAutopaused(true)
    }
    const onMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return
      const steps = Math.trunc((e.clientX - cardDragRef.current) / 60)
      if (steps !== 0) {
        setActive(i => ((i - steps) % n + n) % n)
        cardDragRef.current += steps * 60
      }
    }
    const onUp = () => setAutopaused(false)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [n])

  // Slider drag-to-scrub
  useEffect(() => {
    const el = dotNavRef.current
    if (!el) return
    const scrub = (clientX: number) => {
      const rect = el.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      setActive(Math.round(pct * (n - 1)))
    }
    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      setAutopaused(true)
      scrub(e.clientX)
    }
    const onMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return
      scrub(e.clientX)
    }
    const onUp = () => setAutopaused(false)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [n])

  return (
    <div
      onMouseEnter={() => setAutopaused(true)}
      onMouseLeave={() => setAutopaused(false)}
    >
      {/* 3D stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          height: '390px',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
          overflow: 'clip',
        }}
      >
        {DEFENSE_TOOLS.map((tool, i) => {
          const raw = i - active
          const half = Math.floor(n / 2)
          const offset = ((raw + half) % n) - half
          const abs = Math.abs(offset)
          if (abs > 2) return null
          const isActive = offset === 0
          const tx = offset * 220

          return (
            <div
              key={tool.type}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: '-130px',
                marginTop: '-170px',
                width: '260px',
                height: '340px',
                backgroundColor: isActive ? '#1c1c1c' : '#0d0d0d',
                border: `1px solid ${isActive ? 'rgba(132,204,22,0.32)' : '#1c1c1c'}`,
                boxShadow: isActive
                  ? 'inset 0 2px 0 rgba(132,204,22,0.7), 0 0 80px rgba(132,204,22,0.13), 0 24px 80px rgba(0,0,0,0.6)'
                  : '0 8px 40px rgba(0,0,0,0.35)',
                borderRadius: '1rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: `translateX(${tx}px) translateZ(${-abs * 75}px) rotateY(${offset * 40}deg) scale(${1 - abs * 0.14})`,
                filter: abs > 0 ? `blur(${abs * 3.5}px)` : 'none',
                opacity: 1 - abs * 0.3,
                zIndex: 20 - abs * 5,
                transition: [
                  'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  'filter 0.7s ease',
                  'opacity 0.7s ease',
                  'border-color 0.5s ease',
                  'box-shadow 0.5s ease',
                  'background-color 0.5s ease',
                ].join(', '),
              }}
            >
              {/* Watermark number */}
              <span style={{
                position: 'absolute',
                bottom: '-0.5rem',
                right: '-0.25rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '8rem',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: isActive ? 'rgba(132,204,22,0.07)' : 'rgba(255,255,255,0.03)',
                pointerEvents: 'none',
                userSelect: 'none',
                transition: 'color 0.5s ease',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Index label */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: isActive ? 'var(--brand-lime)' : 'var(--text-muted)',
                marginBottom: '1.75rem',
                transition: 'color 0.5s ease',
              }}>
                {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </div>

              {/* Title */}
              <div style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: isActive ? 'var(--text-primary)' : '#3f3f46',
                marginBottom: '1rem',
                transition: 'color 0.5s ease',
              }}>
                {tool.label}
              </div>

              {/* Description */}
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                flex: 1,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}>
                {tool.description}
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(132,204,22,0.1)',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  Pushback Toolkit
                </span>
              </div>
            </div>
          )
        })}

        {/* Cinematic side vignettes */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '25%', background: 'linear-gradient(to right, var(--bg-surface) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 50 }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '25%', background: 'linear-gradient(to left, var(--bg-surface) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 50 }} />
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand-lime)', letterSpacing: '0.1em', minWidth: '1.5rem', textAlign: 'right' }}>
          {String(active + 1).padStart(2, '0')}
        </span>

        {/* Track — drag target */}
        <div
          ref={dotNavRef}
          style={{ position: 'relative', width: '220px', height: '20px', cursor: 'ew-resize', userSelect: 'none', touchAction: 'none', display: 'flex', alignItems: 'center' }}
        >
          {/* Rail */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#1a1a1a', borderRadius: '9999px' }} />
          {/* Filled portion */}
          <div style={{
            position: 'absolute', left: 0, height: '2px',
            width: `${(active / (n - 1)) * 100}%`,
            background: 'linear-gradient(to right, rgba(132,204,22,0.2), rgba(132,204,22,0.5))',
            borderRadius: '9999px',
            transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
          {/* Thumb pill */}
          <div style={{
            position: 'absolute',
            left: `${(active / (n - 1)) * 100}%`,
            transform: 'translateX(-50%)',
            width: '2rem', height: '0.875rem',
            backgroundColor: 'var(--brand-lime)',
            borderRadius: '9999px',
            boxShadow: '0 0 12px rgba(132,204,22,0.45)',
            transition: 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', minWidth: '1.5rem' }}>
          {String(n).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach((el) => {
      const htmlEl = el as HTMLElement
      const rect = htmlEl.getBoundingClientRect()
      if (rect.top >= window.innerHeight - 60) {
        htmlEl.style.opacity = '0'
        htmlEl.style.transform = 'translateY(32px)'
        htmlEl.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      }
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <PushbackHero />

      {/* Ticker */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', overflow: 'clip', padding: '0.875rem 0' }}>
        <div className="ticker-track flex gap-8 whitespace-nowrap w-max">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              <span style={{ color: 'var(--brand-lime)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.03em' }}>{item}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* See it in action — animated product demo */}
      <section className="py-20 border-t border-[#1c1c1e]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs tracking-widest text-[#84cc16] uppercase mb-3">See it in action</p>
          <h2 className="text-3xl font-semibold text-white mb-4">From contract to response in seconds</h2>
          <p className="text-[#71717a] mb-10 max-w-lg mx-auto">
            Paste a clause, get a risk score, pick your situation, and copy a professional response — no legal knowledge required.
          </p>
          <DemoAnimation />
        </div>
      </section>

      {/* How It Works */}
      <section data-animate className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>How it works</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, maxWidth: '22ch' }}>
              Every client situation has a correct response. You now have all of them.
            </h2>
          </div>
          <HowItWorksDemo />
        </div>
      </section>

      {/* Tool Carousel — 3D coverflow */}
      <section data-animate style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6" style={{ marginBottom: '3.5rem' }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>The arsenal</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Every situation.<br />Already handled.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '30ch' }}>
              21 situations. Every one of them real. Scope creep, payment stonewalling, chargeback threats, rate pressure, IP disputes, ghost clients — this is not a list of edge cases. This is freelance work in 2025. You now have a prepared response to all of it.
            </p>
          </div>
        </div>
        <ToolCarousel />
      </section>

      {/* Before / After */}
      <section data-animate className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ marginBottom: '4rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>In practice</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              You already have the right response.<br />You just didn&apos;t know it yet.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 items-start">
            {/* Before */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>The situation</p>
              </div>
              <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.875rem', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {[
                    { label: 'From', value: 'client@company.com' },
                    { label: 'Subject', value: 'Quick add — could we also do mobile app?' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <span style={{ color: '#3f3f46', width: '3.5rem', flexShrink: 0 }}>{label}</span>
                      <span style={{ color: '#71717a' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <pre style={{ color: '#71717a', fontSize: '0.83rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{BEFORE_EMAIL}</pre>
                </div>
              </div>
            </div>

            {/* After */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--brand-lime)', display: 'inline-block', flexShrink: 0 }} />
                <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Your position</p>
              </div>
              <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(132,204,22,0.25)', borderRadius: '0.875rem', overflow: 'hidden', boxShadow: '0 0 48px rgba(132,204,22,0.08)' }}>
                <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(132,204,22,0.12)', backgroundColor: 'rgba(132,204,22,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-lime)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>PUSHBACK</span>
                    <span style={{ color: 'rgba(132,204,22,0.3)' }}>·</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Scope defense — Position ready</span>
                  </div>
                  <span style={{ backgroundColor: 'rgba(132,204,22,0.15)', color: 'var(--brand-lime)', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', letterSpacing: '0.08em' }}>READY</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <pre style={{ color: 'var(--text-primary)', fontSize: '0.83rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono), monospace' }}>{AFTER_MESSAGE}</pre>
                </div>
                <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                  <button
                    className="hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
                      fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    Copy Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section data-animate style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Pricing</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              Start free.<br />Own every situation.
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '38ch', margin: '0 auto', lineHeight: 1.7, fontSize: '0.95rem' }}>
              Run your first situation free. No card, no friction. Upgrade when the work gets serious.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Free */}
            <div style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Free</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>€0</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No card required</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem', flex: 1 }}>
                {['1 defense tool response', '1 contract analysis', 'All 8 situation types', 'Copy-ready messages'].map(f => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Check size={14} style={{ color: 'var(--brand-lime)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center',
                border: '1px solid var(--bg-border)', color: 'var(--text-primary)',
                padding: '0.8rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
              }} className="hover:border-white/30 transition-colors">
                Run a free situation
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(132,204,22,0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 0 60px rgba(132,204,22,0.10), inset 0 1px 0 rgba(132,204,22,0.12)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: 'radial-gradient(circle at 100% 0%, rgba(132,204,22,0.12) 0%, transparent 65%)',
                width: '220px', height: '220px',
                pointerEvents: 'none',
              }} />
              <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pro</div>
                  <div style={{ backgroundColor: 'rgba(132,204,22,0.15)', color: 'var(--brand-lime)', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', letterSpacing: '0.1em' }}>RECOMMENDED</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>€{PLANS.pro.price}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>/month</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Cancel anytime · excl. VAT</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem', flex: 1, position: 'relative' }}>
                {PLANS.pro.features.map(f => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Check size={14} style={{ color: 'var(--brand-lime)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center',
                backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
                padding: '0.8rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem',
                position: 'relative',
              }} className="hover:opacity-90 transition-opacity">
                Get full access
              </Link>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem' }}>
            Your contract is never stored after analysis. We read it, flag the risks, delete it.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
