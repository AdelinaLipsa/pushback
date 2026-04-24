export async function startCheckout(setLoading: (v: boolean) => void): Promise<void> {
  setLoading(true)
  const res = await fetch('/api/checkout', { method: 'POST' })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    setLoading(false)
  }
}
