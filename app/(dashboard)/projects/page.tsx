import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectCard from '@/components/project/ProjectCard'
import { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, contracts(risk_score, risk_level), defense_responses(id, tool_type, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
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
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>🛡</div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No projects yet.</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Add your first client project and get your first defense message.
          </p>
          <Link
            href="/projects/new"
            style={{
              backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
              padding: '0.7rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem',
            }}
          >
            New Project →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(projects as Project[]).map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
