import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pages that require a logged-in session — redirect to /login if absent
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

// API prefixes that must have a session — 401 JSON if absent
const PUBLIC_API_PREFIXES = [
  '/api/webhooks/',  // Stripe — signature-verified, no session needed
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase SSR requires a mutable response reference so refreshed session
  // cookies can be written back. Do not simplify this pattern.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT against Supabase on every request.
  // Never replace with getSession() — it trusts the local cookie without server verification.
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

  // Redirect authenticated users away from login/signup to the dashboard
  if (isAuthPage(pathname) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
