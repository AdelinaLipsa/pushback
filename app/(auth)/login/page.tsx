'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.includes('://') ? rawNext : '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(next)
      router.refresh()
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-[0.15rem] no-underline">
            <span className="font-extrabold text-2xl text-text-primary">Pushback</span>
            <span className="font-extrabold text-2xl text-brand-lime">.</span>
          </Link>
          <p className="text-text-muted mt-1.5 text-sm">Welcome back.</p>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-2xl p-7">

          {authError === 'auth_failed' && (
            <div className="bg-urgency-high-dim border border-urgency-high rounded-lg px-3.5 py-2.5 text-urgency-high text-sm mb-4 leading-snug">
              Sign-in link expired — please try again.
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-bg-elevated border border-bg-border text-text-primary py-3 px-4 rounded-lg font-medium text-sm cursor-pointer transition-colors hover:border-white/20 disabled:opacity-70 disabled:cursor-not-allowed mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-bg-border" />
            <span className="text-text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-bg-border" />
          </div>

          {error && (
            <div className="bg-urgency-high-dim border border-urgency-high rounded-lg px-3.5 py-2.5 text-urgency-high text-sm mb-4 leading-snug">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full box-border bg-bg-base border border-bg-border rounded-lg px-4 py-3 text-text-primary text-sm outline-none transition-colors duration-150 focus:border-brand-lime font-[inherit]"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full box-border bg-bg-base border border-bg-border rounded-lg px-4 py-3 text-text-primary text-sm outline-none transition-colors duration-150 focus:border-brand-lime font-[inherit]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-lime text-bg-base font-bold py-3 rounded-lg border-0 cursor-pointer text-sm transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-text-muted text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-lime font-medium no-underline">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
