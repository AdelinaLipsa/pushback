export const maxDuration = 30

import { anthropic, RED_FLAG_SYSTEM_PROMPT } from '@/lib/anthropic'
import { checkRateLimit, demoRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { z } from 'zod'
import { RedFlagAnalysis } from '@/types'

const DEMO_COOKIE = 'pb_demo_rf'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const bodySchema = z.object({
  message: z.string().min(20).max(2000),
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

function extractJson(raw: string): RedFlagAnalysis {
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('No valid JSON in response')
  }
}

const LIMIT_RESPONSE = Response.json(
  { error: 'You\'ve already used your free demo. Sign up for a free account to continue.' },
  { status: 429 }
)

export async function POST(request: Request) {
  if (hasDemoCookie(request)) return LIMIT_RESPONSE

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const rateLimitResponse = await checkRateLimit(demoRateLimit, `demo_rf:${ip}`)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const slotResponse = await acquireAnthropicSlot()
  if (slotResponse) return slotResponse

  let analysis: RedFlagAnalysis
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: RED_FLAG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parsed.data.message }],
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    analysis = extractJson(raw)
  } catch {
    return Response.json({ error: 'Analysis failed — please try again.' }, { status: 500 })
  } finally {
    await releaseAnthropicSlot()
  }

  return new Response(JSON.stringify({ analysis }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildSetCookie(),
    },
  })
}
