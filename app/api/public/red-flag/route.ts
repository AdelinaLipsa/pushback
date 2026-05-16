import { z } from 'zod'
import { anthropic, RED_FLAG_SYSTEM_PROMPT } from '@/lib/anthropic'
import { checkRateLimit, publicScanRateLimit, acquireAnthropicSlot, releaseAnthropicSlot } from '@/lib/rate-limit'
import { RedFlagAnalysis } from '@/types'

const bodySchema = z.object({
  message: z.string().min(20).max(8_000),
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

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const rateLimitResponse = await checkRateLimit(publicScanRateLimit, `ip:${ip}`)
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const slotResponse = await acquireAnthropicSlot()
  if (slotResponse) return slotResponse

  let raw: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: RED_FLAG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parsed.data.message }],
    })
    raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  } catch {
    return Response.json({ error: 'AI generation failed — please try again' }, { status: 500 })
  } finally {
    await releaseAnthropicSlot()
  }

  try {
    const analysis = extractJson(raw)
    return Response.json({ analysis })
  } catch {
    return Response.json({ error: 'Unexpected response format — please try again' }, { status: 500 })
  }
}
