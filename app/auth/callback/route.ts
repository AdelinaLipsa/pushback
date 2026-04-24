import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // New-signup detection: created_at within the last 60 seconds covers both
  // Google OAuth first-sign-in and email/password confirmation callbacks.
  // Returning logins have an older created_at and skip the email.
  const isNewUser =
    Date.now() - new Date(data.user.created_at).getTime() < 60_000
  if (isNewUser && data.user.email) {
    // Fire-and-forget: never awaited, never blocks the redirect below.
    // sendWelcomeEmail throws on Resend error — .catch() absorbs it.
    sendWelcomeEmail(data.user.email).catch((err) => {
      console.error('Welcome email failed:', err)
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
