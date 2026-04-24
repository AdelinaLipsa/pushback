import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types'
import { PLANS } from '@/lib/plans'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as UserProfile | null

  return (
    <div style={{ padding: '2rem', maxWidth: '560px' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '2rem' }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Account */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.875rem', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Account</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{p?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Plan</span>
              <span style={{
                backgroundColor: p?.plan === 'pro' ? 'rgba(163,230,53,0.15)' : 'var(--bg-elevated)',
                color: p?.plan === 'pro' ? 'var(--brand-lime)' : 'var(--text-muted)',
                fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {p?.plan ?? 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.875rem', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Usage</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Defense responses</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {p?.defense_responses_used ?? 0}{p?.plan === 'free' ? `/${PLANS.free.defense_responses}` : ' (unlimited)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contract analyses</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {p?.contracts_used ?? 0}{p?.plan === 'free' ? `/${PLANS.free.contracts}` : ' (unlimited)'}
              </span>
            </div>
          </div>
        </div>

        {p?.plan === 'free' && (
          <div style={{ backgroundColor: 'rgba(163,230,53,0.05)', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '0.875rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--brand-lime)' }}>Upgrade to Pro</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Unlimited defense responses and contract analyses for €12/month.
            </p>
            <a
              href="/dashboard?upgrade=1"
              style={{
                display: 'inline-block', backgroundColor: 'var(--brand-lime)', color: '#0a0a0a',
                fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '0.5rem',
                textDecoration: 'none', fontSize: '0.875rem',
              }}
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
