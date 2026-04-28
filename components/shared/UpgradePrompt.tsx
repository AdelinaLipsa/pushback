'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { startCheckout } from '@/lib/checkout'
import Button from '@/components/shared/Button'

interface UpgradePromptProps {
  responsesUsed: number
}

export default function UpgradePrompt({ responsesUsed }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() { await startCheckout(setLoading) }

  return (
    <div className="bg-bg-surface border border-bg-border rounded-2xl p-6">
      <p className="font-semibold text-base mb-2">
        You&apos;ve used all {responsesUsed} free {responsesUsed === 1 ? 'message' : 'messages'}.
      </p>
      <p className="text-zinc-400 text-sm leading-relaxed mb-5 max-w-md">
        Most freelancers deal with at least two client problems a week. At €12/month, that&apos;s €1.50 per situation handled — versus hours of stress and lost money.
      </p>
      <div className="flex items-center gap-4">
        <Button variant="primary" size="lg" icon={<Zap size={14} />} loading={loading} onClick={handleUpgrade}>
          Get Pro — €12/month
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Not now
        </Button>
      </div>
    </div>
  )
}
