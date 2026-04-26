import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'

const ADMIN_EMAIL = 'adelina.lipsa@gmail.com'

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={[
      'rounded-xl p-5 border',
      accent
        ? 'bg-bg-surface border-brand-lime/30 shadow-[0_0_24px_rgba(132,204,22,0.08)]'
        : 'bg-bg-surface border-bg-border',
    ].join(' ')}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400 mb-3">{label}</p>
      <p className={['font-extrabold text-[2rem] leading-none tracking-[-0.03em]', accent ? 'text-brand-lime' : 'text-text-primary', sub ? 'mb-1' : ''].join(' ')}>
        {value}
      </p>
      {sub && <p className="text-text-muted text-[0.75rem] mt-1">{sub}</p>}
    </div>
  )
}

function pct(used: number, limit: number) {
  return Math.min(Math.round((used / limit) * 100), 100)
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const p = Math.min(value / max, 1)
  const color = p >= 1 ? '#ef4444' : p >= 0.8 ? '#f97316' : '#84cc16'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${p * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-[0.7rem] tabular-nums" style={{ color }}>{pct(value, max)}%</span>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const admin = createAdminSupabaseClient()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { data: allProfiles },
    { count: responsesThisMonth },
    { count: contractsThisMonth },
    { count: newUsersThisMonth },
  ] = await Promise.all([
    admin.from('user_profiles').select('id, email, plan, defense_responses_used, contracts_used, period_responses_used, period_contracts_used, created_at').order('created_at', { ascending: false }),
    admin.from('defense_responses').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  const profiles = allProfiles ?? []
  const proUsers = profiles.filter(p => p.plan === 'pro')
  const freeUsers = profiles.filter(p => p.plan === 'free')
  const mrr = proUsers.length * PLANS.pro.price

  const nearLimit = profiles.filter(p =>
    p.plan === 'pro' && (
      p.period_responses_used >= PLANS.pro.defense_responses * 0.8 ||
      p.period_contracts_used >= PLANS.pro.contracts * 0.8
    )
  )

  const recentSignups = profiles.slice(0, 10)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-bold text-[1.75rem] tracking-tight">Admin</h1>
        <p className="text-text-muted text-sm mt-1">Internal overview — visible to you only</p>
      </div>

      {/* Stat grid */}
      <div className="fade-up grid grid-cols-3 gap-4 mb-6">
        <StatCard label="MRR" value={`€${mrr}`} sub={`${proUsers.length} active subscriptions`} accent />
        <StatCard label="Total users" value={String(profiles.length)} sub={`${newUsersThisMonth ?? 0} new this month`} />
        <StatCard label="Pro / Free" value={`${proUsers.length} / ${freeUsers.length}`} sub={`${proUsers.length > 0 ? Math.round((proUsers.length / profiles.length) * 100) : 0}% conversion`} />
        <StatCard label="Responses this month" value={String(responsesThisMonth ?? 0)} />
        <StatCard label="Analyses this month" value={String(contractsThisMonth ?? 0)} />
        <StatCard label="Near period limit" value={String(nearLimit.length)} sub="≥80% of monthly allowance" />
      </div>

      {/* Mosaic: near-limit users | recent signups */}
      <div className="fade-up grid grid-cols-[3fr_2fr] gap-4 items-start" style={{ animationDelay: '80ms' }}>

        {/* Users near limit */}
        <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border">
            <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400">Near period limit</h2>
          </div>
          {nearLimit.length === 0 ? (
            <p className="px-5 py-6 text-sm text-text-muted">No pro users near their limit.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="px-5 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">User</th>
                  <th className="px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Messages</th>
                  <th className="px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-text-muted">Analyses</th>
                </tr>
              </thead>
              <tbody>
                {nearLimit.map((p, i) => (
                  <tr key={p.id} className={i < nearLimit.length - 1 ? 'border-b border-bg-border' : ''}>
                    <td className="px-5 py-3 text-text-secondary text-xs truncate max-w-[180px]">{p.email}</td>
                    <td className="px-4 py-3 w-32">
                      <MiniBar value={p.period_responses_used} max={PLANS.pro.defense_responses} />
                      <span className="text-[0.65rem] text-text-muted">{p.period_responses_used}/{PLANS.pro.defense_responses}</span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <MiniBar value={p.period_contracts_used} max={PLANS.pro.contracts} />
                      <span className="text-[0.65rem] text-text-muted">{p.period_contracts_used}/{PLANS.pro.contracts}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent signups */}
        <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border">
            <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400">Recent signups</h2>
          </div>
          <div className="divide-y divide-bg-border">
            {recentSignups.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-xs text-text-secondary truncate">{p.email}</span>
                <span className={[
                  'text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0',
                  p.plan === 'pro'
                    ? 'bg-brand-lime/15 text-brand-lime'
                    : 'bg-bg-elevated text-text-muted',
                ].join(' ')}>
                  {p.plan}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
