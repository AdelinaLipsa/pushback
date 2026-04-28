import { z } from 'zod'
import { anthropic, INTAKE_QUESTIONNAIRE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, toolsRateLimit } from '@/lib/rate-limit'
import { IntakeQuestionnaire } from '@/types'

const bodySchema = z.object({
  description: z.string().min(20).max(5_000),
})

function extractJson(raw: string): IntakeQuestionnaire {
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('No valid JSON in response')
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(toolsRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: INTAKE_QUESTIONNAIRE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: parsed.data.description }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const questionnaire = extractJson(raw)
  return Response.json({ questionnaire })
}
