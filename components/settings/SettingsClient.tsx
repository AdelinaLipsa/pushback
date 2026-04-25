'use client'

import { useState } from 'react'
import { ExternalLink, CreditCard, Shield, Key } from 'lucide-react'
import Button from '@/components/shared/Button'
import { startCheckout } from '@/lib/checkout'
import { billingPortal } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/plans'
import type { UserProfile } from '@/types'

type Props = {
  profile: UserProfile
  nextBillingDate: string | null
  isEmailUser: boolean
}

function usageColor(used: number, limit: number): string {
  const pct = used / limit
  if (pct >= 1) return '#ef4444'
  if (pct >= 0.5) return '#f97316'
  return '#84cc16'
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(used / limit, 1)
  const color = usageColor(used, limit)
  const remaining = limit - used

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-xs font-semibold" style={{
          color: remaining <= 0 ? '#ef4444' : remaining === 1 ? '#f97316' : 'var(--text-muted)',
        }}>
          {remaining <= 0 ? '0 left' : remaining === 1 ? '1 left' : `${remaining} left`}
          <span className="text-text-muted font-normal"> · {used}/{limit}</span>
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden bg-bg-elevated">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400 mb-4">{children}</h2>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm text-text-primary">{children}</span>
    </div>
  )
}

export default function SettingsClient({ profile, nextBillingDate, isEmailUser }: Props) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const isPro = profile.plan === 'pro'

  async function handleBillingPortal() {
    setPortalLoading(true)
    const url = await billingPortal()
    if (url) window.location.href = url
    else setPortalLoading(false)
  }

  async function handlePasswordReset() {
    setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  return (
    <div className="p-8 max-w-[800px]">
      <h1 className="font-bold text-[1.75rem] tracking-tight mb-8">Settings</h1>

      <div className="flex flex-col gap-4">

        {/* Account — full width */}
        <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6">
          <SectionLabel>Account</SectionLabel>
          <div className="flex flex-col gap-3">
            <Row label="Email">{profile.email}</Row>
            <Row label="Plan">
              <span style={{
                backgroundColor: isPro ? 'rgba(132,204,22,0.15)' : 'var(--bg-elevated)',
                color: isPro ? '#84cc16' : 'var(--text-muted)',
                fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {profile.plan}
              </span>
            </Row>
            {isEmailUser && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Password</span>
                {resetSent ? (
                  <span className="text-xs font-medium" style={{ color: '#84cc16' }}>Reset link sent — check your inbox</span>
                ) : (
                  <Button variant="ghost" size="sm" loading={resetLoading} icon={<Key size={13} />} onClick={handlePasswordReset}>
                    Send reset email
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mosaic: Usage (left) | Billing (right) */}
        <div className="fade-up grid grid-cols-[3fr_2fr] gap-4 items-start" style={{ animationDelay: '80ms' }}>

          {/* Usage */}
          <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
            <SectionLabel>Usage</SectionLabel>
            {isPro ? (
              <div className="flex flex-col gap-4">
                <UsageBar used={profile.period_responses_used} limit={PLANS.pro.defense_responses} label="Messages this period" />
                <UsageBar used={profile.period_contracts_used} limit={PLANS.pro.contracts} label="Analyses this period" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <UsageBar used={profile.defense_responses_used} limit={PLANS.free.defense_responses} label="Messages" />
                <UsageBar used={profile.contracts_used} limit={PLANS.free.contracts} label="Contract analyses" />
              </div>
            )}
          </div>

          {/* Billing */}
          {isPro ? (
            <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
              <SectionLabel>Billing</SectionLabel>
              <div className="flex flex-col gap-3">
                {nextBillingDate && (
                  <Row label="Next billing">{nextBillingDate}</Row>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Subscription</span>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={portalLoading}
                    icon={<CreditCard size={13} />}
                    onClick={handleBillingPortal}
                  >
                    Manage
                    {!portalLoading && <ExternalLink size={11} className="opacity-40" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(132,204,22,0.05)', border: '1px solid rgba(132,204,22,0.2)' }}>
              <SectionLabel>Upgrade to Pro</SectionLabel>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {PLANS.pro.defense_responses} messages and {PLANS.pro.contracts} contract analyses per month. {PLANS.pro.priceDisplay}. Cancel any time.
              </p>
              <Button
                variant="primary"
                size="md"
                loading={checkoutLoading}
                onClick={() => startCheckout(setCheckoutLoading)}
              >
                Get Pro
              </Button>
            </div>
          )}
        </div>

        {/* Data & Privacy — full width */}
        <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6" style={{ animationDelay: '160ms' }}>
          <SectionLabel>Data &amp; Privacy</SectionLabel>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Request deletion of your account and all associated data under GDPR Article 17.
          </p>
          <a
            href={`mailto:adelina.lipsa@gmail.com?subject=Data%20deletion%20request&body=Please%20delete%20my%20account%20and%20all%20associated%20data.%0A%0AEmail%3A%20${encodeURIComponent(profile.email)}`}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            style={{ borderBottom: '1px solid var(--bg-border)', paddingBottom: '1px', textDecoration: 'none' }}
          >
            <Shield size={12} />
            Request data deletion
          </a>
        </div>

      </div>
    </div>
  )
}
