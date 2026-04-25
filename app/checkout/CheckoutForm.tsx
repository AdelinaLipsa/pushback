'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check } from 'lucide-react'
import { PLANS } from '@/lib/plans'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const appearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#84cc16',
    colorBackground: '#111111',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorDanger: '#ef4444',
    borderRadius: '8px',
    fontSizeBase: '14px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ffffff' },
    '.Input:focus': { border: '1px solid rgba(132,204,22,0.6)', boxShadow: '0 0 0 3px rgba(132,204,22,0.1)', outline: 'none' },
    '.Label': { color: '#a1a1aa', fontWeight: '500' },
    '.Tab': { backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a1a1aa' },
    '.Tab--selected': { backgroundColor: '#1a1a1a', border: '1px solid rgba(132,204,22,0.5)', color: '#ffffff' },
    '.Tab:hover': { color: '#ffffff' },
  },
}

function PayForm() {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard?upgraded=true` },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setLoading(false)
    } else {
      router.push('/dashboard?upgraded=true')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="mt-3 text-sm text-urgency-high">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-6 w-full bg-brand-lime text-[#0a0a0a] font-bold py-3 px-6 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing…' : `Pay €${PLANS.pro.price}/month`}
      </button>
      <p className="mt-3 text-center text-xs text-text-muted">
        Cancel any time · excl. VAT · secured by Stripe
      </p>
    </form>
  )
}

export default function CheckoutForm() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/create-subscription', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setError(data.error ?? 'Failed to initialise checkout')
      })
      .catch(() => setError('Network error — please try again'))
  }, [])

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-urgency-high mb-4">{error}</p>
        <a href="/dashboard" className="text-sm text-brand-lime hover:opacity-80 transition-opacity">← Back to dashboard</a>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-brand-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <PayForm />
    </Elements>
  )
}

export function PlanSummary() {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-400">Pushback Pro</span>
        <span className="bg-brand-lime/15 text-brand-lime text-[0.6rem] font-bold px-2 py-0.5 rounded tracking-[0.08em]">RECOMMENDED</span>
      </div>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-black tracking-tight">€{PLANS.pro.price}</span>
        <span className="text-text-secondary text-sm">/month</span>
      </div>
      <ul className="space-y-2">
        {PLANS.pro.features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
            <Check size={13} className="text-brand-lime shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
