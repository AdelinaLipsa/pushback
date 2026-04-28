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

// Pages that require a session — redirect to /login if absent
const PROTECTED_PAGES = [
  '/dashboard',
  '/arsenal',
  '/contracts',
  '/projects',
  '/settings',
  '/feedback',
  '/analytics',
  '/admin',
  '/checkout',
]

// Auth pages — redirect to /dashboard if already signed in
const AUTH_PAGES = ['/login', '/signup']

// API prefixes excluded from auth enforcement (self-secured via other means)
const PUBLIC_API_PREFIXES = [
  '/api/webhooks/',   // Stripe — signature-verified
  '/api/check-email', // Used during signup before account exists
]

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isProtectedApi(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  return !PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Maintenance mode — bypass for /maintenance, /admin, /auth, /login
  // Login must be reachable so the admin can sign in and toggle maintenance off
  const bypassMaintenance =
    pathname === '/maintenance' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname === '/login'

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

  // Supabase session refresh — required for SSR auth. Must use mutable response reference.
  // Never replace getUser() with getSession() — getSession() trusts the cookie without verification.
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

  // Block unauthenticated API calls before they reach route handlers
  if (isProtectedApi(pathname) && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Redirect unauthenticated users from protected pages to login
  if (isProtectedPage(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login/signup
  if (isAuthPage(pathname) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
