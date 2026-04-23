'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  responsesUsed: number
}

export default function UpgradePrompt({ responsesUsed }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
      borderRadius: '0.875rem', padding: '1.5rem',
    }}>
      <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
        You&apos;ve used your {responsesUsed} free messages.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '480px' }}>
        Pro tip: most freelancers use Pushback at least twice a week.
        At €12/month, that&apos;s €1.50 per handled situation.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            backgroundColor: 'var(--brand-amber)', color: '#0a0a0a', fontWeight: 700,
            padding: '0.7rem 1.5rem', borderRadius: '0.5rem', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Upgrade to Pro — €12/month'}
        </button>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
