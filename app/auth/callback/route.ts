import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.includes('://') ? rawNext : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // New-signup detection: email_confirmed_at is set to "now" at the moment this
  // callback fires for both flows — email/password (confirmation link click) and
  // Google OAuth (first sign-in). Returning users have an old email_confirmed_at
  // and are correctly excluded. created_at is NOT used because email/password users
  // always take longer than 60s to open their inbox and click the confirmation link.
  const confirmedAt = data.user.email_confirmed_at
  const isNewUser =
    !!confirmedAt && Date.now() - new Date(confirmedAt).getTime() < 60_000
  if (isNewUser && data.user.email) {
    // Fire-and-forget: never awaited, never blocks the redirect below.
    // sendWelcomeEmail throws on Resend error — .catch() absorbs it.
    sendWelcomeEmail(data.user.email).catch((err) => {
      console.error('Welcome email failed:', err)
    })
  }

  const destination = isNewUser ? '/dashboard?welcome=1' : next
  return NextResponse.redirect(`${origin}${destination}`)
}
