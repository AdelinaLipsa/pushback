import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectDetailClient from '@/components/project/ProjectDetailClient'
import { UserProfile, Project, DefenseTool } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tool?: string }>
}) {
  const { id } = await params
  const { tool } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts(id, risk_score, risk_level, title), defense_responses(id, tool_type, created_at, was_sent)')
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
    defense_responses?: Array<{ id: string; tool_type: DefenseTool; created_at: string; was_sent: boolean }> | null
  }

  // Validate ?tool= search param against known DefenseTool values
  const validToolTypes = DEFENSE_TOOLS.map(t => t.type)
  const autoSelectTool: DefenseTool | undefined =
    tool && validToolTypes.includes(tool as DefenseTool) ? (tool as DefenseTool) : undefined

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <ProjectDetailClient
        project={typedProject}
        plan={p?.plan ?? 'free'}
        responsesUsed={p?.defense_responses_used ?? 0}
        autoSelectTool={autoSelectTool}
      />
    </div>
  )
}
