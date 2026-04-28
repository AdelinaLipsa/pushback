import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProjectDetailClient from '@/components/project/ProjectDetailClient'
import { UserProfile, Project, DefenseTool, DefenseResponse, Plan } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tool?: string; view?: string }>
}) {
  const { id } = await params
  const { tool, view } = await searchParams
  const activeView = (view === 'contract' || view === 'history') ? view : 'defend'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: profile }, { data: historyData }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, contracts(id, risk_score, risk_level, title), defense_responses(id, tool_type, created_at, was_sent)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    activeView === 'history'
      ? supabase
          .from('defense_responses')
          .select('*, reply_threads(defense_response_id, risk_signal, signal_explanation, follow_up)')
          .eq('project_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
  ])

  if (!project) notFound()

  const p = profile as UserProfile | null
  const typedProject = project as unknown as Project & {
    contracts?: { id: string; risk_score: number | null; risk_level: string | null; title: string | null } | null
    defense_responses?: Array<{ id: string; tool_type: DefenseTool; created_at: string; was_sent: boolean }> | null
  }

  const validToolTypes = DEFENSE_TOOLS.map(t => t.type)
  const autoSelectTool: DefenseTool | undefined =
    tool && validToolTypes.includes(tool as DefenseTool) ? (tool as DefenseTool) : undefined

  const plan = (p?.plan ?? 'free') as Plan
  const allHistory = activeView === 'history' ? (historyData ?? []) as DefenseResponse[] : null
  const historyResponses = allHistory === null ? null : plan === 'free' ? allHistory.slice(0, 3) : allHistory
  const lockedCount = allHistory === null ? 0 : plan === 'free' ? Math.max(0, allHistory.length - 3) : 0

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <ProjectDetailClient
        project={typedProject}
        plan={plan}
        responsesUsed={p?.defense_responses_used ?? 0}
        autoSelectTool={autoSelectTool}
        view={activeView}
        historyResponses={historyResponses}
        lockedCount={lockedCount}
      />
    </div>
  )
}
