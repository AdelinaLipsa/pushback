import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderPlus, ShieldCheck, FileText, Zap, DollarSign } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DefenseTool, Project } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { PLANS } from '@/lib/plans'
import UpgradePrompt from '@/components/shared/UpgradePrompt'
import { computeClientRisk, LEVEL_LABELS, CLIENT_RISK_COLORS } from '@/lib/clientRisk'
import WelcomeToast from '@/components/shared/WelcomeToast'
import OnboardingModal from '@/components/shared/OnboardingModal'
import QuotaBar from '@/components/dashboard/QuotaBar'

// ---- Attention alert types ----

type AlertSeverity = 'overdue' | 'due-soon' | 'ghost' | 'stalled' | 'client-risk'

interface AttentionItem {
  projectId: string
  projectTitle: string
  clientName: string
  description: string
  daysDelta: number | null
  handleTool: DefenseTool | null
  severity: AlertSeverity
  ctaLabel?: string
}

function businessDaysBetween(from: Date, to: Date): number {
  let count = 0
  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (cur < end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function calendarDaysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

type ProjectWithResponses = Project & {
  contracts?: { id: string; risk_score: number | null; risk_level: string | null; title: string | null; status: string | null; created_at: string } | null
  defense_responses?: Array<{ id: string; tool_type: DefenseTool; created_at: string; was_sent: boolean }> | null
}

function computeAttentionItems(projects: ProjectWithResponses[], today: Date): AttentionItem[] {
  const items: AttentionItem[] = []

  for (const p of projects) {
    const responses = p.defense_responses ?? []

    if (p.payment_due_date && !p.payment_received_at) {
      const due = new Date(p.payment_due_date)
      due.setHours(0, 0, 0, 0)
      const todayMid = new Date(today)
      todayMid.setHours(0, 0, 0, 0)
      const daysLate = calendarDaysBetween(due, todayMid)

      if (daysLate > 0) {
        const sentFirst = responses.some(r => r.tool_type === 'payment_first' && r.was_sent)
        const handleTool: DefenseTool = sentFirst ? 'payment_second' : 'payment_first'
        items.push({
          projectId: p.id,
          projectTitle: p.title,
          clientName: p.client_name,
          description: `Payment ${daysLate} day${daysLate !== 1 ? 's' : ''} overdue`,
          daysDelta: daysLate,
          handleTool,
          severity: 'overdue',
        })
        continue
      }

      const daysUntil = calendarDaysBetween(todayMid, due)
      if (daysUntil >= 0 && daysUntil <= 3) {
        items.push({
          projectId: p.id,
          projectTitle: p.title,
          clientName: p.client_name,
          description: daysUntil === 0 ? 'Payment due today' : `Payment due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          daysDelta: daysUntil,
          handleTool: 'payment_first',
          severity: 'due-soon',
        })
      }
    }

    const sentGhost = responses
      .filter(r => r.tool_type === 'ghost_client' && r.was_sent)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (sentGhost.length > 0) {
      const mostRecent = new Date(sentGhost[0].created_at)
      const bizDays = businessDaysBetween(mostRecent, today)
      if (bizDays > 5) {
        items.push({
          projectId: p.id,
          projectTitle: p.title,
          clientName: p.client_name,
          description: `No response in ${bizDays} business days — client may be gone`,
          daysDelta: bizDays,
          handleTool: 'ghost_client',
          severity: 'ghost',
        })
      }
    }

    if (!p.payment_received_at) {
      const sentPayment = responses
        .filter(r => (r.tool_type === 'payment_first' || r.tool_type === 'payment_second') && r.was_sent)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      if (sentPayment.length > 0) {
        const mostRecent = sentPayment[0]
        const daysSince = calendarDaysBetween(new Date(mostRecent.created_at), today)
        if (daysSince > 7) {
          const nextTool: DefenseTool = mostRecent.tool_type === 'payment_first' ? 'payment_second' : 'payment_final'
          const alreadyOverdue = items.some(i => i.projectId === p.id && i.severity === 'overdue')
          if (!alreadyOverdue) {
            items.push({
              projectId: p.id,
              projectTitle: p.title,
              clientName: p.client_name,
              description: `Payment reminder sent ${daysSince} days ago — no response`,
              daysDelta: daysSince,
              handleTool: nextTool,
              severity: 'stalled',
            })
          }
        }
      }
    }
  }

  return items
}

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  overdue: '#ef4444',
  'due-soon': 'var(--brand-lime)',
  ghost: '#f59e0b',
  stalled: '#f59e0b',
  'client-risk': CLIENT_RISK_COLORS.red,
}

function AttentionAlert({ item, borderColorOverride }: { item: AttentionItem; borderColorOverride?: string }) {
  const borderColor = borderColorOverride ?? SEVERITY_BORDER[item.severity]
  const ctaLabel = item.ctaLabel ?? 'Handle now →'
  const href = item.handleTool
    ? `/projects/${item.projectId}?tool=${item.handleTool}`
    : `/projects/${item.projectId}`
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {item.projectTitle}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.85rem' }}>
            {item.clientName}
          </span>
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.description}</span>
      </div>
      <Link
        href={href}
        style={{
          color: 'var(--brand-lime)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        className="hover:opacity-80 transition-opacity"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

// ---- Tool label lookup ----
const TOOL_LABELS: Record<string, string> = Object.fromEntries(
  DEFENSE_TOOLS.map(t => [t.type, t.label])
)

// ---- Relative time ----
function relativeTime(date: Date, now: Date): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ---- Activity stream ----
interface ActivityEvent {
  id: string
  type: 'response' | 'contract'
  label: string
  projectId: string
  projectTitle: string
  createdAt: Date
  wasSent: boolean
  href: string
}

function computeActivityStream(projects: ProjectWithResponses[]): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (const p of projects) {
    for (const r of p.defense_responses ?? []) {
      events.push({
        id: r.id,
        type: 'response',
        label: TOOL_LABELS[r.tool_type] ?? r.tool_type,
        projectId: p.id,
        projectTitle: p.title,
        createdAt: new Date(r.created_at),
        wasSent: r.was_sent,
        href: `/projects/${p.id}`,
      })
    }
    const c = p.contracts
    if (c && c.status === 'analyzed') {
      events.push({
        id: `contract-${p.id}`,
        type: 'contract',
        label: 'Contract analyzed',
        projectId: p.id,
        projectTitle: p.title,
        createdAt: new Date(c.created_at),
        wasSent: false,
        href: `/projects/${p.id}`,
      })
    }
  }
  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)
}

// ---- Payment pipeline ----
type PipelineUrgency = 'red' | 'amber' | 'muted'

interface PipelineItem {
  id: string
  projectId: string
  projectTitle: string
  toolLabel: string
  createdAt: Date
  urgency: PipelineUrgency
}

const PIPELINE_TOOLS = new Set(['payment_first', 'payment_second', 'payment_final'])
const PIPELINE_URGENCY: Record<string, PipelineUrgency> = {
  payment_final: 'red',
  payment_second: 'amber',
  payment_first: 'muted',
}
const URGENCY_ORDER: Record<PipelineUrgency, number> = { red: 0, amber: 1, muted: 2 }

function computePaymentPipeline(projects: ProjectWithResponses[]): PipelineItem[] {
  const perProject = new Map<string, PipelineItem>()
  for (const p of projects) {
    if (p.payment_received_at) continue
    for (const r of p.defense_responses ?? []) {
      if (!PIPELINE_TOOLS.has(r.tool_type)) continue
      const urgency = PIPELINE_URGENCY[r.tool_type] ?? 'muted'
      const existing = perProject.get(p.id)
      if (!existing || URGENCY_ORDER[urgency] < URGENCY_ORDER[existing.urgency]) {
        perProject.set(p.id, {
          id: r.id,
          projectId: p.id,
          projectTitle: p.title,
          toolLabel: TOOL_LABELS[r.tool_type] ?? r.tool_type,
          createdAt: new Date(r.created_at),
          urgency,
        })
      }
    }
  }
  return [...perProject.values()]
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
    .slice(0, 6)
}

// ---- Overview stat tile ----
function StatTile({ label, value, sub, accentColor }: { label: string; value: string | number; sub?: string; accentColor?: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid ${accentColor ? `${accentColor}30` : 'var(--bg-border)'}`,
      borderRadius: '0.75rem',
      padding: '1rem 1.125rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: accentColor ?? 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{sub}</span>
      )}
    </div>
  )
}

// ---- Next action suggestion ----
interface NextAction {
  title: string
  description: string
  href: string
  cta: string
}

function computeNextAction(
  projects: ProjectWithResponses[],
  contractsAnalyzed: number,
  responsesSent: number,
): NextAction | null {
  if (projects.length === 0) return null

  const withoutContract = projects.filter(p => p.contracts?.risk_score === null || p.contracts?.risk_score === undefined)
  if (withoutContract.length > 0) {
    const p = withoutContract[0]
    return {
      title: 'Analyze a contract',
      description: `${withoutContract.length} project${withoutContract.length > 1 ? 's' : ''} ${withoutContract.length > 1 ? 'have' : 'has'} no contract analyzed yet — catch red flags before you sign.`,
      href: `/contracts/new?project_id=${p.id}`,
      cta: 'Analyze now →',
    }
  }

  if (responsesSent === 0) {
    const p = projects[0]
    return {
      title: 'Send a defense response',
      description: `Your arsenal is loaded with ${DEFENSE_TOOLS.length} tools. Use one on a live project to handle a difficult situation.`,
      href: `/projects/${p.id}`,
      cta: 'Open project →',
    }
  }

  return null
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; upgraded?: string; welcome?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: projects, error: projectsError }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts!projects_contract_id_fkey(id, risk_score, risk_level, title, status, created_at), defense_responses(id, tool_type, created_at, was_sent)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  ])

  if (projectsError) {
    console.error('[dashboard] projects query error:', projectsError)
  }

  const showUpgrade = params.upgrade === '1' || params.upgraded === 'true'
  const isNewUser = params.welcome === '1'

  const today = new Date()
  const projectList = (projects ?? []) as ProjectWithResponses[]
  const attentionItems = computeAttentionItems(projectList, today)

  // Client risk spotlight
  let topRiskItem: AttentionItem | null = null
  let topRiskBorder: string | null = null
  if (projectList.length > 0) {
    const scored = projectList
      .map((p) => ({ project: p, risk: computeClientRisk(p) }))
      .filter((entry) => entry.risk.score > 25)
      .sort((a, b) => b.risk.score - a.risk.score)
    const top = scored[0]
    if (top) {
      topRiskItem = {
        projectId: top.project.id,
        projectTitle: top.project.title,
        clientName: top.project.client_name,
        description: `Client Risk: ${top.risk.score} — ${LEVEL_LABELS[top.risk.level]}`,
        daysDelta: null,
        handleTool: null,
        severity: 'client-risk',
        ctaLabel: 'View project →',
      }
      topRiskBorder = CLIENT_RISK_COLORS[top.risk.level]
    }
  }
  if (topRiskItem && attentionItems.some((a) => a.projectId === topRiskItem!.projectId)) {
    topRiskItem = null
    topRiskBorder = null
  }

  // ---- Overview stats ----
  const queryFailed = !!projectsError
  const totalProjects = projectList.length
  const allResponses = projectList.flatMap(p => p.defense_responses ?? [])
  const responsesSent = allResponses.filter(r => r.was_sent).length
  const contractsAnalyzed = projectList.filter(p => p.contracts?.risk_score !== null && p.contracts?.risk_score !== undefined).length

  const outstandingProjects = projectList.filter(
    p => (p.payment_amount !== null || p.payment_due_date !== null) && !p.payment_received_at
  )
  const outstandingCount = outstandingProjects.length
  const outstandingValue = outstandingProjects.reduce((sum, p) => sum + (p.payment_amount ?? 0), 0)

  const nextAction = computeNextAction(projectList, contractsAnalyzed, responsesSent)
  const activityEvents = computeActivityStream(projectList)
  const pipelineItems = computePaymentPipeline(projectList)

  const isPro = profile?.plan === 'pro'
  const responsesUsed = isPro ? (profile?.period_responses_used ?? 0) : (profile?.defense_responses_used ?? 0)
  const contractsUsed = isPro ? (profile?.period_contracts_used ?? 0) : (profile?.contracts_used ?? 0)
  const responsesLimit = isPro ? PLANS.pro.defense_responses : PLANS.free.defense_responses
  const contractsLimit = isPro ? PLANS.pro.contracts : PLANS.free.contracts

  return (
    <div style={{ padding: '2rem' }}>
      <OnboardingModal isNew={isNewUser} />
      <WelcomeToast isNew={isNewUser} />

      {showUpgrade && profile?.plan === 'free' && (
        <div style={{ marginBottom: '2rem' }}>
          <UpgradePrompt responsesUsed={profile.defense_responses_used} />
        </div>
      )}

      {params.upgraded === 'true' && profile?.plan === 'pro' && (
        <div style={{ backgroundColor: 'var(--brand-green-dim)', border: '1px solid var(--brand-green)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '2rem', color: 'var(--brand-green)', fontWeight: 500 }}>
          You&apos;re on Pro. Unlimited responses, unlimited contract analyses.
        </div>
      )}

      {/* Overview tiles */}
      <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem', animationDelay: '0.03s' }}>
        <StatTile
          label="Projects"
          value={totalProjects}
          sub={totalProjects === 0 ? 'None yet' : totalProjects === 1 ? '1 active' : `${totalProjects} total`}
        />
        <StatTile
          label="Outstanding"
          value={outstandingValue > 0 ? `$${outstandingValue.toLocaleString()}` : outstandingCount}
          sub={outstandingValue > 0 ? `${outstandingCount} unpaid invoice${outstandingCount !== 1 ? 's' : ''}` : outstandingCount === 0 ? 'All paid up' : 'No amounts set'}
          accentColor={outstandingValue > 0 ? '#ef4444' : outstandingCount > 0 ? '#f59e0b' : undefined}
        />
        <StatTile
          label="Responses sent"
          value={responsesSent}
          sub={allResponses.length > responsesSent ? `${allResponses.length - responsesSent} drafted` : responsesSent > 0 ? 'across all projects' : 'None sent yet'}
          accentColor={responsesSent > 0 ? '#84cc16' : undefined}
        />
        <StatTile
          label="Contracts"
          value={contractsAnalyzed}
          sub={contractsAnalyzed === 0 && totalProjects > 0 ? `${totalProjects - contractsAnalyzed} unanalyzed` : contractsAnalyzed > 0 ? 'analyzed' : 'None yet'}
          accentColor={contractsAnalyzed === 0 && totalProjects > 0 ? '#f59e0b' : contractsAnalyzed > 0 ? '#84cc16' : undefined}
        />
      </div>

      {/* Needs attention */}
      {totalProjects > 0 && (
        <div className="fade-up" style={{ marginBottom: '2rem', animationDelay: '0.06s' }}>
          <h2 style={{ fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Needs attention
          </h2>
          {attentionItems.length === 0 && !topRiskItem ? (
            nextAction ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                flexWrap: 'wrap',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderLeft: '3px solid #84cc16', borderRadius: '0.5rem',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={13} style={{ color: '#84cc16', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#84cc16', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      All clear
                    </span>
                  </div>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginLeft: '1.4rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{nextAction.title}:</span>{' '}
                    {nextAction.description}
                  </span>
                </div>
                <Link
                  href={nextAction.href}
                  style={{ color: 'var(--brand-lime)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                  className="hover:opacity-80 transition-opacity"
                >
                  {nextAction.cta}
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(132,204,22,0.15)',
                borderLeft: '3px solid #84cc16', borderRadius: '0.5rem',
              }}>
                <ShieldCheck size={15} style={{ color: '#84cc16', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  All clear — no overdue payments or client issues detected.
                </span>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attentionItems.map((item, i) => (
                <div key={`${item.projectId}-${item.severity}-${i}`} className="fade-up" style={{ animationDelay: `${0.09 + i * 0.05}s` }}>
                  <AttentionAlert item={item} />
                </div>
              ))}
              {topRiskItem && (
                <div className="fade-up" style={{ animationDelay: `${0.09 + attentionItems.length * 0.05}s` }}>
                  <AttentionAlert item={topRiskItem} borderColorOverride={topRiskBorder ?? undefined} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main content: empty state (full-width) or two-column layout */}
      {totalProjects === 0 && !queryFailed ? (
        <div className="fade-up" style={{ marginBottom: '2rem', animationDelay: '0.12s' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1rem', padding: '3rem 1.5rem', textAlign: 'center',
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
          }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem',
              backgroundColor: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderPlus size={20} style={{ color: 'var(--brand-lime)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                No projects yet
              </span>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '22rem', lineHeight: 1.5 }}>
                Add a client project to track payments, send defense responses, and analyze contracts.
              </span>
            </div>
            <Link
              href="/projects/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1.125rem',
                backgroundColor: 'var(--brand-lime)', color: '#000',
                borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem',
                textDecoration: 'none', transition: 'opacity 150ms ease',
              }}
              className="hover:opacity-90"
            >
              <FolderPlus size={14} />
              New project
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', marginBottom: '2rem', alignItems: 'start' }}>

          {/* Left: Activity stream */}
          <div className="fade-up" style={{ animationDelay: '0.12s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>
                Activity
              </h2>
              <Link href="/projects" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-text-secondary transition-colors">
                All projects →
              </Link>
            </div>
            {activityEvents.length === 0 ? (
              <div style={{
                padding: '1.5rem 1rem',
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderRadius: '0.5rem', textAlign: 'center',
                fontSize: '0.825rem', color: 'var(--text-muted)',
              }}>
                No activity yet — use a defense tool to get started
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {activityEvents.map((event, i) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="fade-up hover:border-white/20"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                      borderRadius: '0.5rem', textDecoration: 'none',
                      transition: 'border-color 150ms ease',
                      animationDelay: `${0.14 + i * 0.04}s`,
                    }}
                  >
                    {/* Dot indicator: filled = response sent, outline = else */}
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '9999px', flexShrink: 0,
                      backgroundColor: event.type === 'response' && event.wasSent ? '#84cc16' : 'transparent',
                      border: event.type === 'response' && event.wasSent ? 'none' : '1.5px solid var(--text-muted)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.projectTitle}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {relativeTime(event.createdAt, today)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar: QuotaBar + Pipeline */}
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: '0.15s' }}>
            <QuotaBar
              plan={(profile?.plan ?? 'free') as 'free' | 'pro'}
              responsesUsed={responsesUsed}
              responsesLimit={responsesLimit}
              contractsUsed={contractsUsed}
              contractsLimit={contractsLimit}
            />

            {/* Payment pipeline */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.625rem',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Payment pipeline
              </span>
              {pipelineItems.length === 0 ? (
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>No outstanding invoices</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {pipelineItems.map(item => {
                    const dotColor = item.urgency === 'red' ? '#ef4444' : item.urgency === 'amber' ? '#f59e0b' : 'var(--text-muted)'
                    return (
                      <Link
                        key={item.id}
                        href={`/projects/${item.projectId}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          textDecoration: 'none',
                          padding: '0.25rem 0',
                        }}
                        className="group"
                      >
                        <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: dotColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.projectTitle}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.toolLabel}</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                          {relativeTime(item.createdAt, today)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arsenal CTA */}
      <div className="fade-up" style={{ animationDelay: '0.2s' }}>
        <Link
          href="/arsenal"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
            borderRadius: '0.625rem', textDecoration: 'none',
            transition: 'border-color 150ms ease',
          }}
          className="hover:border-white/20 group"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Browse Arsenal
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {DEFENSE_TOOLS.length} tools — every situation mapped with when to use it
            </span>
          </div>
          <span style={{ color: 'var(--brand-lime)', fontSize: '0.85rem', fontWeight: 600, marginLeft: '1rem', flexShrink: 0 }}>
            Open →
          </span>
        </Link>
      </div>
    </div>
  )
}
