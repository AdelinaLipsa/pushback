export const maxDuration = 30

import { anthropic, REPLY_ANALYSIS_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { z } from 'zod'

// 999.1: Inline JSON extraction — matches D-10 (do NOT extract to lib).
// Same pattern as analyze-message/route.ts and defend/route.ts.
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

// 999.1: Input schema — D-12 client_reply bounds.
const replySchema = z.object({
  client_reply: z.string().min(10).max(5000),
})

// 999.1: Output schema — D-13 4-stance enum + length caps matching the prompt.
const replyResponseSchema = z.object({
  risk_signal: z.enum(['backing_down', 'doubling_down', 'escalating', 'unclear']),
  signal_explanation: z.string().max(300),
  follow_up: z.string().max(1000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // D-15: Next.js 16 await params
  const { id: responseId } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Shared rate limiter with defend + analyze-message (D-01)
  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).single()
  if (!profile || profile.plan !== 'pro') {
    return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
  }

  // Atomic credit gate — same pool as defend + analyze-message (D-01)
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; reason?: string; period_count?: number } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  try {
    // SITE 1: Zod input failure
    const body = await request.json()
    const parsed = replySchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: `${String(issue.path[0])}: ${issue.message}` },
        { status: 400 }
      )
    }
    const { client_reply } = parsed.data

    // SITE 2: defense_response not found (IDOR-safe — both id AND user_id required)
    const { data: defenseResponse } = await supabase
      .from('defense_responses')
      .select('id, tool_type, situation, response')
      .eq('id', responseId)
      .eq('user_id', user.id)
      .single()

    if (!defenseResponse) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // SITE 3: Anthropic slot busy (503)
    const slotResponse = await acquireAnthropicSlot()
    if (slotResponse) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return slotResponse
    }

    // D-12: two user messages — original context + client reply
    let rawText: string
    try {
      const aiMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: REPLY_ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `ORIGINAL SITUATION:\n${defenseResponse.situation}\n\nMESSAGE YOU SENT:\n${defenseResponse.response}`,
          },
          {
            role: 'user',
            content: `CLIENT REPLIED:\n${client_reply}`,
          },
        ],
      })
      rawText = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : ''
    } finally {
      // Slot must always be released, even if Anthropic throws
      await releaseAnthropicSlot()
    }

    // SITE 4: extractJson throws
    let parsed2: unknown
    try {
      parsed2 = extractJson(rawText)
    } catch {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: 'AI analysis failed — please try again' },
        { status: 500 }
      )
    }

    // SITE 5: Output schema validation fails
    const validated = replyResponseSchema.safeParse(parsed2)
    if (!validated.success) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: 'AI returned an unexpected result — please try again' },
        { status: 500 }
      )
    }

    const { risk_signal, signal_explanation, follow_up } = validated.data

    // Credit-safe insert
    const { data: saved, error: saveError } = await supabase
      .from('reply_threads')
      .insert({
        defense_response_id: responseId,
        user_id: user.id,
        client_reply,
        risk_signal,
        signal_explanation,
        follow_up,
      })
      .select('id, risk_signal, signal_explanation, follow_up')
      .single()

    if (saveError || !saved) {
      // D-14: 23505 = duplicate (race / double-click) — return the existing row instead of error
      if (saveError && (saveError as { code?: string }).code === '23505') {
        const { data: existing } = await supabase
          .from('reply_threads')
          .select('id, risk_signal, signal_explanation, follow_up')
          .eq('defense_response_id', responseId)
          .eq('user_id', user.id)
          .single()
        if (existing) {
          // The credit was spent on the now-discarded second analysis — refund it
          await supabase.rpc('decrement_defense_responses', { uid: user.id })
          return Response.json(existing)
        }
      }
      // SITE 6: insert failure (non-23505 OR 23505 with no existing row found)
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: 'Failed to save reply — your credit was not used. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json(saved)
  } catch (err) {
    // SITE 7: outer catch
    console.error('Reply thread route error:', err)
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json(
      { error: 'AI analysis failed — please try again' },
      { status: 500 }
    )
  }
}
