'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ContractReveal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scoreValRef = useRef<HTMLSpanElement>(null)
  const countValRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const scoreObj = { val: 0 }
    const countObj = { val: 0 }

    const ctx = gsap.context(() => {
      gsap.set('.cr-doc', { opacity: 0, y: 32 })
      gsap.set('.cr-label', { opacity: 0, y: 12 })
      gsap.set('.cr-panel-header', { opacity: 0, y: 8 })
      gsap.set('.cr-scan-count', { opacity: 0 })
      gsap.set(['.cr-finding-0', '.cr-finding-1', '.cr-finding-2'], { opacity: 0, y: 10 })
      gsap.set('.cr-score', { opacity: 0, y: 16, scale: 0.97 })
      gsap.set('.cr-response', { opacity: 0, y: 14 })
      gsap.set(['.cr-badge-revisions', '.cr-badge-payment', '.cr-badge-ip'], { opacity: 0 })
      gsap.set(['.cr-stamp-revisions', '.cr-stamp-payment', '.cr-stamp-ip'], { opacity: 0, scale: 0.5, rotation: -22 })
      gsap.set(['.cr-word-0a', '.cr-word-0b', '.cr-word-1a', '.cr-word-1b', '.cr-word-2a'], { backgroundColor: 'transparent' })
      gsap.set('.cr-scan-line', { top: '0%', opacity: 0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.6,
        },
      })

      // Entrance
      tl.to('.cr-label', { opacity: 1, y: 0, duration: 0.5 })
      tl.to('.cr-doc', { opacity: 1, y: 0, duration: 0.7 }, '<0.15')
      tl.to('.cr-panel-header', { opacity: 1, y: 0, duration: 0.4 }, '<0.3')
      tl.to('.cr-scan-count', { opacity: 1, duration: 0.3 }, '<0.15')
      tl.to({}, { duration: 0.6 })

      // Scan line sweeps + clause counter ticks up
      tl.to('.cr-scan-line', { opacity: 1, duration: 0.15 })
      tl.to('.cr-scan-line', { top: '100%', duration: 1.8, ease: 'none' }, '<0.05')
      tl.to(countObj, {
        val: 5,
        duration: 1.8,
        ease: 'none',
        onUpdate: () => {
          if (countValRef.current) countValRef.current.textContent = String(Math.round(countObj.val))
        },
      }, '<')
      tl.to('.cr-scan-line', { opacity: 0, duration: 0.2 })
      tl.to('.cr-analyzing', { opacity: 0, duration: 0.25 })
      tl.to({}, { duration: 0.5 })

      // Clause 1 — revisions
      tl.to('.cr-clause-revisions', { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.42)', duration: 0.35 })
      tl.to(['.cr-word-0a', '.cr-word-0b'], { backgroundColor: 'rgba(239,68,68,0.28)', duration: 0.3, ease: 'power1.out' }, '<0.1')
      tl.to('.cr-badge-revisions', { opacity: 1, duration: 0.25 }, '<0.1')
      tl.to('.cr-stamp-revisions', { opacity: 1, scale: 1, rotation: -11, duration: 0.45, ease: 'back.out(2)' }, '<0.15')
      tl.to('.cr-finding-0', { opacity: 1, y: 0, duration: 0.4 }, '<0.1')
      tl.to({}, { duration: 0.9 })

      // Clause 2 — payment
      tl.to('.cr-clause-payment', { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.35)', duration: 0.35 })
      tl.to(['.cr-word-1a', '.cr-word-1b'], { backgroundColor: 'rgba(245,158,11,0.24)', duration: 0.3, ease: 'power1.out' }, '<0.1')
      tl.to('.cr-badge-payment', { opacity: 1, duration: 0.25 }, '<0.1')
      tl.to('.cr-stamp-payment', { opacity: 1, scale: 1, rotation: -11, duration: 0.45, ease: 'back.out(2)' }, '<0.15')
      tl.to('.cr-finding-1', { opacity: 1, y: 0, duration: 0.4 }, '<0.1')
      tl.to({}, { duration: 0.9 })

      // Clause 3 — IP
      tl.to('.cr-clause-ip', { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.35)', duration: 0.35 })
      tl.to('.cr-word-2a', { backgroundColor: 'rgba(245,158,11,0.24)', duration: 0.3, ease: 'power1.out' }, '<0.1')
      tl.to('.cr-badge-ip', { opacity: 1, duration: 0.25 }, '<0.1')
      tl.to('.cr-stamp-ip', { opacity: 1, scale: 1, rotation: -11, duration: 0.45, ease: 'back.out(2)' }, '<0.15')
      tl.to('.cr-finding-2', { opacity: 1, y: 0, duration: 0.4 }, '<0.1')
      tl.to({}, { duration: 0.9 })

      // Risk score materialises + counter
      tl.to('.cr-score', { opacity: 1, y: 0, scale: 1, duration: 0.55 })
      tl.to(scoreObj, {
        val: 7.2,
        duration: 0.7,
        ease: 'power2.in',
        onUpdate: () => {
          if (scoreValRef.current) scoreValRef.current.textContent = scoreObj.val.toFixed(1)
        },
      }, '<0.1')
      tl.to({}, { duration: 0.9 })

      // Pushback response card
      tl.to('.cr-response', { opacity: 1, y: 0, duration: 0.55 })
      tl.to({}, { duration: 1.4 })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} style={{ height: '1000vh', position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        backgroundColor: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 'clamp(1rem, 3vw, 2rem)',
        gap: '1.25rem',
      }}>

        {/* Section label */}
        <div className="cr-label" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>
            Contract analysis
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '-0.01em' }}>
            Upload once. Pushback reads every clause.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: 'flex',
          gap: 'clamp(1rem, 2.5vw, 2rem)',
          width: '100%',
          maxWidth: '960px',
          alignItems: 'stretch',
        }}>

          {/* ── Contract document ── */}
          <div className="cr-doc" style={{
            flex: '1 1 54%',
            backgroundColor: '#f5f3ef',
            borderRadius: '0.625rem',
            padding: 'clamp(1rem, 2.5vw, 1.75rem)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            position: 'relative',
          }}>

            {/* Scan line */}
            <div className="cr-scan-line" style={{
              position: 'absolute',
              left: 0, right: 0,
              height: '2px',
              background: 'linear-gradient(to right, transparent 0%, rgba(132,204,22,0.6) 20%, rgba(132,204,22,1) 50%, rgba(132,204,22,0.6) 80%, transparent 100%)',
              boxShadow: '0 0 14px rgba(132,204,22,0.7)',
              pointerEvents: 'none',
              zIndex: 10,
            }} />

            {/* Doc header */}
            <div style={{ borderBottom: '1px solid #d0ccc4', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b6560', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Service Agreement — Draft
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800, color: '#1a1714', letterSpacing: '-0.01em' }}>
                Meridian Studio / Web Development Services
              </p>
            </div>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#4a4540', lineHeight: 1.75, marginBottom: '0.875rem' }}>
              This Agreement is entered into as of March 14, 2024 between Meridian Studio Ltd. (&ldquo;Client&rdquo;) and the undersigned independent contractor (&ldquo;Contractor&rdquo;).
            </p>

            {/* Safe clause 1 */}
            <div style={{ marginBottom: '0.625rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#2a2520', marginBottom: '0.2rem' }}>1. SCOPE OF WORK</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: '#5a5550', lineHeight: 1.7 }}>
                Contractor agrees to design and develop a company website as described in the attached Statement of Work. Any work outside that scope requires a written change order.
              </p>
            </div>

            {/* Safe clause 2 */}
            <div style={{ marginBottom: '0.625rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#2a2520', marginBottom: '0.2rem' }}>2. TIMELINE</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: '#5a5550', lineHeight: 1.7 }}>
                Contractor will deliver all milestones per the schedule agreed in writing. Delays caused by Client feedback cycles extend the timeline accordingly.
              </p>
            </div>

            {/* Risky clause 1 — revisions */}
            <div className="cr-clause-revisions" style={{
              marginBottom: '0.625rem',
              padding: '0.5rem 0.625rem',
              paddingBottom: '1.5rem',
              borderRadius: '0.3rem',
              border: '1px solid transparent',
              position: 'relative',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#2a2520', marginBottom: '0.2rem' }}>3. REVISIONS</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: '#5a5550', lineHeight: 1.7 }}>
                The Client may request{' '}
                <span className="cr-word-0a" style={{ fontWeight: 700, color: '#1a1714', padding: '1px 3px', borderRadius: '2px' }}>unlimited revisions</span>
                {' '}to all deliverables at any stage of the project,{' '}
                <span className="cr-word-0b" style={{ fontWeight: 700, color: '#1a1714', padding: '1px 3px', borderRadius: '2px' }}>at no additional cost</span>
                {' '}to the Client.
              </p>
              <span className="cr-badge-revisions" style={{
                position: 'absolute', top: '0.4rem', right: '0.4rem',
                fontSize: '0.46rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '0.12rem 0.35rem', borderRadius: '2px',
              }}>
                HIGH — No scope protection
              </span>
              <div className="cr-stamp-revisions" style={{
                position: 'absolute', bottom: '0.35rem', left: '0.5rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.52rem', fontWeight: 900,
                letterSpacing: '0.14em', color: '#ef4444',
                border: '1.5px solid rgba(239,68,68,0.7)', padding: '0.08rem 0.4rem',
                borderRadius: '2px', textTransform: 'uppercase',
              }}>
                ✕ FLAGGED
              </div>
            </div>

            {/* Risky clause 2 — payment */}
            <div className="cr-clause-payment" style={{
              marginBottom: '0.625rem',
              padding: '0.5rem 0.625rem',
              paddingBottom: '1.5rem',
              borderRadius: '0.3rem',
              border: '1px solid transparent',
              position: 'relative',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#2a2520', marginBottom: '0.2rem' }}>4. PAYMENT TERMS</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: '#5a5550', lineHeight: 1.7 }}>
                Payment is due within{' '}
                <span className="cr-word-1a" style={{ fontWeight: 700, color: '#1a1714', padding: '1px 3px', borderRadius: '2px' }}>sixty (60) days</span>
                {' '}of invoice date.{' '}
                <span className="cr-word-1b" style={{ fontWeight: 700, color: '#1a1714', padding: '1px 3px', borderRadius: '2px' }}>Late payments do not accrue interest</span>
                {' '}charges.
              </p>
              <span className="cr-badge-payment" style={{
                position: 'absolute', top: '0.4rem', right: '0.4rem',
                fontSize: '0.46rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.28)',
                padding: '0.12rem 0.35rem', borderRadius: '2px',
              }}>
                MED — Net-60, no late fee
              </span>
              <div className="cr-stamp-payment" style={{
                position: 'absolute', bottom: '0.35rem', left: '0.5rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.52rem', fontWeight: 900,
                letterSpacing: '0.14em', color: '#f59e0b',
                border: '1.5px solid rgba(245,158,11,0.65)', padding: '0.08rem 0.4rem',
                borderRadius: '2px', textTransform: 'uppercase',
              }}>
                ✕ FLAGGED
              </div>
            </div>

            {/* Risky clause 3 — IP */}
            <div className="cr-clause-ip" style={{
              padding: '0.5rem 0.625rem',
              paddingBottom: '1.5rem',
              borderRadius: '0.3rem',
              border: '1px solid transparent',
              position: 'relative',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#2a2520', marginBottom: '0.2rem' }}>5. INTELLECTUAL PROPERTY</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: '#5a5550', lineHeight: 1.7 }}>
                Upon final payment, Contractor assigns to Client all rights, title, and interest in all work product, including{' '}
                <span className="cr-word-2a" style={{ fontWeight: 700, color: '#1a1714', padding: '1px 3px', borderRadius: '2px' }}>source files, working files</span>
                , and all intellectual property.
              </p>
              <span className="cr-badge-ip" style={{
                position: 'absolute', top: '0.4rem', right: '0.4rem',
                fontSize: '0.46rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.28)',
                padding: '0.12rem 0.35rem', borderRadius: '2px',
              }}>
                MED — Source files transfer
              </span>
              <div className="cr-stamp-ip" style={{
                position: 'absolute', bottom: '0.35rem', left: '0.5rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.52rem', fontWeight: 900,
                letterSpacing: '0.14em', color: '#f59e0b',
                border: '1.5px solid rgba(245,158,11,0.65)', padding: '0.08rem 0.4rem',
                borderRadius: '2px', textTransform: 'uppercase',
              }}>
                ✕ FLAGGED
              </div>
            </div>
          </div>

          {/* ── Analysis panel ── */}
          <div style={{ flex: '1 1 42%', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

            {/* Panel header */}
            <div className="cr-panel-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: '0.5rem', borderBottom: '1px solid var(--bg-border)',
            }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-lime)', textTransform: 'uppercase' }}>
                Pushback Analysis
              </span>
              <div className="cr-scan-count" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--brand-lime)', boxShadow: '0 0 6px rgba(132,204,22,0.8)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                  <span ref={countValRef} className="cr-count-val">0</span>/5 clauses
                </span>
              </div>
            </div>

            {/* Scanning placeholder */}
            <div className="cr-analyzing" style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              padding: '0.25rem 0',
            }}>
              Scanning contract...
            </div>

            {/* Finding 0 */}
            <div className="cr-finding-0" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '0.5rem',
              padding: '0.75rem 0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em', color: '#ef4444', textTransform: 'uppercase' }}>HIGH RISK</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-primary)' }}>No scope protection</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Unlimited revisions with no cap creates open-ended unpaid labor. Demand a 2-round limit with change orders beyond that.
              </p>
            </div>

            {/* Finding 1 */}
            <div className="cr-finding-1" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '0.75rem 0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase' }}>MED RISK</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-primary)' }}>Net-60, no late fee</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Net-60 is twice the industry standard. No interest clause removes all payment pressure. Push for Net-30 at 1.5%/month.
              </p>
            </div>

            {/* Finding 2 */}
            <div className="cr-finding-2" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '0.75rem 0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase' }}>MED RISK</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-primary)' }}>Source files transfer</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Assigning source files is non-standard and undervalued. License deliverables only — retain working files separately.
              </p>
            </div>

            {/* Risk score */}
            <div className="cr-score" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(132,204,22,0.18)',
              borderRadius: '0.5rem',
              padding: '0.875rem 1rem',
            }}>
              <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                Overall risk score
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <span ref={scoreValRef} className="cr-score-val" style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.04em', lineHeight: 1 }}>0.0</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/10</span>
                <span style={{ marginLeft: '0.375rem', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.08em', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.15rem 0.4rem', borderRadius: '3px', textTransform: 'uppercase' }}>
                  High risk
                </span>
              </div>
              <div style={{ height: '3px', backgroundColor: '#1c1c1c', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ width: '72%', height: '100%', background: 'linear-gradient(to right, #f59e0b, #ef4444)', borderRadius: '9999px' }} />
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--brand-lime)', fontWeight: 600 }}>
                3 clauses need pushback — see exact language &rarr;
              </p>
            </div>

            {/* Pushback response card */}
            <div className="cr-response" style={{
              backgroundColor: '#0c1a09',
              border: '1px solid rgba(132,204,22,0.22)',
              borderLeft: '3px solid var(--brand-lime)',
              borderRadius: '0.5rem',
              padding: '0.75rem 0.875rem',
            }}>
              <p style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--brand-lime)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                Pushback suggests — Clause 3
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#9fc87e', lineHeight: 1.65, fontStyle: 'italic' }}>
                &ldquo;Revisions are limited to two (2) rounds of feedback included in the project fee. Additional revisions will be billed at Contractor&apos;s standard hourly rate.&rdquo;
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.59rem', color: 'var(--text-muted)' }}>
                Copy-ready. Send as-is or adjust the rate.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '18%',
          background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
