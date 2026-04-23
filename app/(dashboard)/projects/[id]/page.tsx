import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DefenseDashboard from '@/components/defense/DefenseDashboard'
import { UserProfile } from '@/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts(id, risk_score, risk_level, title)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  ])

  if (!project) notFound()

  const p = profile as UserProfile | null

  const RISK_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
  const RISK_COLORS: Record<string, string> = {
    low: 'var(--urgency-low)', medium: 'var(--urgency-medium)',
    high: 'var(--urgency-high)', critical: 'var(--urgency-high)',
  }

  const contract = (project as any).contracts
  const riskLevel = contract?.risk_level

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/projects" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }} className="hover:text-white transition-colors">
          ← Projects
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              {project.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {project.client_name}
              {project.client_email && <span> · {project.client_email}</span>}
              {project.project_value && (
                <span> · {project.currency} {Number(project.project_value).toLocaleString()}</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--brand-green)',
              fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.75rem',
              borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Contract strip */}
        <div style={{
          marginTop: '1.25rem', padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.85rem',
        }}>
          {contract ? (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>
                Contract linked: {contract.title} ·{' '}
                <span style={{ color: RISK_COLORS[riskLevel] ?? 'var(--text-muted)', fontWeight: 600 }}>
                  Risk {contract.risk_score}/10 [{RISK_LABEL[riskLevel] ?? riskLevel}]
                </span>
              </span>
              <Link href={`/contracts/${contract.id}`} style={{ color: 'var(--brand-amber)', textDecoration: 'none', fontWeight: 500 }}>
                View analysis →
              </Link>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)' }}>No contract linked</span>
              <Link href={`/contracts/new?project_id=${project.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
                Add contract
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', marginBottom: '2rem' }} />

      <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        What&apos;s happening?
      </h2>

      <DefenseDashboard
        projectId={project.id}
        plan={p?.plan ?? 'free'}
        responsesUsed={p?.defense_responses_used ?? 0}
      />

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href={`/projects/${project.id}/history`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }} className="hover:text-white transition-colors">
          View message history →
        </Link>
      </div>
    </div>
  )
}
