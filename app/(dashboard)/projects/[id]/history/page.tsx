import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResponseHistory from '@/components/defense/ResponseHistory'
import { DefenseResponse, Plan } from '@/types'

export default async function ProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: responses }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('id, title, client_name').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('defense_responses').select('*, reply_threads(defense_response_id, risk_signal, signal_explanation, follow_up)').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('plan').eq('id', user.id).single(),
  ])

  if (!project) notFound()

  const plan = (profile?.plan ?? 'free') as Plan
  const allResponses = (responses ?? []) as DefenseResponse[]
  const visibleResponses = plan === 'free' ? allResponses.slice(0, 3) : allResponses
  const lockedCount = plan === 'free' ? Math.max(0, allResponses.length - 3) : 0

  return (
    <div style={{ padding: '2rem' }}>
      <Link href={`/projects/${id}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.5rem' }} className="hover:text-white transition-colors">
        ← {project.title}
      </Link>

      <h1 style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>Message history</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>{project.client_name}</p>

      <ResponseHistory responses={visibleResponses} lockedCount={lockedCount} isPro={plan === 'pro'} />
    </div>
  )
}
