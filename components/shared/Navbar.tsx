'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

interface NavbarProps {
  profile: UserProfile | null
}

const NAV_ITEMS = [
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/contracts', label: 'Contracts', icon: '⬡' },
]

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0, backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
      }} className="hidden md:flex">
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--bg-border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Pushback</span>
            <span style={{ color: 'var(--brand-amber)', fontWeight: 800, fontSize: '1.2rem' }}>.</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.75rem', borderRadius: '0.5rem',
                  marginBottom: '0.25rem', textDecoration: 'none',
                  backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400, fontSize: '0.9rem',
                  transition: 'all 150ms ease',
                }}
                className="hover:bg-[#1a1a1a] hover:text-white"
              >
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{icon}</span>
                {label}
              </Link>
            )
          })}

          <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', margin: '0.75rem 0' }} />

          <Link
            href="/settings"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.75rem', borderRadius: '0.5rem',
              textDecoration: 'none', color: 'var(--text-secondary)',
              fontSize: '0.9rem', transition: 'all 150ms ease',
            }}
            className="hover:bg-[#1a1a1a] hover:text-white"
          >
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>⚙</span>
            Settings
          </Link>

          {profile?.plan === 'free' && (
            <Link
              href="/dashboard?upgrade=1"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: '0.5rem',
                textDecoration: 'none', color: 'var(--brand-amber)',
                fontSize: '0.9rem', fontWeight: 500, transition: 'all 150ms ease',
              }}
              className="hover:bg-[#1a1a1a]"
            >
              <span style={{ fontSize: '0.85rem' }}>✦</span>
              Upgrade to Pro
            </Link>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'var(--brand-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-amber)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
            }}>
              {profile?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.email ?? ''}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profile?.plan ?? 'free'}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
              color: 'var(--text-muted)', fontSize: '0.8rem', background: 'none',
              border: 'none', cursor: 'pointer', borderRadius: '0.375rem',
            }}
            className="hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)',
        display: 'flex', padding: '0.5rem',
      }} className="md:hidden">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                padding: '0.5rem', borderRadius: '0.5rem', textDecoration: 'none',
                color: active ? 'var(--brand-amber)' : 'var(--text-muted)',
                fontSize: '0.7rem', fontWeight: active ? 600 : 400,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
