export const CREEM_API_URL = 'https://api.creem.io/v1'

export async function createCheckoutSession(userId: string, userEmail: string) {
  const res = await fetch(`${CREEM_API_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CREEM_API_KEY!,
    },
    body: JSON.stringify({
      product_id: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID,
      customer_email: userEmail,
      metadata: { user_id: userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    }),
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  return res.json()
}
