import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, writesRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  client_name: z.string().min(1).max(200),
  project_value: z.number().positive().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'AUD', 'CAD']).optional(),
  client_email: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
})

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select('*, contracts(risk_score, risk_level)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ projects: data })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = String(issue.path[0])
    return Response.json({ error: `${field} is invalid: ${issue.message}` }, { status: 400 })
  }
  const { title, client_name, client_email, project_value, currency, notes } = parsed.data

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, title, client_name, client_email, project_value, currency: currency ?? 'EUR', notes })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ project: data })
}
