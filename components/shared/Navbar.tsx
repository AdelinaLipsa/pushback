'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileText, Settings, BarChart2, ArrowUpCircle, CreditCard, ShieldCheck, LogOut, BookOpen, HelpCircle, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { startCheckout } from '@/lib/checkout'
import { billingPortal } from '@/lib/api'
import { UserProfile } from '@/types'

interface NavbarProps {
  profile: UserProfile | null
}

const NAV_SECTIONS: { label: string; items: { href: string; label: string; Icon: LucideIcon }[] }[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', Icon: Briefcase },
      { href: '/contracts', label: 'Contracts', Icon: FileText },
      { href: '/analytics', label: 'Analytics', Icon: BarChart2 },
      { href: '/arsenal', label: 'Arsenal', Icon: BookOpen },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', Icon: Settings },
      { href: '/how-it-works', label: 'Help', Icon: HelpCircle },
    ],
  },
]

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg text-sm no-underline transition-all duration-150 border-l-2',
        active
          ? 'bg-bg-elevated text-text-primary border-brand-amber font-semibold'
          : 'text-text-secondary border-transparent hover:bg-bg-elevated/60 hover:text-text-primary font-normal',
      ].join(' ')}
    >
      <Icon size={15} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
      {label}
    </Link>
  )
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  async function handleBillingPortal() {
    setPortalLoading(true)
    const url = await billingPortal()
    if (url) window.location.href = url
    else setPortalLoading(false)
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col h-screen sticky top-0 bg-bg-surface border-r border-bg-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-bg-border">
          <Link href="/dashboard" className="flex items-center no-underline">
            <span className="font-extrabold text-xl text-text-primary tracking-tight">Pushback</span>
            <span className="font-extrabold text-xl text-brand-amber">.</span>
          </Link>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-4 flex flex-col overflow-y-auto">
          <div className="space-y-5">
            {NAV_SECTIONS.map(({ label, items }) => (
              <div key={label}>
                <p className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted select-none">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ href, label: itemLabel, Icon }) => (
                    <NavLink key={href} href={href} label={itemLabel} Icon={Icon} active={isActive(href)} />
                  ))}
                  {label === 'Account' && profile?.email === 'adelina.lipsa@gmail.com' && (
                    <Link
                      href="/admin"
                      className={[
                        'flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg text-sm no-underline transition-all duration-150 border-l-2',
                        isActive('/admin')
                          ? 'bg-bg-elevated text-text-primary border-brand-lime font-semibold'
                          : 'text-text-muted border-transparent hover:bg-bg-elevated/60 hover:text-text-secondary font-normal',
                      ].join(' ')}
                    >
                      <ShieldCheck size={15} strokeWidth={isActive('/admin') ? 2 : 1.5} className="shrink-0" />
                      Admin
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade / billing — pinned to bottom of nav */}
          <div className="mt-auto pt-4">
            {profile?.plan === 'free' && (
              <button
                onClick={() => startCheckout(setCheckoutLoading)}
                disabled={checkoutLoading}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-lime border border-brand-lime/20 hover:bg-brand-lime/5 hover:border-brand-lime/40 transition-all duration-150 cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpCircle size={15} strokeWidth={1.5} className="shrink-0" />
                {checkoutLoading ? 'Loading…' : 'Upgrade to Pro'}
              </button>
            )}

            {profile?.plan === 'pro' && (
              <button
                onClick={handleBillingPortal}
                disabled={portalLoading}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-150 cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={15} strokeWidth={1.5} className="shrink-0" />
                {portalLoading ? 'Loading…' : 'Billing portal'}
              </button>
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-3 border-t border-bg-border space-y-1">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-xs shrink-0">
              {profile?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary font-medium truncate">{profile?.email ?? ''}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{profile?.plan ?? 'free'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all duration-150 cursor-pointer border-0 bg-transparent text-left"
          >
            <LogOut size={14} strokeWidth={1.5} className="shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-surface border-t border-bg-border px-2 py-1">
        {[
          { href: '/dashboard', Icon: LayoutDashboard, label: 'Home' },
          { href: '/projects', Icon: Briefcase, label: 'Projects' },
          { href: '/contracts', Icon: FileText, label: 'Contracts' },
          { href: '/analytics', Icon: BarChart2, label: 'Analytics' },
        ].map(({ href, Icon, label }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg no-underline text-[10px] font-medium transition-colors duration-150',
                active ? 'text-brand-amber' : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
