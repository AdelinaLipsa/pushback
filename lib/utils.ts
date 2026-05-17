import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Derive the current app URL from the incoming request. Trusts the standard
// proxy headers Vercel and Next dev set. Falls back to NEXT_PUBLIC_APP_URL only
// when no request context is available (background jobs, emails). This is what
// makes Stripe + email links land on whichever host the user actually started
// the flow from, instead of a hardcoded env-var value.
export function appUrlFromRequest(request: Request): string {
  const headers = request.headers
  const forwardedHost = headers.get('x-forwarded-host')
  const host = forwardedHost ?? headers.get('host')
  if (host) {
    const proto = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://pushback.to'
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
