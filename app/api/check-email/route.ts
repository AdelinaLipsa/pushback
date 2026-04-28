import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, checkEmailRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  const rateLimitResponse = await checkRateLimit(checkEmailRateLimit, ip)
  if (rateLimitResponse) return rateLimitResponse

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
