import { anthropic, COUNTER_OFFER_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, toolsRateLimit } from '@/lib/rate-limit'
import { mergeWithProAnalysis } from '@/lib/contractAnalysis'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(toolsRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).single()
  if (!profile || profile.plan !== 'pro') {
    return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
  }

  // Counts against the shared defense_responses quota — same pool as defend/red-flag/intake
  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; reason?: string } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  const { id } = await params
  const { data: contract } = await supabase
    .from('contracts').select('analysis, status').eq('id', id).eq('user_id', user.id).single()

  if (!contract) {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (contract.status !== 'analyzed' || !contract.analysis) {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'Contract has not been analyzed yet' }, { status: 400 })
  }

  try {
    const analysis = await mergeWithProAnalysis(supabase, id, contract.analysis)
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: COUNTER_OFFER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is the contract risk analysis. Write the counter-offer email.\n\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
    })

    const email = message.content[0].type === 'text' ? message.content[0].text : ''
    return Response.json({ email })
  } catch (err) {
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    console.error('Counter-offer error:', err)
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  }
}
