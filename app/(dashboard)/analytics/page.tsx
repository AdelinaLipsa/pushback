import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TOOL_LABELS, TOOL_CATEGORIES } from '@/lib/defenseTools'
import { PLANS } from '@/lib/plans'

function weekMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function StatCard({ label, value, sub, accent }: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={[
      'rounded-xl p-5 border',
      accent
        ? 'bg-bg-surface border-brand-lime/30 shadow-[0_0_24px_rgba(132,204,22,0.08)]'
        : 'bg-bg-surface border-bg-border',
    ].join(' ')}>
      <p className="text-text-muted text-[0.78rem] mb-2">{label}</p>
      <p className={[
        'font-extrabold text-[2rem] leading-none tracking-[-0.03em]',
        accent ? 'text-brand-lime' : 'text-text-primary',
        sub ? 'mb-1' : '',
      ].join(' ')}>
        {value}
      </p>
      {sub && <p className="text-text-muted text-[0.75rem]">{sub}</p>}
    </div>
  )
}

const SIGNAL_META: Record<string, { label: string; color: string }> = {
  backing_down: { label: 'Backed down',    color: 'var(--brand-lime)' },
  doubling_down: { label: 'Doubled down',  color: '#f59e0b' },
  escalating:    { label: 'Escalated',     color: '#ef4444' },
  unclear:       { label: 'Unclear',       color: 'var(--text-muted)' },
}

