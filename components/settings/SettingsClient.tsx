'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, CreditCard, Shield, Key, Check } from 'lucide-react'
import Button from '@/components/shared/Button'
import { startCheckout } from '@/lib/checkout'
import { billingPortal, updateProfile } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/plans'
import { PROFESSIONS } from '@/lib/profession'
import type { UserProfile } from '@/types'

type Props = {
  profile: UserProfile
  nextBillingDate: string | null
  isEmailUser: boolean
}

function usageColor(used: number, limit: number): string {
  const pct = used / limit
  if (pct >= 1) return '#ef4444'
  if (pct >= 0.75) return '#f97316'
  return '#84cc16'
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(used / limit, 1)
  const color = usageColor(used, limit)
  const remaining = limit - used

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-xs font-semibold tabular-nums" style={{
          color: remaining <= 0 ? '#ef4444' : remaining <= 5 ? '#f97316' : 'var(--text-muted)',
        }}>
          {remaining <= 0 ? '0 left' : `${remaining} left`}
          <span className="text-text-muted font-normal opacity-60"> · {used}/{limit}</span>
        </span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-zinc-500 mb-5">{children}</p>
  )
}

function Divider() {
  return <div className="h-px bg-bg-border -mx-6" />
}

export default function SettingsClient({ profile, nextBillingDate, isEmailUser }: Props) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [profession, setProfession] = useState<string>(profile.profession ?? '')
  const [professionSaving, setProfessionSaving] = useState(false)
  const [professionSaved, setProfessionSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isPro = profile.plan === 'pro'

  async function handleProfessionSave() {
    setProfessionSaving(true)
    await updateProfile({ profession: profession || null })
    setProfessionSaving(false)
    setProfessionSaved(true)
    setTimeout(() => setProfessionSaved(false), 2200)
    toast.success('Saved')
  }

  async function handleBillingPortal() {
    setPortalLoading(true)
    const url = await billingPortal()
    if (url) window.location.href = url
    else setPortalLoading(false)
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError(null)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const msg = body.error ?? 'Something went wrong. Try again.'
      setDeleteError(msg)
      toast.error(msg)
      setDeleteLoading(false)
      return
    }
    // Sign out locally then go to homepage — auth user is already gone server-side
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handlePasswordReset() {
    setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetSent(true)
    setResetLoading(false)
    toast.success('Reset link sent — check your inbox')
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-bold text-[1.75rem] tracking-tight mb-7">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4 items-start">

        {/* ── Left column ───────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Account card */}
          <div className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden">

            {/* Profile header */}
            <div className="px-6 py-5 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                style={{ backgroundColor: 'rgba(132,204,22,0.1)', color: 'var(--brand-lime)' }}
              >
                {profile.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isPro ? 'rgba(132,204,22,0.15)' : 'var(--bg-elevated)',
                      color: isPro ? 'var(--brand-lime)' : 'var(--text-muted)',
                    }}
                  >
                    {profile.plan}
                  </span>
                  {!isPro && (
                    <button
                      onClick={() => startCheckout(setCheckoutLoading)}
                      className="text-[0.6rem] font-semibold text-brand-lime/60 hover:text-brand-lime transition-colors bg-transparent border-0 cursor-pointer p-0"
                    >
                      Upgrade →
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Divider />

            {/* Fields */}
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Profession field */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm text-text-secondary font-medium">Your field</label>
                  <span className="text-[11px] text-text-muted">Tailors AI responses to your profession</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={profession}
                    onChange={e => { setProfession(e.target.value); setProfessionSaved(false) }}
                    className="flex-1 text-sm text-text-primary rounded-lg px-3 py-2 border border-bg-border focus:outline-none focus:border-brand-lime/40 transition-colors"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <option value="">Not specified</option>
                    {PROFESSIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <Button
                    variant={professionSaved ? 'ghost' : 'outline'}
                    size="sm"
                    loading={professionSaving}
                    onClick={handleProfessionSave}
                    disabled={professionSaved}
                    icon={professionSaved ? <Check size={13} style={{ color: 'var(--brand-lime)' }} /> : undefined}
                    className="shrink-0"
                  >
                    {professionSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* Password */}
              {isEmailUser && (
                <>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Password</span>
                    {resetSent ? (
                      <span className="text-xs font-medium" style={{ color: 'var(--brand-lime)' }}>
                        Reset link sent — check your inbox
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={resetLoading}
                        icon={<Key size={13} />}
                        onClick={handlePasswordReset}
                      >
                        Send reset email
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Usage card */}
          <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6" style={{ animationDelay: '60ms' }}>
            <CardLabel>Usage</CardLabel>
            <div className="flex flex-col gap-5">
              {isPro ? (
                <>
                  <UsageBar used={profile.period_responses_used} limit={PLANS.pro.defense_responses} label="Messages this period" />
                  <UsageBar used={profile.period_contracts_used} limit={PLANS.pro.contracts} label="Analyses this period" />
                </>
              ) : (
                <>
                  <UsageBar used={profile.defense_responses_used} limit={PLANS.free.defense_responses} label="Defense responses" />
                  <UsageBar used={profile.contracts_used} limit={PLANS.free.contracts} label="Contract analyses" />
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Plan card */}
          {isPro ? (
            <div className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden" style={{ animationDelay: '80ms' }}>
              <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
                <div>
                  <CardLabel>Billing</CardLabel>
                  <div className="flex items-center gap-2 -mt-3">
                    <span className="text-sm font-semibold text-text-primary">Pro plan</span>
                    <span
                      className="text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(132,204,22,0.12)', color: 'var(--brand-lime)' }}
                    >
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3.5">
                {nextBillingDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Next billing</span>
                    <span className="text-sm text-text-primary">{nextBillingDate}</span>
                  </div>
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
                    {!portalLoading && <ExternalLink size={11} className="opacity-40 ml-0.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="fade-up rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(132,204,22,0.22)',
                backgroundColor: 'rgba(132,204,22,0.03)',
                animationDelay: '80ms',
              }}
            >
              {/* Plan header */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid rgba(132,204,22,0.1)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-zinc-500">Pro plan</span>
                  <span
                    className="text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(132,204,22,0.12)', color: 'var(--brand-lime)' }}
                  >
                    Recommended
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">€{PLANS.pro.price}</span>
                  <span className="text-sm text-text-muted">/month</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">excl. VAT · cancel anytime</p>
              </div>

              {/* Features */}
              <div className="px-5 py-4 flex flex-col gap-3">
                {PLANS.pro.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--brand-lime)' }} />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <Button
                  variant="primary"
                  size="md"
                  loading={checkoutLoading}
                  onClick={() => startCheckout(setCheckoutLoading)}
                  className="w-full justify-center"
                >
                  Get Pro
                </Button>
              </div>
            </div>
          )}

          {/* Data & Privacy card */}
          <div
            className="fade-up bg-bg-surface border border-bg-border rounded-xl p-5"
            style={{ animationDelay: '120ms' }}
          >
            <CardLabel>Data &amp; Privacy</CardLabel>
            {!deleteConfirm ? (
              <>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Permanently deletes your account, all projects, contracts, and responses. This cannot be undone.
                </p>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  <Shield size={11} className="shrink-0" />
                  Delete account
                </button>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#ef4444' }}>
                  This will permanently delete your account and all data. Your Pro subscription will be cancelled immediately. There is no undo.
                </p>
                {deleteError && (
                  <p className="text-xs text-red-400 mb-3">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
                    style={{
                      backgroundColor: deleteLoading ? 'rgba(239,68,68,0.4)' : '#ef4444',
                      color: '#fff',
                    }}
                  >
                    {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteError(null) }}
                    disabled={deleteLoading}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors bg-transparent border-0 cursor-pointer px-2"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
