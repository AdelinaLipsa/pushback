import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ exists: false })

  const admin = createAdminSupabaseClient()
  const { data } = await admin
    .from('user_profiles')
    .select('id')
    .eq('email', parsed.data.email.toLowerCase())
    .maybeSingle()

  return Response.json({ exists: !!data })
}
