import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendFeedbackNotification } from '@/lib/email'
import { checkRateLimit, feedbackRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const CATEGORIES = ['bug', 'feature', 'idea', 'other'] as const

const schema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  category: z.enum(CATEGORIES).optional(),
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(feedbackRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    message: parsed.data.message,
    category: parsed.data.category ?? null,
  })

  if (error) return Response.json({ error: 'Failed to submit feedback' }, { status: 500 })

  sendFeedbackNotification(
    parsed.data.message,
    parsed.data.category ?? null,
    user.email ?? user.id,
  ).catch(() => {})

  return Response.json({ ok: true })
}
