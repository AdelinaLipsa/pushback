import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PROFESSIONS } from '@/lib/profession'
import { checkRateLimit, writesRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const VALID_PROFESSIONS = PROFESSIONS.map(p => p.value) as [string, ...string[]]

const schema = z.object({
  profession: z.enum(VALID_PROFESSIONS).nullable(),
})

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ profession: parsed.data.profession })
    .eq('id', user.id)

  if (error) return Response.json({ error: 'Update failed' }, { status: 500 })

  return Response.json({ ok: true })
}
