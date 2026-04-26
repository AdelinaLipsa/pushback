'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { btnStyles, inputStyle, labelStyle } from '@/lib/ui'
import { updateProject } from '@/lib/api'
import { Project, DefenseTool } from '@/types'

interface PaymentSectionProps {
  project: Project
  onHandleLatePayment: (prefill: { tool: DefenseTool; contextFields: Record<string, string> }) => void
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount: number | null, currency: string) {
  return amount !== null ? `${currency} ${Number(amount).toLocaleString()}` : null
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

const stripStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: '0.5rem',
  fontSize: '0.85rem',
}

export default function PaymentSection({ project, onHandleLatePayment }: PaymentSectionProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [markingReceived, setMarkingReceived] = useState(false)
  const [dueDate, setDueDate] = useState(project.payment_due_date ?? '')
  const [amount, setAmount] = useState(project.payment_amount !== null ? String(project.payment_amount) : '')

  const isOverdue =
    project.payment_due_date !== null &&
    project.payment_received_at === null &&
    new Date(project.payment_due_date) < new Date()

  const isReceived = project.payment_received_at !== null

  const daysOverdueCount = isOverdue
    ? Math.floor((Date.now() - new Date(project.payment_due_date!).getTime()) / 86400000)
    : 0

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await updateProject(project.id, {
      payment_due_date: dueDate || null,
      payment_amount: amount ? Number(amount) : null,
    })
    setSaving(false)
    if (!result) return
    setEditing(false)
    router.refresh()
    toast('Payment details saved')
  }

  async function handleMarkReceived() {
    setMarkingReceived(true)
    const result = await updateProject(project.id, { payment_received_at: new Date().toISOString() })
    setMarkingReceived(false)
    if (!result) return
    router.refresh()
    toast('Payment marked as received')
  }

  function handleLatePayment() {
    if (!project.payment_due_date) return
    onHandleLatePayment(buildPaymentPrefill(project.payment_due_date, project.payment_amount))
    document.getElementById('defense-dashboard')?.scrollIntoView({ behavior: 'smooth' })
  }

  function InlineForm() {
    return (
      <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Due date</label>
            <input
              type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Amount ({project.currency})</label>
            <input
              type="number" min="0" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="e.g. 1500"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <button type="submit" disabled={saving} style={{ ...btnStyles.primary, ...(saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button" style={btnStyles.ghost}
            onClick={() => {
              setEditing(false)
              setDueDate(project.payment_due_date ?? '')
              setAmount(project.payment_amount !== null ? String(project.payment_amount) : '')
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  // No due date set
  if (!project.payment_due_date) {
    return (
      <div style={stripStyle}>
        {!editing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>No payment due date set</span>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
              Add payment details
            </button>
          </div>
        ) : (
          <InlineForm />
        )}
      </div>
    )
  }

  // Payment received
  if (isReceived) {
    const amtStr = formatAmount(project.payment_amount, project.currency)
    return (
      <div style={stripStyle}>
        {!editing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--brand-green)' }}>
              Received {formatDate(project.payment_received_at!)}{amtStr && ` · ${amtStr}`}
            </span>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
              Edit
            </button>
          </div>
        ) : (
          <InlineForm />
        )}
      </div>
    )
  }

  // Due date set, not received
  const amtStr = formatAmount(project.payment_amount, project.currency)
  return (
    <div style={{ ...stripStyle, borderColor: isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--bg-border)' }}>
      {!editing ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: isOverdue ? 'var(--urgency-high)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
              {isOverdue
                ? `Overdue · ${daysOverdueCount} day${daysOverdueCount !== 1 ? 's' : ''}${amtStr ? ` · ${amtStr}` : ''}`
                : `Due ${formatDate(project.payment_due_date!)}${amtStr ? ` · ${amtStr}` : ''}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isOverdue && (
                <button onClick={handleLatePayment} style={{ ...btnStyles.primary, fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>
                  Get message
                </button>
              )}
              <button
                onClick={handleMarkReceived} disabled={markingReceived}
                style={{ background: 'none', border: 'none', cursor: markingReceived ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: markingReceived ? 0.6 : 1 }}
                className="hover:text-white transition-colors"
              >
                {markingReceived ? 'Marking…' : 'Mark received'}
              </button>
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
                Edit
              </button>
            </div>
          </div>
        </>
      ) : (
        <InlineForm />
      )}
    </div>
  )
}
