import { anthropic, CLASSIFY_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { DEFENSE_TOOL_VALUES } from '@/lib/defenseTools'
import { z } from 'zod'

// Inline JSON extraction — handles preamble-wrapped Claude responses (D-08)
function extractJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('No valid JSON found in response')
  }
}

// Input schema — validates the raw client message (D-06)
const classifySchema = z.object({
  message: z.string().min(10).max(5000),
})

// Response schema — validates Claude's JSON output (D-08)
const classifyResponseSchema = z.object({
  tool_type: z.enum(DEFENSE_TOOL_VALUES),
  explanation: z.string().max(500),
  situation_context: z.string().max(1000),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Atomic plan gate — shared RPC pool with defend route (D-03, D-04, DETECT-03)
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = classifySchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: `${String(issue.path[0])}: ${issue.message}` }, { status: 400 })
    }
    const { message: clientMessage } = parsed.data

    const slotResponse = await acquireAnthropicSlot()
    if (slotResponse) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return slotResponse
    }

    let rawText: string
    try {
      const aiMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system: CLASSIFY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: clientMessage }],
      })
      rawText = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : ''
    } finally {
      await releaseAnthropicSlot()
    }

    let parsed2: unknown
    try {
      parsed2 = extractJson(rawText)
    } catch {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'AI classification failed — please try again' }, { status: 500 })
    }

    const validated = classifyResponseSchema.safeParse(parsed2)
    if (!validated.success) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'AI returned an unexpected classification — please try again' }, { status: 500 })
    }

    const { tool_type, explanation, situation_context } = validated.data

    if (situation_context === 'OFF_TOPIC') {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: 'This tool handles freelancer-client situations only. Paste a message from your client and I\'ll help you respond.' },
        { status: 400 }
      )
    }

    return Response.json({ tool_type, explanation, situation_context })
  } catch (err) {
    console.error('Analyze-message route error:', err)
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'AI classification failed — please try again' }, { status: 500 })
  }
}
