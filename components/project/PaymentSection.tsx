'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { btnStyles, inputStyle, labelStyle } from '@/lib/ui'
import { Project, DefenseTool } from '@/types'

interface PaymentSectionProps {
  project: Project
  onHandleLatePayment: (prefill: { tool: DefenseTool; contextFields: Record<string, string> }) => void
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount: number | null, currency: string) {
  return amount !== null ? `${currency} ${Number(amount).toLocaleString()}` : ''
}

function buildPaymentPrefill(paymentDueDate: string, paymentAmount: number | null) {
  const daysOverdue = Math.floor((Date.now() - new Date(paymentDueDate).getTime()) / 86400000)
  const tool: DefenseTool =
    daysOverdue <= 7 ? 'payment_first' :
    daysOverdue <= 14 ? 'payment_second' :
    'payment_final'
  const invoiceAmount = String(paymentAmount ?? '')
  const contextFields: Record<string, string> =
    tool === 'payment_first'
      ? { invoice_amount: invoiceAmount, due_date: new Date(paymentDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }
      : { invoice_amount: invoiceAmount, days_overdue: String(daysOverdue) }
  return { tool, contextFields }
}

export default function PaymentSection({ project, onHandleLatePayment }: PaymentSectionProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [markingReceived, setMarkingReceived] = useState(false)
  const [dueDate, setDueDate] = useState(project.payment_due_date ?? '')
  const [amount, setAmount] = useState(project.payment_amount !== null ? String(project.payment_amount) : '')
  const [error, setError] = useState<string | null>(null)

  const isOverdue =
    project.payment_due_date !== null &&
    project.payment_received_at === null &&
    new Date(project.payment_due_date) < new Date()

  const isReceived = project.payment_received_at !== null

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_due_date: dueDate || null,
        payment_amount: amount ? Number(amount) : null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to save payment details. Please try again.')
      return
    }
    setEditing(false)
    router.refresh()
    toast('Payment details saved')
  }

  async function handleMarkReceived() {
    setMarkingReceived(true)
    setError(null)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_received_at: new Date().toISOString() }),
    })
    const data = await res.json()
    setMarkingReceived(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to mark as received. Please try again.')
      return
    }
    router.refresh()
    toast('Payment marked as received')
  }

  function handleLatePayment() {
    if (!project.payment_due_date) return
    const prefill = buildPaymentPrefill(project.payment_due_date, project.payment_amount)
    onHandleLatePayment(prefill)
    document.getElementById('defense-dashboard')?.scrollIntoView({ behavior: 'smooth' })
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--bg-border)',
    borderRadius: '0.875rem',
    padding: '1.5rem',
    marginBottom: '2rem',
  }

  // Shared inline form — used for both empty state (no due date) and edit mode
  function renderForm(isEditMode: boolean) {
    return (
      <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <div>
          <label style={labelStyle}>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Amount ({project.currency})</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 1500"
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ ...btnStyles.primary, ...(saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
          >
            {saving ? 'Saving…' : isEditMode ? 'Update payment details' : 'Save payment details'}
          </button>
          {isEditMode && (
            <button
              type="button"
              style={btnStyles.ghost}
              onClick={() => {
                setEditing(false)
                setDueDate(project.payment_due_date ?? '')
                setAmount(project.payment_amount !== null ? String(project.payment_amount) : '')
                setError(null)
              }}
            >
              Discard changes
            </button>
          )}
        </div>
        {error && (
          <p style={{ color: 'var(--urgency-high)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {error}
          </p>
        )}
      </form>
    )
  }

  // CASE 1: No payment_due_date set (empty state)
  if (!project.payment_due_date) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Payment</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
          No payment due date set. Add one so Pushback can flag late payments.
        </p>
        {renderForm(false)}
      </div>
    )
  }

  // CASE 3: payment_received_at non-null (received)
  if (isReceived) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '1rem' }}>Payment</h2>
        {!editing ? (
          <>
            <p style={{ color: 'var(--brand-green)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Received {formatDate(project.payment_received_at!)}
              {project.payment_amount !== null && ` · ${formatAmount(project.payment_amount, project.currency)}`}
            </p>
            <button style={btnStyles.ghost} onClick={() => setEditing(true)}>
              Edit payment
            </button>
            {error && (
              <p style={{ color: 'var(--urgency-high)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
          </>
        ) : (
          renderForm(true)
        )}
      </div>
    )
  }

  // CASE 2: payment_due_date set, payment_received_at null (populated, not received)
  const daysOverdueCount = isOverdue
    ? Math.floor((Date.now() - new Date(project.payment_due_date!).getTime()) / 86400000)
    : 0

  return (
    <div style={cardStyle}>
      <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '1rem' }}>Payment</h2>
      {!editing ? (
        <>
          {isOverdue ? (
            <p style={{ color: 'var(--urgency-high)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              OVERDUE · {daysOverdueCount} {daysOverdueCount === 1 ? 'day' : 'days'}
              {project.payment_amount !== null && ` · ${formatAmount(project.payment_amount, project.currency)}`}
            </p>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Due {formatDate(project.payment_due_date!)}
              {project.payment_amount !== null && ` · ${formatAmount(project.payment_amount, project.currency)}`}
            </p>
          )}
          {isOverdue && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <button style={btnStyles.primary} onClick={handleLatePayment}>
                Get a late payment message
              </button>
              <button
                style={{ ...btnStyles.outline, ...(markingReceived ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                onClick={handleMarkReceived}
                disabled={markingReceived}
              >
                {markingReceived ? 'Marking…' : 'Mark as received'}
              </button>
            </div>
          )}
          <button style={btnStyles.ghost} onClick={() => setEditing(true)}>
            Edit payment
          </button>
          {error && (
            <p style={{ color: 'var(--urgency-high)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {error}
            </p>
          )}
        </>
      ) : (
        renderForm(true)
      )}
    </div>
  )
}
