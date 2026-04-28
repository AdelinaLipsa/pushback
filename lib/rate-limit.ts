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

// 5 feedback submissions per minute — each triggers an email notification
export const feedbackRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'pb:feedback' })
  : null

// 30 write operations per minute — project/contract create and delete
export const writesRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'pb:writes' })
  : null

// 10 email-check requests per minute per IP — prevents user enumeration
export const checkEmailRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'pb:check-email' })
  : null

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<Response | null> {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[rate-limit] Redis unavailable — rate limiting DISABLED for this request')
    }
    return null
  }
  const { success, limit, reset, remaining } = await limiter.limit(identifier)
  if (success) return null
  return Response.json(
    { error: 'Too many requests — please wait a moment before trying again.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    },
  )
}

// Global Anthropic concurrency semaphore — prevents thundering-herd 529s under load.
// Ceiling defaults to 50; override with ANTHROPIC_MAX_CONCURRENCY env var.
// Gracefully skips when Redis is unavailable (same pattern as rate limiter).
const MAX_CONCURRENCY = parseInt(process.env.ANTHROPIC_MAX_CONCURRENCY ?? '50', 10)
const CONCURRENCY_KEY = 'pb:anthropic:concurrent'
const SLOT_TTL_SECONDS = 30 // safety expiry — covers max expected request duration

export async function acquireAnthropicSlot(): Promise<Response | null> {
  if (!redis) return null
  // Pipeline sends INCR + EXPIRE as a single HTTP request — avoids a dangling
  // key with no TTL if the process crashes between the two commands.
  const [count] = await redis.pipeline().incr(CONCURRENCY_KEY).expire(CONCURRENCY_KEY, SLOT_TTL_SECONDS).exec() as [number, number]
  if (count > MAX_CONCURRENCY) {
    await redis.decr(CONCURRENCY_KEY)
    return Response.json(
      { error: 'Server is busy — please try again in a moment.' },
      { status: 503, headers: { 'Retry-After': '5' } },
    )
  }
  return null
}

export async function releaseAnthropicSlot(): Promise<void> {
  if (!redis) return
  await redis.decr(CONCURRENCY_KEY)
}
