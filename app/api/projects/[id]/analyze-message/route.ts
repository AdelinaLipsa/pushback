import { anthropic, CLASSIFY_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit } from '@/lib/rate-limit'
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

const DEFENSE_TOOL_VALUES = [
  'scope_change',
  'payment_first',
  'payment_second',
  'payment_final',
  'revision_limit',
  'kill_fee',
  'delivery_signoff',
  'dispute_response',
  'ghost_client',
  'feedback_stall',
  'moving_goalposts',
  'discount_pressure',
  'retroactive_discount',
  'rate_increase_pushback',
  'rush_fee_demand',
  'ip_dispute',
  'chargeback_threat',
  'spec_work_pressure',
  'post_handoff_request',
  'review_threat',
] as const

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
  const { id: _id } = await params  // project id — auth-scoped but not used in response (no DB row saved)
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
  const gate = gateResult as { allowed: boolean; current_count: number } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
  }
  // Store pre-increment count for compensating decrement on failure (D-05)
  const preIncrementCount = gate.current_count

  try {
    // Validate request body
    const body = await request.json()
    const parsed = classifySchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: `${String(issue.path[0])}: ${issue.message}` }, { status: 400 })
    }
    const { message: clientMessage } = parsed.data

    // Classify the client message (D-07)
    const aiMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: clientMessage }],
    })

    const rawText = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : ''

    // Extract JSON — handles preamble-wrapped responses (D-08)
    let parsed2: unknown
    try {
      parsed2 = extractJson(rawText)
    } catch {
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: 'AI classification failed — please try again' }, { status: 500 })
    }

    // Validate Claude's response shape and enum values (D-08)
    const validated = classifyResponseSchema.safeParse(parsed2)
    if (!validated.success) {
      await supabase
        .from('user_profiles')
        .update({ defense_responses_used: preIncrementCount })
        .eq('id', user.id)
      return Response.json({ error: 'AI returned an unexpected classification — please try again' }, { status: 500 })
    }

    const { tool_type, explanation, situation_context } = validated.data

    // No DB row saved — classification result is ephemeral (D-06)
    return Response.json({ tool_type, explanation, situation_context })
  } catch (err) {
    console.error('Analyze-message route error:', err)
    // Compensating decrement on any unhandled error (D-05)
    await supabase
      .from('user_profiles')
      .update({ defense_responses_used: preIncrementCount })
      .eq('id', user.id)
    return Response.json({ error: 'AI classification failed — please try again' }, { status: 500 })
  }
}
