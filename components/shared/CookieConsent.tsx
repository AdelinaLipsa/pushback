'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'pushback-consent'
const CHANGE_EVENT = 'pushback-consent-change'

export type ConsentValue = 'accepted' | 'rejected'

export function readConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'accepted' || v === 'rejected' ? v : null
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readConsent() === null)
  }, [])

  function decide(value: ConsentValue) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* storage may be blocked — fail open and keep banner state in memory only */
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        left: '1rem',
        right: '1rem',
        bottom: '1rem',
        zIndex: 200,
        maxWidth: '720px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-elevated, #1a1a1a)',
        border: '1px solid var(--bg-border, #2a2a2a)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        color: 'var(--text-primary, #fafafa)',
      }}
    >
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary, #a1a1aa)' }}>
        Pushback uses optional cookies for product analytics and error reporting so we can improve the tool.
        Nothing is loaded until you choose. See our{' '}
        <Link href="/privacy" style={{ color: 'var(--brand-lime, #84cc16)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          privacy policy
        </Link>
        .
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => decide('rejected')}
          style={{
            border: '1px solid var(--bg-border, #2a2a2a)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary, #fafafa)',
            padding: '0.55rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reject non-essential
        </button>
        <button
          type="button"
          onClick={() => decide('accepted')}
          style={{
            border: 'none',
            backgroundColor: 'var(--brand-lime, #84cc16)',
            color: '#0a0a0a',
            padding: '0.55rem 1.1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
