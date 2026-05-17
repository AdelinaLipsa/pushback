export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return '—'
  return `${currency} ${amount.toLocaleString('en-US')}`
}
