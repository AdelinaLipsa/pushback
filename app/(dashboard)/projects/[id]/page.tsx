import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectDetailClient from '@/components/project/ProjectDetailClient'
import { UserProfile, Project } from '@/types'

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
  // Cast to Project type: Supabase infers nullable for some non-null columns (e.g. currency),
  // but our app enforces defaults at insert time. This mirrors the profile cast above.
  const typedProject = project as unknown as Project & {
    contracts?: { id: string; risk_score: number | null; risk_level: string | null; title: string | null } | null
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <ProjectDetailClient
        project={typedProject}
        plan={p?.plan ?? 'free'}
        responsesUsed={p?.defense_responses_used ?? 0}
      />
    </div>
  )
}
