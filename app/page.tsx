'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { PLANS } from '@/lib/plans'
import PushbackHero from '@/components/hero/PushbackHero'
import Footer from '@/components/shared/Footer'

// Heavy below-fold components — split so they don't ship with the hero bundle.
const DemoAnimation = dynamic(() => import('@/components/hero/DemoAnimation'), { ssr: false })
const ReplyThreadAnimation = dynamic(() => import('@/components/hero/ReplyThreadAnimation'), { ssr: false })
const ContractReveal = dynamic(() => import('@/components/hero/ContractReveal'), { ssr: false })
const LiveDemo = dynamic(() => import('@/components/hero/LiveDemo'), { ssr: false })

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
  'New prospect — every answer raises a flag',
  '"Can you show us some concepts first?"',
]

const HOW_IT_WORKS_STEPS = [
  { num: '01', label: 'Describe what the client did' },
  { num: '02', label: 'Pick the tool that matches the situation' },
  { num: '03', label: 'Copy the reply. Send it.' },
]

function StickyNav() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('hero-end')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
    >
      <Link href="/" style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', textDecoration: 'none' }}>
        pushback<span style={{ color: 'var(--brand-lime)' }}>.</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link href="/how-it-works" style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 500, textDecoration: 'none' }} className="hover:text-white transition-colors hidden sm:block">
          How it works
        </Link>
        <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 500, textDecoration: 'none' }} className="hover:text-white transition-colors hidden sm:block">
          Pricing
        </a>
        <Link href="/signup" style={{ backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', padding: '0.45rem 1.1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '-0.01em' }} className="hover:opacity-90 transition-opacity">
          Try free →
        </Link>
      </div>
    </div>
  )
}

