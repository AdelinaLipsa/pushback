'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startCheckout } from '@/lib/checkout'

interface UpgradePromptProps {
  responsesUsed: number
}

export default function UpgradePrompt({ responsesUsed }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() { await startCheckout(setLoading) }

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
      borderRadius: '0.875rem', padding: '1.5rem',
    }}>
      <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
        You&apos;ve used all {responsesUsed} free messages.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '480px' }}>
        Most freelancers deal with at least two client problems a week. At €12/month, that&apos;s €1.50 per situation handled — versus hours of stress and lost money.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 700,
            padding: '0.7rem 1.5rem', borderRadius: '0.5rem', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Get Pro — €12/month'}
        </button>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
