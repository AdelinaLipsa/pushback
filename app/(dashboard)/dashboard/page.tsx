import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Project } from '@/types'
import ProjectCard from '@/components/project/ProjectCard'
import UpgradePrompt from '@/components/shared/UpgradePrompt'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; upgraded?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts(risk_score, risk_level), defense_responses(id, tool_type, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  ])

  const showUpgrade = params.upgrade === '1' || params.upgraded === 'true'

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {showUpgrade && profile?.plan === 'free' && (
        <div style={{ marginBottom: '2rem' }}>
          <UpgradePrompt responsesUsed={profile.defense_responses_used} />
        </div>
      )}

      {params.upgraded === 'true' && profile?.plan === 'pro' && (
        <div style={{ backgroundColor: 'var(--brand-green-dim)', border: '1px solid var(--brand-green)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '2rem', color: 'var(--brand-green)', fontWeight: 500 }}>
          ✓ You&apos;re now on Pro. Unlimited responses, unlimited contract analyses.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
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
