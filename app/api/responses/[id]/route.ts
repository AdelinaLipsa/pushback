import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, writesRateLimit } from '@/lib/rate-limit'
import type { Database } from '@/types/database.types'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const allowed = ['was_copied', 'was_sent']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('defense_responses')
    .update(updates as Database['public']['Tables']['defense_responses']['Update'])
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ response: data })
}
