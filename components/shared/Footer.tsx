import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'


const PRODUCT_LINKS = [
  { label: 'Sign up free',  href: '/signup' },
  { label: 'How it works',  href: '/how-it-works' },
  { label: 'Pricing',       href: '/#pricing' },
  { label: 'Sign in',       href: '/login' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy',    href: '/privacy' },
  { label: 'Terms of Service',  href: '/terms' },
]

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--bg-border)',
        backgroundColor: 'var(--bg-surface)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow — top left */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-60%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, #84cc16 0%, transparent 65%)',
          opacity: 0.05,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>

        {/* Main grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-16"
          style={{ marginBottom: '3.5rem' }}
        >
          {/* Brand column */}
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                Pushback
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--brand-lime)' }}>.</span>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                lineHeight: 1.75,
                maxWidth: '32ch',
                marginBottom: '1.75rem',
              }}
            >
              Contract analysis, 21 situation tools, payment tracking, and document generation. Everything you need to protect your work when a client pushes back.
            </p>

            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--brand-lime)',
                color: '#0a0a0a',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Run a free situation
              <span style={{ opacity: 0.6, fontSize: '0.9em' }}>→</span>
            </Link>

            {/* Product Hunt badge */}
            <div style={{ marginTop: '1.25rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a
                href="https://www.producthunt.com/products/pushback?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-pushback"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  alt="Pushback - The freelancer's arsenal against difficult clients | Product Hunt"
                  width={250}
                  height={54}
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1133410&theme=dark&t=1777292235506"
                  style={{ display: 'block' }}
                />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h3
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              Quick links
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                    className="text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h3
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              Legal
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                    className="text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--bg-border)',
            paddingTop: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
          className="sm:flex-row sm:items-center sm:justify-between"
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} Pushback. All rights reserved.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Contract text is never stored — read, analysed, deleted.
            </p>
          </div>
        </div>

      </div>
    </footer>
  )
}
