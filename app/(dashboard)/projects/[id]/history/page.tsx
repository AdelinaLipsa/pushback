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
    supabase.from('defense_responses').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('plan').eq('id', user.id).single(),
  ])

  if (!project) notFound()

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <Link href={`/projects/${id}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.5rem' }} className="hover:text-white transition-colors">
        ← {project.title}
      </Link>

      <h1 style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>Message history</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>{project.client_name}</p>

      <ResponseHistory responses={(responses ?? []) as DefenseResponse[]} plan={(profile?.plan ?? 'free') as Plan} />
    </div>
  )
}
