import { anthropic, COUNTER_OFFER_SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, toolsRateLimit } from '@/lib/rate-limit'
import { ContractAnalysis } from '@/types'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(toolsRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const { id } = await params
  const { data: contract } = await supabase
    .from('contracts')
    .select('analysis, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return Response.json({ error: 'Not found' }, { status: 404 })
  if (contract.status !== 'analyzed' || !contract.analysis) {
    return Response.json({ error: 'Contract has not been analyzed yet' }, { status: 400 })
  }

  const analysis = contract.analysis as ContractAnalysis
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
}
