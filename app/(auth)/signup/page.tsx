'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type EmailStatus = 'idle' | 'checking' | 'taken' | 'clear'

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

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const len = password.length
  const strength = len >= 12 ? 3 : len >= 8 ? 2 : 1
  const segmentColor = ['bg-urgency-high', 'bg-urgency-medium', 'bg-brand-lime'][strength - 1]
  const label = ['Too short', 'Good', 'Strong'][strength - 1]
  const labelColor = ['text-urgency-high', 'text-urgency-medium', 'text-brand-lime'][strength - 1]
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${i <= strength ? segmentColor : 'bg-bg-border'}`}
          />
        ))}
      </div>
      <span className={`text-[0.72rem] font-medium min-w-[4rem] text-right ${labelColor}`}>{label}</span>
    </div>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkEmail = useCallback(async (value: string) => {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    })
    const data = await res.json().catch(() => ({ exists: false }))
    setEmailStatus(data.exists ? 'taken' : 'clear')
  }, [])

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setEmail(value)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.includes('@') && value.split('@')[1]?.length > 0) {
      setEmailStatus('checking')
      debounceRef.current = setTimeout(() => checkEmail(value), 400)
    } else {
      setEmailStatus('idle')
    }
  }

  function emailInputClass() {
    const base = 'w-full box-border bg-bg-base border rounded-lg px-4 py-3 text-text-primary text-sm outline-none transition-colors duration-150 font-[inherit]'
    if (emailStatus === 'taken') return `${base} border-urgency-high`
    if (emailStatus === 'clear') return `${base} border-brand-lime`
    return `${base} border-bg-border focus:border-brand-lime`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (emailStatus === 'taken') return
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <div className="text-center max-w-[400px]">
          <div className="mb-6 text-brand-lime flex justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <h1 className="font-bold text-2xl mb-3">Check your email</h1>
          <p className="text-text-secondary leading-relaxed">
            We sent a confirmation link to <strong className="text-text-primary">{email}</strong>. Click it to activate your account and start using Pushback.
          </p>
        </div>
      </div>
    )
  }

  const submitDisabled = loading || emailStatus === 'taken' || emailStatus === 'checking'

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-[0.15rem] no-underline">
            <span className="font-extrabold text-2xl text-text-primary">Pushback</span>
            <span className="font-extrabold text-2xl text-brand-lime">.</span>
          </Link>
          <p className="text-text-muted mt-1.5 text-sm">Your first response is free — no card needed.</p>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-2xl p-7">

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
                onChange={handleEmailChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={emailInputClass()}
              />
              {emailStatus === 'taken' && (
                <p className="mt-1.5 text-xs text-urgency-high leading-snug">
                  Email already registered.{' '}
                  <Link href="/login" className="underline font-medium text-urgency-high">Sign in instead →</Link>
                </p>
              )}
              {emailStatus === 'checking' && (
                <p className="mt-1.5 text-xs text-text-muted">Checking…</p>
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full box-border bg-bg-base border border-bg-border rounded-lg px-4 py-3 text-text-primary text-sm outline-none transition-colors duration-150 focus:border-brand-lime font-[inherit]"
              />
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full bg-brand-lime text-bg-base font-bold py-3 rounded-lg border-0 cursor-pointer text-sm transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Creating account…' : 'Create my account'}
            </button>
          </form>

          <p className="text-text-muted text-[0.73rem] text-center mt-4 leading-relaxed">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-brand-lime font-medium no-underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-brand-lime font-medium no-underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center mt-5 text-text-muted text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-lime font-medium no-underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
