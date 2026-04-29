export const maxDuration = 30

import { anthropic, DEFENSE_SYSTEM_PROMPT } from '@/lib/anthropic'
import { checkRateLimit, demoRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { z } from 'zod'

const DEMO_TOOL_LABELS: Record<string, string> = {
  chargeback_threat: 'CHARGEBACK THREAT',
  review_threat: 'REVIEW THREAT',
  ip_dispute: 'IP / SOURCE FILE DISPUTE',
}

const DEMO_COOKIE = 'pb_demo'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const demoSchema = z.object({
  tool_type: z.enum(['chargeback_threat', 'review_threat', 'ip_dispute']),
  situation: z.string().min(20).max(1000),
})

function hasDemoCookie(request: Request): boolean {
  const cookieStr = request.headers.get('cookie') ?? ''
  return cookieStr.split(';').some(c => c.trim().startsWith(`${DEMO_COOKIE}=`))
}

function buildSetCookie(): string {
  const isProd = process.env.NODE_ENV === 'production'
  return [
    `${DEMO_COOKIE}=1`,
    'HttpOnly',
    isProd ? 'Secure' : null,
    'SameSite=Strict',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
  ].filter(Boolean).join('; ')
}

const LIMIT_RESPONSE = Response.json(
  { error: 'You\'ve already used your free demo. Sign up for a free account to continue.' },
  { status: 429 }
)

export async function POST(request: Request) {
  // Cookie gate — primary check (VPN-resistant)
  if (hasDemoCookie(request)) return LIMIT_RESPONSE

  // IP gate — secondary check
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const rateLimitResponse = await checkRateLimit(demoRateLimit, `demo:${ip}`)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const parsed = demoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { tool_type, situation } = parsed.data

  const userMessage = [
    '(No contract on file — respond using professional best-practice language, do not invent contract terms)',
    `\nTOOL: ${DEMO_TOOL_LABELS[tool_type]}`,
    `\nSITUATION:\n${situation}`,
    '\nWrite the message now.',
  ].join('')

  const slotResponse = await acquireAnthropicSlot()
  if (slotResponse) return slotResponse

  let response: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: DEFENSE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    response = message.content[0].type === 'text' ? message.content[0].text : ''
  } finally {
    await releaseAnthropicSlot()
  }

  return new Response(JSON.stringify({ response, tool_type }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildSetCookie(),
    },
  })
}
