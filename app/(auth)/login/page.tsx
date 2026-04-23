'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
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
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
            <span style={{ color: 'var(--brand-amber)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
          {authError === 'auth_failed' && (
            <div style={{
              backgroundColor: 'var(--urgency-high-dim)',
              border: '1px solid var(--urgency-high)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: 'var(--urgency-high)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}>
              Sign-in link expired — please try again.
            </div>
          )}
          <button
            onClick={handleGoogle}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)', padding: '0.75rem', borderRadius: '0.5rem',
              fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1.5rem',
            }}
            className="hover:border-white/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ backgroundColor: 'var(--urgency-high-dim)', border: '1px solid var(--urgency-high)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--urgency-high)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
                  borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
                  borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--brand-amber)', color: '#0a0a0a', fontWeight: 700,
                padding: '0.8rem', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--brand-amber)', fontWeight: 500, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
