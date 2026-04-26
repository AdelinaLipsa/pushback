import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

const MAINTENANCE_KEY = 'pb:maintenance'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Maintenance mode — bypass for /maintenance and /admin (admin stays accessible to turn it off)
  const bypassMaintenance =
    pathname === '/maintenance' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth')

  if (!bypassMaintenance && redis) {
    try {
      const isOn = await Promise.race([
        redis.get(MAINTENANCE_KEY),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ])
      if (isOn === '1') {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    } catch {
      // fail open — Redis unavailable, let the request through
    }
  }

  // Rate-limit auth callbacks — max 10 per IP per hour to prevent account flooding
  if (pathname === '/auth/callback' && request.nextUrl.searchParams.has('code') && redis) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (ip !== 'unknown') {
      try {
        const key = `pb:signup:${ip}`
        const count = await redis.incr(key)
        if (count === 1) await redis.expire(key, 3600)
        if (count > 10) {
          return new NextResponse('Too many authentication attempts. Please try again later.', {
            status: 429,
            headers: { 'Retry-After': '3600' },
          })
        }
      } catch {
        // fail open
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  const isDashboardRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/contracts') ||
    pathname.startsWith('/settings')

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
