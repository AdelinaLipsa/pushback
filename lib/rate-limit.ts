import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// 20 AI responses per minute per user — abuse prevention for the defend route
export const defendRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'pb:defend' })
  : null

// 5 contract analyses per minute per user — uploads are heavier weight
export const contractRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'pb:contract' })
  : null

export async function checkRateLimit(
  limiter: Ratelimit | null,
  userId: string,
): Promise<Response | null> {
  if (!limiter) return null
  const { success, limit, reset, remaining } = await limiter.limit(userId)
  if (success) return null
  return Response.json(
    { error: 'Too many requests — please wait a moment before trying again.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    },
  )
}
