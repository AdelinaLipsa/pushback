'use client'

import { useState } from 'react'
import { Mail, Copy, Check, Loader2, Lock } from 'lucide-react'
import { generateCounterOffer } from '@/lib/api'
import { btnCls } from '@/lib/ui'
import { startCheckout } from '@/lib/checkout'

interface CounterOfferSectionProps {
  contractId: string
  isPro: boolean
}

export default function CounterOfferSection({ contractId, isPro }: CounterOfferSectionProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await generateCounterOffer(contractId)
    setLoading(false)
    if (result) setEmail(result.email)
  }

  async function handleCopy() {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  if (!isPro) {
    return (
      <div className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-200 m-0 mb-1">Counter-offer email</h3>
            <p className="text-zinc-400 text-[0.825rem] m-0">Draft a professional negotiation email based on the flagged clauses above.</p>
          </div>
          <button
            onClick={() => startCheckout(setUpgradeLoading)}
            disabled={upgradeLoading}
            className={btnCls.primary + ' shrink-0'}
          >
            {upgradeLoading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : <><Lock size={14} /> Upgrade to Pro</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-bg-border flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-200 m-0 mb-1">Counter-offer email</h3>
          <p className="text-zinc-400 text-[0.825rem] m-0">Draft a professional email requesting the changes above — ready to copy and send.</p>
        </div>
        {!email && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={btnCls.outline + ' shrink-0'}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Drafting…</>
            ) : (
              <><Mail size={14} /> Draft email</>
            )}
          </button>
        )}
        {email && (
          <button onClick={handleCopy} className={btnCls.outline + ' shrink-0'}>
            {copied ? <><Check size={14} className="text-brand-lime" /> Copied</> : <><Copy size={14} /> Copy email</>}
          </button>
        )}
      </div>

      {email && (
        <div className="px-6 py-5">
          <pre className="text-zinc-300 text-[0.875rem] leading-[1.75] whitespace-pre-wrap font-sans m-0">{email}</pre>
          <p className="text-zinc-500 text-[0.75rem] mt-4 m-0">Review and personalize before sending — replace [Client Name] and [Your name] with the actual values.</p>
        </div>
      )}
    </div>
  )
}