const RISK_META = [
  { key: 'critical', label: 'Critical', color: '#ef4444' },
  { key: 'high',     label: 'High',     color: '#f97316' },
  { key: 'medium',   label: 'Medium',   color: '#f59e0b' },
  { key: 'low',      label: 'Low',      color: 'var(--brand-lime)' },
] as const

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: responses },
    { data: contracts },
    { data: projects },
    { data: replyThreads },
    { data: profile },
  ] = await Promise.all([
    supabase.from('defense_responses').select('id, tool_type, created_at, was_sent, was_copied').eq('user_id', user.id),
    supabase.from('contracts').select('id, risk_level, risk_score, contract_type').eq('user_id', user.id),
    supabase.from('projects').select('id, payment_due_date, payment_received_at').eq('user_id', user.id),
    supabase.from('reply_threads').select('risk_signal').eq('user_id', user.id),
    supabase.from('user_profiles').select('plan, period_responses_used, period_contracts_used').eq('id', user.id).single(),
  ])

  const allResponses   = responses    ?? []
  const allContracts   = contracts    ?? []
  const allProjects    = projects     ?? []
  const allThreads     = replyThreads ?? []

  const isPro   = profile?.plan === 'pro'
  const planLimits = isPro ? PLANS.pro : PLANS.free

  // ── Stat card values ────────────────────────────────────────────────────────

  const totalResponses = allResponses.length
  const sentCount      = allResponses.filter(r => r.was_sent).length
  const sentRate       = totalResponses > 0 ? Math.round((sentCount / totalResponses) * 100) : null

  const totalThreads      = allThreads.length
  const backingDownCount  = allThreads.filter(t => t.risk_signal === 'backing_down').length
  const clientWinRate     = totalThreads > 0 ? Math.round((backingDownCount / totalThreads) * 100) : null

  const totalContracts = allContracts.length
  const ndaCount       = allContracts.filter(c => (c as { contract_type?: string | null }).contract_type === 'nda').length
  const saCount        = totalContracts - ndaCount

  const projectsWithPayment = allProjects.filter(p => p.payment_due_date)
  const recoveredCount      = projectsWithPayment.filter(p => p.payment_received_at).length
  const recoveryRate        = projectsWithPayment.length > 0
    ? Math.round((recoveredCount / projectsWithPayment.length) * 100)
    : null

  // ── Weekly volume (last 8 weeks) ────────────────────────────────────────────

  const now        = new Date()
  const thisMonday = weekMonday(now)
  const weeks: { key: string; label: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const monday = new Date(thisMonday)
    monday.setDate(monday.getDate() - i * 7)
    weeks.push({
      key:   isoDate(monday),
      label: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    })
  }
  allResponses.forEach(r => {
    const key  = isoDate(weekMonday(new Date(r.created_at!)))
    const slot = weeks.find(w => w.key === key)
    if (slot) slot.count++
  })
  const maxWeekCount = Math.max(...weeks.map(w => w.count), 1)

  // ── Tool usage (individual + by category) ───────────────────────────────────

  const toolCounts: Record<string, number> = {}
  allResponses.forEach(r => { toolCounts[r.tool_type] = (toolCounts[r.tool_type] ?? 0) + 1 })
  const sortedTools   = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])
  const maxToolCount  = sortedTools[0]?.[1] ?? 1

  const categoryCounts = TOOL_CATEGORIES.map(cat => ({
    label: cat.label,
    count: cat.types.reduce((sum, t) => sum + (toolCounts[t] ?? 0), 0),
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  const maxCatCount = categoryCounts[0]?.count ?? 1

  // ── Reply signal distribution ────────────────────────────────────────────────

  const signalCounts: Record<string, number> = {}
  allThreads.forEach(t => { signalCounts[t.risk_signal] = (signalCounts[t.risk_signal] ?? 0) + 1 })
  const signalOrder = ['backing_down', 'doubling_down', 'escalating', 'unclear']

  // ── Contract risk distribution ───────────────────────────────────────────────

  const riskDist: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  allContracts.forEach(c => {
    if (c.risk_level && c.risk_level in riskDist) riskDist[c.risk_level]++
  })

  // ── Monthly quota ────────────────────────────────────────────────────────────

  const periodResponses = profile?.period_responses_used ?? 0
  const periodContracts = profile?.period_contracts_used ?? 0
  const responseLimit   = planLimits.defense_responses
  const contractLimit   = planLimits.contracts

  const hasAnyData = totalResponses > 0 || totalContracts > 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="fade-up mb-8" style={{ animationDelay: '0.02s' }}>
        <h1 className="font-extrabold text-2xl tracking-[-0.02em] mb-1">Analytics</h1>
        <p className="text-text-muted text-sm">Your Pushback usage and outcomes at a glance.</p>
      </div>

      {!hasAnyData ? (
        <div className="fade-up bg-bg-surface border border-bg-border rounded-2xl p-12 text-center" style={{ animationDelay: '0.05s' }}>
          <p className="font-semibold mb-1.5">No data yet</p>
          <p className="text-text-muted text-sm">Generate your first response or analyze a contract to see stats here.</p>
        </div>
      ) : (
        <>
          {/* ── Row 1: Stat cards ─────────────────────────────────────────── */}
          <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" style={{ animationDelay: '0.04s' }}>
            <StatCard
              label="Responses generated"
              value={String(totalResponses)}
              sub={sentRate !== null ? `${sentRate}% sent to client` : undefined}
            />
            <StatCard
              label="Client win rate"
              value={clientWinRate !== null ? `${clientWinRate}%` : '—'}
              sub={clientWinRate !== null
                ? `${backingDownCount} of ${totalThreads} backed down`
                : 'No reply analysis yet'}
              accent={clientWinRate !== null && clientWinRate >= 50}
            />
            <StatCard
              label="Payment recovery"
              value={recoveryRate !== null ? `${recoveryRate}%` : '—'}
              sub={recoveryRate !== null
                ? `${recoveredCount} of ${projectsWithPayment.length} invoice${projectsWithPayment.length !== 1 ? 's' : ''}`
                : 'No tracked invoices'}
              accent={recoveryRate !== null && recoveryRate >= 50}
            />
            <StatCard
              label="Contracts analyzed"
              value={String(totalContracts)}
              sub={totalContracts > 0
                ? `${saCount} agreement${saCount !== 1 ? 's' : ''}, ${ndaCount} NDA${ndaCount !== 1 ? 's' : ''}`
                : undefined}
            />
          </div>

          {/* ── Row 2: Weekly volume + Reply outcomes ─────────────────────── */}
          <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" style={{ animationDelay: '0.07s' }}>

            {/* Weekly volume */}
            <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
              <p className="font-semibold text-[0.9rem] mb-0.5">Response volume</p>
              <p className="text-text-muted text-[0.72rem] mb-6">Last 8 weeks</p>
              <div className="flex items-end gap-1.5 h-24">
                {weeks.map(w => (
                  <div key={w.key} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-[3px]"
                        style={{
                          height: w.count > 0 ? `${Math.max((w.count / maxWeekCount) * 100, 8)}%` : '2px',
                          backgroundColor: w.count > 0 ? 'var(--brand-lime)' : 'var(--bg-elevated)',
                          opacity: w.count > 0 ? 1 : 0.5,
                        }}
                      />
                    </div>
                    <span className="text-[0.52rem] text-text-muted text-center w-full truncate">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply outcomes */}
            <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
              <p className="font-semibold text-[0.9rem] mb-0.5">Reply outcomes</p>
              <p className="text-text-muted text-[0.72rem] mb-5">How clients responded to your pushbacks</p>
              {totalThreads === 0 ? (
                <p className="text-text-muted text-sm">Use the reply analysis tool on a response to see how clients react.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {signalOrder.map(signal => {
                    const count = signalCounts[signal] ?? 0
                    const meta  = SIGNAL_META[signal]
                    const pct   = Math.round((count / totalThreads) * 100)
                    return (
                      <div key={signal} className="flex items-center gap-3">
                        <span className="w-28 text-[0.75rem] text-text-secondary shrink-0">{meta.label}</span>
                        <div className="flex-1 bg-bg-elevated rounded-[3px] h-2 overflow-hidden">
                          <div
                            className="h-full rounded-[3px] transition-all"
                            style={{
                              width: count > 0 ? `${pct}%` : '0%',
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                        <span className="text-[0.75rem] text-text-muted w-8 text-right shrink-0">
                          {count > 0 ? `${pct}%` : '—'}
                        </span>
                      </div>
                    )
                  })}
                  <p className="text-[0.7rem] text-text-muted mt-1">{totalThreads} reply thread{totalThreads !== 1 ? 's' : ''} analyzed</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Row 3: Tool breakdown + Contract risk ─────────────────────── */}
          <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" style={{ animationDelay: '0.10s' }}>

            {/* Tool usage */}
            <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
              <p className="font-semibold text-[0.9rem] mb-0.5">Tool usage</p>
              <p className="text-text-muted text-[0.72rem] mb-5">Most deployed</p>
              {sortedTools.length === 0 ? (
                <p className="text-text-muted text-sm">No data yet</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2.5 mb-5">
                    {sortedTools.slice(0, 6).map(([tool, count]) => (
                      <div key={tool} className="flex items-center gap-2.5">
                        <span className="w-[120px] text-[0.75rem] text-text-secondary shrink-0 truncate">
                          {TOOL_LABELS[tool] ?? tool}
                        </span>
                        <div className="flex-1 bg-bg-elevated rounded-[3px] h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-brand-lime rounded-[3px]"
                            style={{ width: `${(count / maxToolCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-[0.75rem] text-text-muted w-5 text-right shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                  {categoryCounts.length > 0 && (
                    <>
                      <p className="text-[0.72rem] text-text-muted mb-3">By category</p>
                      <div className="flex flex-col gap-2">
                        {categoryCounts.map(cat => (
                          <div key={cat.label} className="flex items-center gap-2.5">
                            <span className="w-[120px] text-[0.72rem] text-text-muted shrink-0 truncate">{cat.label}</span>
                            <div className="flex-1 bg-bg-elevated rounded-[3px] h-1 overflow-hidden">
                              <div
                                className="h-full rounded-[3px]"
                                style={{
                                  width: `${(cat.count / maxCatCount) * 100}%`,
                                  backgroundColor: 'var(--brand-lime)',
                                  opacity: 0.5,
                                }}
                              />
                            </div>
                            <span className="text-[0.72rem] text-text-muted w-5 text-right shrink-0">{cat.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Contract risk */}
            {totalContracts > 0 && (
              <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
                <p className="font-semibold text-[0.9rem] mb-0.5">Contract risk</p>
                <p className="text-text-muted text-[0.72rem] mb-5">
                  {totalContracts} contract{totalContracts !== 1 ? 's' : ''} analyzed
                  {ndaCount > 0 ? ` · ${ndaCount} NDA${ndaCount !== 1 ? 's' : ''}` : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {RISK_META.map(({ key, label, color }) => {
                    const count = riskDist[key]
                    return (
                      <div
                        key={key}
                        className="bg-bg-elevated rounded-[10px] p-4"
                        style={{ borderLeft: `3px solid ${count > 0 ? color : 'var(--bg-border)'}` }}
                      >
                        <div
                          className="text-[1.6rem] font-extrabold leading-none tracking-[-0.03em] mb-1"
                          style={{ color: count > 0 ? color : 'var(--text-muted)' }}
                        >
                          {count}
                        </div>
                        <div className="text-text-muted text-[0.75rem]">{label}</div>
                      </div>
                    )
                  })}
                </div>
                {ndaCount > 0 && saCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-bg-border flex gap-4">
                    <div className="flex-1">
                      <p className="text-[0.72rem] text-text-muted mb-1">Service agreements</p>
                      <p className="font-bold text-lg leading-none">{saCount}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.72rem] text-text-muted mb-1">NDAs</p>
                      <p className="font-bold text-lg leading-none">{ndaCount}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Row 4: Monthly quota ──────────────────────────────────────── */}
          <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6" style={{ animationDelay: '0.13s' }}>
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="font-semibold text-[0.9rem] mb-0.5">Monthly usage</p>
                <p className="text-text-muted text-[0.72rem]">
                  {isPro ? 'Pro plan' : 'Free plan'} · resets each billing period
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {([
                { label: 'Responses', used: periodResponses, limit: responseLimit },
                { label: 'Contract analyses', used: periodContracts, limit: contractLimit },
              ] as const).map(({ label, used, limit }) => {
                const pct    = Math.min(Math.round((used / limit) * 100), 100)
                const nearCap = pct >= 80
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.8rem] text-text-secondary">{label}</span>
                      <span className="text-[0.78rem] text-text-muted">
                        <span className={nearCap ? 'text-brand-lime font-semibold' : ''}>{used}</span>
                        {' / '}{limit}
                      </span>
                    </div>
                    <div className="bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: nearCap ? 'var(--brand-lime)' : 'var(--bg-border)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
