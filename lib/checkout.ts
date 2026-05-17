import { toast } from 'sonner'
import { checkout } from '@/lib/api'

// Routes every upgrade button straight to Stripe-hosted Checkout via
// /api/checkout (stripe.checkout.sessions.create). This bypasses the
// embedded /checkout page + Stripe Elements entirely, which means:
// - no Stripe.js loaded inside our origin (CSP surface stays tight)
// - no client-secret roundtrip
// - Stripe owns retry, 3DS, payment-method UX, email confirmations
// The /api/checkout endpoint hands back a checkout.stripe.com URL the
// browser navigates to; the user comes back to success_url on payment.
export async function startCheckout(setLoading: (v: boolean) => void): Promise<void> {
  setLoading(true)
  const url = await checkout()
  if (url) {
    window.location.href = url
  } else {
    setLoading(false)
    toast.error('Could not start checkout — please try again.')
  }
}
