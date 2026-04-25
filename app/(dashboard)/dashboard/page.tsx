import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DefenseTool, Project } from '@/types'
import ProjectCard from '@/components/project/ProjectCard'
import UpgradePrompt from '@/components/shared/UpgradePrompt'

// ---- Attention alert types ----

type AlertSeverity = 'overdue' | 'due-soon' | 'ghost' | 'stalled'

interface AttentionItem {
  projectId: string
  projectTitle: string
  clientName: string
  description: string
  daysDelta: number | null
  handleTool: DefenseTool
  severity: AlertSeverity
}

// Returns number of business days between two dates (Mon–Fri only)
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
  contracts?: { risk_score: number | null; risk_level: string | null } | null
  defense_responses?: Array<{ id: string; tool_type: DefenseTool; created_at: string; was_sent: boolean }> | null
}

function computeAttentionItems(projects: ProjectWithResponses[], today: Date): AttentionItem[] {
  const items: AttentionItem[] = []

  for (const p of projects) {
    const responses = p.defense_responses ?? []

    // --- Payment overdue ---
    if (p.payment_due_date && !p.payment_received_at) {
      const due = new Date(p.payment_due_date)
      due.setHours(0, 0, 0, 0)
      const todayMid = new Date(today)
      todayMid.setHours(0, 0, 0, 0)
      const daysLate = calendarDaysBetween(due, todayMid)

      if (daysLate > 0) {
        // Determine best tool: payment_first if not yet sent, payment_second if payment_first was sent
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
        continue // don't also add due-soon for same project
      }

      // --- Payment due soon (within 3 days) ---
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

    // --- Ghost client: most recent ghost_client response sent >5 business days ago ---
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

    // --- Stalled: most recent payment_first or payment_second sent >7 calendar days ago, no payment ---
    if (!p.payment_received_at) {
      const sentPayment = responses
        .filter(r => (r.tool_type === 'payment_first' || r.tool_type === 'payment_second') && r.was_sent)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      if (sentPayment.length > 0) {
        const mostRecent = sentPayment[0]
        const daysSince = calendarDaysBetween(new Date(mostRecent.created_at), today)
        if (daysSince > 7) {
          const nextTool: DefenseTool = mostRecent.tool_type === 'payment_first' ? 'payment_second' : 'payment_final'
          // Only add if not already added as overdue
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
}

function AttentionAlert({ item }: { item: AttentionItem }) {
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
        borderLeft: `3px solid ${SEVERITY_BORDER[item.severity]}`,
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
        href={`/projects/${item.projectId}?tool=${item.handleTool}`}
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
        Handle now →
      </Link>
    </div>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; upgraded?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts(risk_score, risk_level), defense_responses(id, tool_type, created_at, was_sent)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  ])

  const showUpgrade = params.upgrade === '1' || params.upgraded === 'true'

  const today = new Date()
  const attentionItems = computeAttentionItems((projects ?? []) as ProjectWithResponses[], today)

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
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

      {attentionItems.length > 0 && (
        <div className="fade-up" style={{ marginBottom: '2rem', animationDelay: '0.05s' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Needs attention
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attentionItems.map((item, i) => (
              <AttentionAlert key={`${item.projectId}-${item.severity}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}

      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Your projects</h1>
        <Link
          href="/projects/new"
          style={{
            backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none',
            fontSize: '0.9rem',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          New Project →
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1rem', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No projects yet.</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Add a client project to start generating defense messages.
          </p>
          <Link
            href="/projects/new"
            style={{
              backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
              padding: '0.7rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem',
            }}
          >
            Add your first project →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(projects as Project[]).map((project, i) => (
            <div key={project.id} className="fade-up" style={{ animationDelay: `${0.08 + i * 0.06}s` }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
