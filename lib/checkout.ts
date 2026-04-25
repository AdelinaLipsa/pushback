export async function startCheckout(setLoading: (v: boolean) => void): Promise<void> {
  setLoading(true)
  window.location.href = '/checkout'
}