function ToolCarousel() {
  const [active, setActive] = useState(0)
  const [autopaused, setAutopaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'coverflow' | 'list'>('coverflow')
  const stageRef = useRef<HTMLDivElement>(null)
  const dotNavRef = useRef<HTMLDivElement>(null)
  const cardDragRef = useRef(0)
  const n = DEFENSE_TOOLS.length

  // filter: blur() on multiple cards kills mid-tier mobile GPUs — fade-only on small screens.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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
      {/* View toggle — coverflow vs full grid */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
        <div role="tablist" aria-label="Tool view" style={{
          display: 'inline-flex',
          padding: '3px',
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--bg-border)',
          borderRadius: '9999px',
          gap: '2px',
        }}>
          {([
            { value: 'coverflow' as const, label: 'Featured' },
            { value: 'list' as const, label: `Browse all ${n}` },
          ]).map(opt => {
            const active = viewMode === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(opt.value)}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  letterSpacing: '0.01em',
                  backgroundColor: active ? 'rgba(132,204,22,0.15)' : 'transparent',
                  color: active ? 'var(--brand-lime)' : 'var(--text-muted)',
                  transition: 'all 200ms ease',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div
          className="max-w-5xl mx-auto px-6 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
        >
          {DEFENSE_TOOLS.map((tool, i) => (
            <div
              key={tool.type}
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--bg-border)',
                borderRadius: '0.75rem',
                padding: '1rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                transition: 'border-color 200ms ease, background-color 200ms ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(132,204,22,0.35)'
                e.currentTarget.style.backgroundColor = 'rgba(132,204,22,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--bg-border)'
                e.currentTarget.style.backgroundColor = 'var(--bg-base)'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--brand-lime)',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{
                fontWeight: 700, fontSize: '0.9rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em', lineHeight: 1.2,
                margin: 0,
              }}>
                {tool.label}
              </p>
              <p style={{
                color: 'var(--text-secondary)', fontSize: '0.76rem',
                lineHeight: 1.55, margin: 0,
              }}>
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <>
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
                filter: !isMobile && abs > 0 ? `blur(${abs * 3.5}px)` : 'none',
                opacity: isMobile ? 1 - abs * 0.55 : 1 - abs * 0.3,
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
        </>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

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
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', overflow: 'clip' }}>
      <StickyNav />
      <PushbackHero />
      <div id="hero-end" style={{ height: 1 }} />

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

      {/* Live demo */}
      <LiveDemo />

      {/* How it works */}
      <section className="py-24 border-t border-[#1c1c1e]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12" data-animate>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>How it works</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              Every client situation has a correct response.<br />You now have all of them covered.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '40ch', margin: '0 auto' }}>
              Select the situation. Describe what happened. Pushback drafts the right response for exactly where the conversation is — firm, professional, copy-ready.
            </p>
          </div>

          <div data-animate data-animate-delay="150"><DemoAnimation /></div>

          <div className="flex flex-wrap justify-around gap-y-6 mt-10 px-4">
            {HOW_IT_WORKS_STEPS.map(({ num, label }, idx) => (
              <div key={num} className="text-center" style={{ minWidth: '7rem' }} data-animate data-animate-delay={String(idx * 120)}>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-lime)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{num}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10" data-animate data-animate-delay="400">
            <Link href="/how-it-works" style={{ color: 'var(--brand-lime)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.01em' }} className="hover:opacity-80 transition-opacity">
              See it in action →
            </Link>
          </div>
        </div>
      </section>

      {/* Contract reveal — scroll-driven frame animation */}
      <ContractReveal />

      {/* Privacy trust strip — appears right after the contract analysis showcase */}
      <section style={{ backgroundColor: 'var(--bg-base)', borderTop: '1px solid #1c1c1e', borderBottom: '1px solid #1c1c1e' }} className="py-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-animate>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '0.15rem' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                  Your contract is analyzed and deleted
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.55, margin: 0 }}>
                  Pushback reads the text to flag clauses, then drops it. The contract body is never stored on our servers.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '0.15rem' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                  Not used to train any AI
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.55, margin: 0 }}>
                  Analysis runs on the Anthropic API — Anthropic does not use API requests to train its models. Your contract stays your contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY NOT CHATGPT ── */}
      <section style={{ borderTop: '1px solid #1c1c1e', backgroundColor: 'var(--bg-base)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div data-animate style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>
              Same situation, two responses
            </p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '1.25rem' }}>
              Why not just ask ChatGPT?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '52ch', margin: '0 auto' }}>
              Same client message, same prompt. One response opens the negotiation badly. The other holds the line, references your contract, and routes the work through paperwork. Both are below — judge for yourself.
            </p>
          </div>

          {/* The prompt */}
          <div data-animate data-animate-delay="100" style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderLeft: '3px solid var(--text-muted)',
            borderRadius: '0.75rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            maxWidth: '760px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
              The client message
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, fontStyle: 'italic', margin: 0 }}>
              &ldquo;Hey, we love what you&apos;ve done with the homepage. Actually we&apos;d also like you to handle the about page, contact page, and a couple of subpages. We assumed that was included — can you send those over by Friday?&rdquo;
            </p>
          </div>

          {/* Two responses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-animate data-animate-delay="200">
            {/* ChatGPT side */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.875rem',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#52525b' }} />
                <p style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                  Generic AI
                </p>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.7, flex: 1, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                Hi [Client],{'\n\n'}Thanks so much for the kind feedback! I&apos;m really glad you&apos;re happy with the homepage.{'\n\n'}Regarding the additional pages — I&apos;d be happy to discuss adding those to the project. Let me know if you&apos;d like to chat about scope and timeline.{'\n\n'}Best,{'\n'}[Your name]
              </div>
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem',
                borderTop: '1px solid var(--bg-border)',
                display: 'flex', flexDirection: 'column', gap: '0.45rem',
              }}>
                {[
                  'No reference to the signed contract',
                  'No price, no addendum, no timeline shift',
                  'Opens negotiation soft — invites pushback',
                ].map(flag => (
                  <p key={flag} style={{ fontSize: '0.72rem', color: '#a1a1aa', margin: 0, paddingLeft: '0.85rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#71717a' }}>—</span>
                    {flag}
                  </p>
                ))}
              </div>
            </div>

            {/* Pushback side */}
            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(132,204,22,0.3)',
              borderRadius: '0.875rem',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 50px rgba(132,204,22,0.08), inset 0 1px 0 rgba(132,204,22,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand-lime)', boxShadow: '0 0 8px rgba(132,204,22,0.6)' }} />
                <p style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--brand-lime)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                  Pushback — Scope Change tool
                </p>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.86rem', lineHeight: 1.7, flex: 1, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                Hi [Client],{'\n\n'}Glad the homepage landed. Quick note on the additions — the original scope (signed Feb 12) covers the homepage only. The about, contact, and subpages aren&apos;t included.{'\n\n'}Happy to add them. The scope addendum runs €1,800 (~3 days of work) and shifts delivery to Friday the 28th, not this Friday. I&apos;ll send the formal addendum to sign — once that&apos;s countersigned I&apos;ll start on those pages.{'\n\n'}Let me know if that timeline works, or if you&apos;d like to phase them in differently.{'\n\n'}— [Your name]
              </div>
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem',
                borderTop: '1px solid rgba(132,204,22,0.15)',
                display: 'flex', flexDirection: 'column', gap: '0.45rem',
              }}>
                {[
                  'References the signed contract by date',
                  'Specific price, work estimate, new delivery date',
                  'Routes through paperwork — no work starts without signature',
                ].map(flag => (
                  <p key={flag} style={{ fontSize: '0.72rem', color: '#d4d4d8', margin: 0, paddingLeft: '0.85rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--brand-lime)' }}>+</span>
                    {flag}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <p data-animate data-animate-delay="350" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: '2rem', lineHeight: 1.6, maxWidth: '56ch', marginLeft: 'auto', marginRight: 'auto' }}>
            ChatGPT writes pleasant emails. Pushback knows your contract terms, the right tool for the situation, and what a freelancer needs to say to actually get paid for the work.
          </p>
        </div>
      </section>

      {/* Tool Carousel — 3D coverflow */}
      <section id="arsenal" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6" data-animate style={{ marginBottom: '3.5rem' }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Tool 3 of 4 — Reply playbooks</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              23 situations.<br />A prepared playbook for each one.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '30ch' }}>
              Scope creep. Payment stonewalling. Chargeback threats. Rate pressure. IP disputes. Ghost clients. Red flag prospects. Not a worst-case scenario list — a Tuesday in freelance work. Each playbook draws on your contract, project history, and a prepared response — so you&apos;re never improvising under pressure.
            </p>
          </div>
        </div>
        <div data-animate data-animate-delay="200"><ToolCarousel /></div>
      </section>

      {/* ── PAYMENT TRACKING ── */}
      <section style={{ borderTop: '1px solid #1c1c1e', backgroundColor: 'var(--bg-surface)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div data-animate>
              <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Payment tracking</p>
              <h2 style={{ fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
                Know who owes you<br />before you have to ask.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Add a due date. Pushback does the watching. When an invoice tips overdue, your dashboard flags it with the exact days elapsed and pre-loads the right follow-up — first notice, second chase, or final warning.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { color: '#ef4444', label: 'Overdue badge', desc: 'Past-due invoices surface with exact days overdue' },
                  { color: '#f59e0b', label: 'Due soon warning', desc: 'Invoices within 3 days flagged before they tip over' },
                  { color: '#84cc16', label: 'One-click follow-up', desc: 'Pushback pre-selects the right reminder tool for the stage' },
                ].map(({ color, label, desc }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: color, flexShrink: 0, marginTop: '0.35rem' }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> — {desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment mockup */}
            <div data-animate data-animate-delay="150" data-animate-from="right">
              <div style={{
                backgroundColor: '#09090b', border: '1px solid #222225', borderRadius: '0.875rem',
                overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #1c1c1f', backgroundColor: '#060608', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, opacity: 0.5 }} />)}
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#111114', border: '1px solid #2a2a2e', borderRadius: '0.3rem', padding: '0.2rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#52525b', textAlign: 'center' }}>
                    pushback.to / dashboard
                  </div>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.55rem', color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.875rem' }}>Payment status</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { name: 'Novo Digital', project: 'Brand identity', badge: '17d overdue', badgeColor: '#ef4444', badgeBg: 'rgba(239,68,68,0.1)', amount: '€2,400' },
                      { name: 'Riven Studio', project: 'Website redesign', badge: 'Due in 2d', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.1)', amount: '€1,800' },
                      { name: 'Sable & Co.', project: 'Motion package', badge: 'Paid', badgeColor: '#84cc16', badgeBg: 'rgba(132,204,22,0.1)', amount: '€950' },
                    ].map(row => (
                      <div key={row.name} style={{
                        backgroundColor: '#111114', border: '1px solid #222225', borderRadius: '0.5rem',
                        padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                      }}>
                        <div>
                          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.1rem' }}>{row.name}</p>
                          <p style={{ fontSize: '0.62rem', color: '#52525b' }}>{row.project}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa' }}>{row.amount}</span>
                          <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.15rem 0.45rem', borderRadius: '3px', color: row.badgeColor, backgroundColor: row.badgeBg }}>{row.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '0.875rem', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>Novo Digital — 17 days overdue</p>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#84cc16', letterSpacing: '0.04em' }}>Send reminder →</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOCUMENT GENERATION ── */}
      <section style={{ borderTop: '1px solid #1c1c1e' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div data-animate style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Document generation</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              When a reply isn&apos;t enough,<br />send something they can&apos;t ignore.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '44ch', margin: '0 auto' }}>
              Generate formal documents — SOW amendments, dispute packages, kill fee invoices — that reference your actual contract terms and project history. Ready to send or file.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4" data-animate data-animate-delay="150">
            {[
              { label: 'SOW Amendment', color: '#f59e0b', desc: 'Scope changed mid-project. Document the new deliverables, revised timeline, and updated fee — and get it signed before you do another hour of work.' },
              { label: 'Dispute Package', color: '#ef4444', desc: 'Client escalating or threatening a chargeback? Compile your original agreement, all communications, and a formal record of what was delivered.' },
              { label: 'Kill Fee Invoice', color: '#84cc16', desc: 'Client cancelled after work started. Generate a kill fee invoice that references the cancellation clause in your contract and the work completed to date.' },
            ].map(doc => (
              <div key={doc.label} style={{
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderTop: `3px solid ${doc.color}`, borderRadius: '0.875rem', padding: '1.75rem',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: doc.color }} />
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{doc.label}</p>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.65, flex: 1 }}>{doc.desc}</p>
                <p style={{ marginTop: '1.25rem', fontSize: '0.6rem', color: 'var(--brand-lime)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Pro</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPLY THREADING ── */}
      <section style={{ borderTop: '1px solid #1c1c1e', backgroundColor: 'var(--bg-surface)' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div data-animate style={{ marginBottom: '3.5rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Reply threading</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                When they reply,<br />you&apos;re already ready.
              </h2>
              <div style={{ maxWidth: '32ch' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Paste their reply and Pushback reads the room — backing down, doubling down, or escalating — then drafts the right follow-up for where the conversation actually is.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                  {[
                    'Stance detection in under 3 seconds',
                    'Follow-up tailored to their exact response',
                    'Every exchange on record — nothing lost if they escalate later',
                    'Copy-ready — no editing needed',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Check size={13} style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '0.2rem' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.6rem', color: 'var(--brand-lime)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Pro</p>
              </div>
            </div>
          </div>
          <div data-animate data-animate-delay="150">
            <ReplyThreadAnimation />
          </div>
        </div>
      </section>

      {/* Founder note */}
      <section style={{ borderTop: '1px solid #1c1c1e', backgroundColor: 'var(--bg-base)' }} className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center" data-animate>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.5rem' }}>
            From the founder
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', lineHeight: 1.6, maxWidth: '54ch', margin: '0 auto 2rem' }}>
            &ldquo;Every tool in Pushback exists because of a specific situation I lost money on. The scope creep that ate a month of margin. The &lsquo;changed direction&rsquo; client who wanted 40% back after sign-off. The invoice that went 23 days overdue while I rewrote the reminder email four times. If this saves you one of those weeks, it&rsquo;s done its job.&rdquo;
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(132,204,22,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-lime)',
              letterSpacing: '-0.02em',
            }}>
              A
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>Adelina Lipsa</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.2, marginTop: '0.15rem' }}>Founder · Pushback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)' }} className="py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div data-animate style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Pricing</p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              €20/month. Or one scope dispute.<br />Pick one.
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '52ch', margin: '0 auto', lineHeight: 1.7, fontSize: '0.95rem' }}>
              The average freelance scope dispute eats €2,400 in unbilled work. One late invoice costs three weeks of cashflow. Pushback Pro is €20/month — and you can cancel after the first month with a refund if it didn&apos;t earn it back.
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '48ch', margin: '1rem auto 0', lineHeight: 1.6, fontSize: '0.82rem' }}>
              10 situations + 50 contract scans per month covers a freelancer juggling 3–5 active clients. The quota is the buffer for the bad weeks, not the ceiling for the good ones.
            </p>
          </div>

          {/* Monthly / annual toggle */}
          <div data-animate data-animate-delay="100" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div role="tablist" aria-label="Billing interval" style={{
              display: 'inline-flex',
              padding: '4px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--bg-border)',
              borderRadius: '9999px',
              gap: '2px',
            }}>
              {([
                { value: 'month' as const, label: 'Monthly' },
                { value: 'year' as const, label: 'Annual' },
              ]).map(opt => {
                const active = billingInterval === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setBillingInterval(opt.value)}
                    style={{
                      padding: '0.5rem 1.1rem',
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      letterSpacing: '0.01em',
                      backgroundColor: active ? 'var(--brand-lime)' : 'transparent',
                      color: active ? '#0a0a0a' : 'var(--text-secondary)',
                      transition: 'all 200ms ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {opt.label}
                    {opt.value === 'year' && (
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: active ? 'rgba(10,10,10,0.18)' : 'rgba(132,204,22,0.15)',
                        color: active ? '#0a0a0a' : 'var(--brand-lime)',
                      }}>
                        Save 2 mo
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto items-stretch">
            {/* Free — sidekick (1/3 width on md+) */}
            <div data-animate data-animate-from="left" data-animate-delay="150" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Free</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>€0</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No card required</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flex: 1 }}>
                {PLANS.free.features.map(f => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', lineHeight: 1.45 }}>
                    <Check size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.2rem' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: '0.7rem 0', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.82rem',
                borderTop: '1px solid var(--bg-border)',
              }} className="hover:text-white transition-colors">
                Run a free situation →
              </Link>
            </div>

            {/* Pro — dominant (2/3 width on md+) */}
            <div data-animate data-animate-from="right" data-animate-delay="250" className="md:col-span-2" style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(132,204,22,0.3)',
              borderRadius: '1rem',
              padding: '2.25rem',
              boxShadow: '0 0 60px rgba(132,204,22,0.10), inset 0 1px 0 rgba(132,204,22,0.12)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: 'radial-gradient(circle at 100% 0%, rgba(132,204,22,0.12) 0%, transparent 65%)',
                width: '260px', height: '260px',
                pointerEvents: 'none',
              }} />
              <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pro</div>
                  <div style={{ backgroundColor: 'rgba(132,204,22,0.15)', color: 'var(--brand-lime)', fontSize: '0.6rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '4px', letterSpacing: '0.12em' }}>RECOMMENDED</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    €{billingInterval === 'year' ? PLANS.pro.priceAnnual : PLANS.pro.price}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    /{billingInterval === 'year' ? 'year' : 'month'}
                  </span>
                  {billingInterval === 'year' && (
                    <span style={{
                      marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--brand-lime)',
                      fontWeight: 700, letterSpacing: '0.04em',
                    }}>
                      = €{(PLANS.pro.priceAnnual / 12).toFixed(2)}/mo · save €{PLANS.pro.price * 12 - PLANS.pro.priceAnnual}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {billingInterval === 'year'
                    ? `${PLANS.pro.annualSavingMonths} months free · cancel anytime · excl. VAT`
                    : '30-day money-back · cancel anytime · excl. VAT'}
                </p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '1.5rem', rowGap: '0.75rem', marginBottom: '2rem', flex: 1, position: 'relative' }}>
                {PLANS.pro.features.map(f => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', lineHeight: 1.45 }}>
                    <Check size={14} style={{ color: 'var(--brand-lime)', flexShrink: 0, marginTop: '0.15rem' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/signup?plan=pro&interval=${billingInterval}`} style={{
                display: 'block', textAlign: 'center',
                backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
                padding: '0.85rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem',
                position: 'relative',
              }} className="hover:opacity-90 transition-opacity">
                Own every situation →
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
