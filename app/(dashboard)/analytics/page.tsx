import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TOOL_LABELS } from '@/lib/defenseTools'

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

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: responses }, { data: contracts }, { data: projects }] = await Promise.all([
    supabase.from('defense_responses').select('id, tool_type, created_at, was_sent').eq('user_id', user.id),
    supabase.from('contracts').select('id, risk_level').eq('user_id', user.id),
    supabase.from('projects').select('id, payment_due_date, payment_received_at').eq('user_id', user.id),
  ])

  const allResponses = responses ?? []
  const allContracts = contracts ?? []
  const allProjects = projects ?? []

  const totalResponses = allResponses.length
  const sentCount = allResponses.filter(r => r.was_sent).length
  const sentRate = totalResponses > 0 ? Math.round((sentCount / totalResponses) * 100) : 0

  const projectsWithPayment = allProjects.filter(p => p.payment_due_date)
  const recoveredCount = projectsWithPayment.filter(p => p.payment_received_at).length
  const recoveryRate = projectsWithPayment.length > 0
    ? Math.round((recoveredCount / projectsWithPayment.length) * 100)
    : null

  const totalContracts = allContracts.length

  // Weekly volume — last 8 weeks
  const now = new Date()
  const thisMonday = weekMonday(now)
  const weeks: { key: string; label: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const monday = new Date(thisMonday)
    monday.setDate(monday.getDate() - i * 7)
    weeks.push({
      key: isoDate(monday),
      label: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    })
  }
  allResponses.forEach(r => {
    const key = isoDate(weekMonday(new Date(r.created_at!)))
    const slot = weeks.find(w => w.key === key)
    if (slot) slot.count++
  })
  const maxWeekCount = Math.max(...weeks.map(w => w.count), 1)

  // Tool usage
  const toolCounts: Record<string, number> = {}
  allResponses.forEach(r => { toolCounts[r.tool_type] = (toolCounts[r.tool_type] ?? 0) + 1 })
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])
  const maxToolCount = sortedTools[0]?.[1] ?? 1

  // Contract risk distribution
  const riskDist = { high: 0, medium: 0, low: 0 }
  allContracts.forEach(c => {
    if (c.risk_level === 'high') riskDist.high++
    else if (c.risk_level === 'medium') riskDist.medium++
    else if (c.risk_level === 'low') riskDist.low++
  })

  const hasAnyData = totalResponses > 0 || totalContracts > 0

  return (
    <div className="p-8">
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
          {/* Stat cards */}
          <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" style={{ animationDelay: '0.04s' }}>
            <StatCard label="Responses generated" value={String(totalResponses)} />
            <StatCard
              label="Send rate"
              value={totalResponses > 0 ? `${sentRate}%` : '—'}
              sub={totalResponses > 0 ? `${sentCount} sent` : undefined}
            />
            <StatCard
              label="Payment recovery"
              value={recoveryRate !== null ? `${recoveryRate}%` : '—'}
              sub={recoveryRate !== null
                ? `${recoveredCount} of ${projectsWithPayment.length} invoice${projectsWithPayment.length !== 1 ? 's' : ''}`
                : 'No tracked invoices'}
              accent={recoveryRate !== null && recoveryRate >= 50}
            />
            <StatCard label="Contracts analyzed" value={String(totalContracts)} />
          </div>

          {/* Volume chart + Tool usage */}
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

            {/* Tool usage */}
            <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
              <p className="font-semibold text-[0.9rem] mb-0.5">Tool usage</p>
              <p className="text-text-muted text-[0.72rem] mb-5">Most deployed</p>
              {sortedTools.length === 0 ? (
                <p className="text-text-muted text-sm">No data yet</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {sortedTools.slice(0, 7).map(([tool, count]) => (
                    <div key={tool} className="flex items-center gap-2.5">
                      <span className="w-[115px] text-[0.75rem] text-text-secondary shrink-0 truncate">
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
              )}
            </div>
          </div>

          {/* Contract risk distribution */}
          {totalContracts > 0 && (
            <div className="fade-up bg-bg-surface border border-bg-border rounded-xl p-6" style={{ animationDelay: '0.10s' }}>
              <p className="font-semibold text-[0.9rem] mb-0.5">Contract risk</p>
              <p className="text-text-muted text-[0.72rem] mb-6">
                Across {totalContracts} analyzed contract{totalContracts !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-4 flex-wrap">
                {([
                  { label: 'High risk', count: riskDist.high, color: '#ef4444' },
                  { label: 'Medium risk', count: riskDist.medium, color: '#f59e0b' },
                  { label: 'Low risk', count: riskDist.low, color: 'var(--brand-lime)' },
                ] as const).map(({ label, count, color }) => (
                  <div
                    key={label}
                    className="flex-1 min-w-[100px] bg-bg-elevated rounded-[10px] p-4"
                    style={{ borderLeft: `3px solid ${count > 0 ? color : 'var(--bg-border)'}` }}
                  >
                    <div
                      className="text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] mb-1.5"
                      style={{ color: count > 0 ? color : 'var(--text-muted)' }}
                    >
                      {count}
                    </div>
                    <div className="text-text-muted text-[0.78rem]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
