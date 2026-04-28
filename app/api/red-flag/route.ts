import { z } from 'zod'
import { anthropic, RED_FLAG_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, toolsRateLimit } from '@/lib/rate-limit'
import { RedFlagAnalysis } from '@/types'

const bodySchema = z.object({
  message: z.string().min(20).max(10_000),
})

function extractJson(raw: string): RedFlagAnalysis {
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

  const { data: gateResult, error: gateError } = await supabase.rpc('check_and_increment_defense_responses', { uid: user.id })
  if (gateError) return Response.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  const gate = gateResult as { allowed: boolean; reason?: string } | null
  if (!gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  let raw: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: RED_FLAG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parsed.data.message }],
    })
    raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  } catch {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }

  try {
    const analysis = extractJson(raw)
    return Response.json({ analysis })
  } catch {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'Unexpected response format — please try again' }, { status: 500 })
  }
}
