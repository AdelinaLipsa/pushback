import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectsTable from '@/components/project/ProjectsTable'
import { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: baseProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (projectsError) {
    console.error('[projects/page] base query error:', projectsError)
  }

  const baseRows = baseProjects ?? []
  const projectIds = baseRows.map((p) => p.id)

  const [{ data: contracts, error: contractsError }, { data: responses, error: responsesError }] =
    projectIds.length > 0
      ? await Promise.all([
          supabase
            .from('contracts')
            .select('id, project_id, risk_score, risk_level')
            .eq('user_id', user.id)
            .in('project_id', projectIds),
          supabase
            .from('defense_responses')
            .select('id, project_id, tool_type, created_at')
            .eq('user_id', user.id)
            .in('project_id', projectIds)
            .order('created_at', { ascending: false }),
        ])
      : [{ data: [], error: null }, { data: [], error: null }]

  if (contractsError) console.error('[projects/page] contracts query error:', contractsError)
  if (responsesError) console.error('[projects/page] responses query error:', responsesError)

  const contractByProject = new Map<string, { risk_score: number | null; risk_level: string | null }>()
  for (const c of contracts ?? []) {
    if (c.project_id) contractByProject.set(c.project_id, { risk_score: c.risk_score, risk_level: c.risk_level })
  }
  const responsesByProject = new Map<string, Array<{ id: string; tool_type: string; created_at: string }>>()
  for (const r of responses ?? []) {
    if (!r.project_id || !r.created_at) continue
    const list = responsesByProject.get(r.project_id) ?? []
    list.push({ id: r.id, tool_type: r.tool_type, created_at: r.created_at })
    responsesByProject.set(r.project_id, list)
  }

  const projects = baseRows.map((p) => ({
    ...p,
    contracts: contractByProject.get(p.id) ?? null,
    defense_responses: responsesByProject.get(p.id) ?? [],
  }))

  return (
    <div style={{ padding: '2rem' }}>
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Your projects</h1>
        <Link
          href="/projects/new"
          style={{
            backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem',
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
        <div className="fade-up" style={{ animationDelay: '0.08s' }}>
          <ProjectsTable projects={projects as Project[]} />
        </div>
      )}
    </div>
  )
}
