'use client'

import Link from 'next/link'
import { DEFENSE_TOOLS, URGENCY_COLORS } from '@/lib/defenseTools'
import PushbackHero from '@/components/hero/PushbackHero'

const TICKER_ITEMS = [
  'Scope Change', 'Kill Fee', 'Payment Chase', 'Revision Limit',
  'Delivery Sign-Off', 'Dispute Response', 'Scope Change', 'Kill Fee',
  'Payment Chase', 'Revision Limit', 'Delivery Sign-Off', 'Dispute Response',
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

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Hero — full-screen WebGL shader */}
      <PushbackHero />

      {/* Ticker */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', overflow: 'hidden', padding: '0.875rem 0' }}>
        <div className="ticker-track flex gap-8 whitespace-nowrap w-max">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              <span style={{ color: 'var(--brand-amber)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.03em' }}>{item}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>How it works</p>
        <h2 style={{ fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', marginBottom: '3rem' }}>Three steps. Under a minute.</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { num: '01', title: 'Add a project', desc: 'Name your project, add your client. Contract optional — Pushback works either way.' },
            { num: '02', title: 'Pick your situation', desc: "Scope creep? Ghosted invoice? Client wants out? Eight tools. One for every situation." },
            { num: '03', title: 'Copy and send', desc: 'A complete professional message, ready in seconds. No editing needed. Just send it.' },
          ].map(({ num, title, desc }) => (
            <div key={num} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.875rem', padding: '1.75rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-amber)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem' }}>{num}</div>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tool Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 style={{ fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', marginBottom: '3rem' }}>
          Every situation. Already handled.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFENSE_TOOLS.map((tool) => {
            const colors = URGENCY_COLORS[tool.urgency]
            return (
              <div
                key={tool.type}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  borderLeft: `4px solid ${colors.border}`,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  transition: 'box-shadow 150ms ease, background-color 150ms ease',
                }}
                className="hover:shadow-lg group cursor-default"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${colors.glow}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{tool.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>{tool.label}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{tool.description}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Before / After */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 style={{ fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '3.5rem' }}>
            You don&apos;t have to figure out<br />what to say.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Before */}
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Client email</p>
              <div style={{ backgroundColor: '#0f0f0f', border: '1px solid #222', borderRadius: '0.75rem', padding: '1.5rem' }}>
                <pre style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{BEFORE_EMAIL}</pre>
              </div>
            </div>
            {/* After */}
            <div>
              <p style={{ color: 'var(--brand-amber)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>✦ Your message, ready to send</p>
              <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--brand-amber)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                <pre style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono), monospace' }}>{AFTER_MESSAGE}</pre>
                <button style={{
                  marginTop: '1rem', backgroundColor: 'var(--brand-amber)', color: '#0a0a0a',
                  fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                  border: 'none', cursor: 'pointer',
                }}>
                  Copy Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 style={{ fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '0.75rem' }}>
          Start free. Upgrade when you need more.
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem' }}>
          3 messages to try it. No card required.
        </p>
        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Free</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>€0</div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['3 defense tool responses', '1 contract analysis', 'All 8 situation types', 'Copy-ready messages'].map(f => (
                <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--brand-green)' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{
              display: 'block', marginTop: '2rem', textAlign: 'center',
              border: '1px solid var(--bg-border)', color: 'var(--text-primary)',
              padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem',
            }} className="hover:border-white/30 transition-colors">
              Get started free
            </Link>
          </div>
          {/* Pro */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--brand-amber)', borderRadius: '1rem', padding: '2rem', boxShadow: '0 0 40px rgba(245,158,11,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Pro</div>
              <div style={{ backgroundColor: 'var(--brand-amber-dim)', color: 'var(--brand-amber)', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', letterSpacing: '0.05em' }}>POPULAR</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              €12<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/month</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Unlimited defense responses', 'Unlimited contract analyses', 'Full response history', 'All 8 defense tools', 'Client notes per project'].map(f => (
                <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--brand-green)' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{
              display: 'block', marginTop: '2rem', textAlign: 'center',
              backgroundColor: 'var(--brand-amber)', color: '#0a0a0a',
              padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem',
            }} className="hover:opacity-90 transition-opacity">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', padding: '2rem 1.5rem' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700 }}>Pushback</span>
            <span style={{ color: 'var(--brand-amber)', fontWeight: 700 }}>.</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>Built for freelancers everywhere.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms'].map(label => (
              <Link key={label} href={`/${label.toLowerCase()}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
