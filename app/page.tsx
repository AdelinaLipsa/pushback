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

const HOW_IT_WORKS_STEPS = [
  { num: '01', label: 'Paste the client message' },
  { num: '02', label: 'Pick your defense tool' },
  { num: '03', label: 'Copy a professional reply' },
]

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
            el.style.transform = 'translateY(0) translateX(0)'
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
        const from = htmlEl.dataset.animateFrom || 'up'
        const delay = htmlEl.dataset.animateDelay || '0'
        const tx = from === 'left' ? '-28px' : from === 'right' ? '28px' : '0px'
        const ty = from === 'up' ? '28px' : '0px'
        htmlEl.style.opacity = '0'
        htmlEl.style.transform = `translateY(${ty}) translateX(${tx})`
        htmlEl.style.transition = `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
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

      {/* How it works */}
      <section className="py-24 border-t border-[#1c1c1e]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12" data-animate>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>How it works</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              Every client situation has a correct response.<br />You now have all of them.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '40ch', margin: '0 auto' }}>
              Paste the message. Pushback identifies what&apos;s happening and drafts a firm, copy-ready reply in under 30 seconds.
            </p>
          </div>

          <div data-animate data-animate-delay="150"><DemoAnimation /></div>

          <div className="flex justify-around mt-10 px-4">
            {HOW_IT_WORKS_STEPS.map(({ num, label }, idx) => (
              <div key={num} className="text-center" data-animate data-animate-delay={String(idx * 120)}>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-lime)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{num}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Carousel — 3D coverflow */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6" data-animate style={{ marginBottom: '3.5rem' }}>
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
        <div data-animate data-animate-delay="200"><ToolCarousel /></div>
      </section>

      {/* Pricing */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div data-animate style={{ marginBottom: '4rem', textAlign: 'center' }}>
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
            <div data-animate data-animate-from="left" data-animate-delay="150" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
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
            <div data-animate data-animate-from="right" data-animate-delay="250" style={{
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
