'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { btnStyles, inputStyle, labelStyle, dialogContentStyle } from '@/lib/ui'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF']
const STATUS_OPTIONS = ['active', 'completed', 'paused']

interface ProjectHeaderProps {
  project: {
    id: string
    title: string
    client_name: string
    client_email: string | null
    project_value: number | null
    currency: string | null
    status: string | null
    notes: string | null
    payment_due_date?: string | null
    payment_amount?: string | number | null
    payment_received_at?: string | null
  }
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState({
    title: project.title,
    client_name: project.client_name,
    client_email: project.client_email ?? '',
    project_value: project.project_value ? String(project.project_value) : '',
    currency: project.currency ?? 'EUR',
    status: project.status ?? 'active',
    notes: project.notes ?? '',
  })

  const isOverdue =
    (project.payment_due_date ?? null) !== null &&
    (project.payment_received_at ?? null) === null &&
    new Date(project.payment_due_date!) < new Date()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        project_value: form.project_value ? Number(form.project_value) : null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setErrorMessage(data.error ?? 'Could not save changes. Please try again.')
      setErrorDialogOpen(true)
      return
    }
    setEditing(false)
    router.refresh()
    toast('Project updated')
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) {
      setErrorMessage(data.error ?? 'Could not delete project. Please try again.')
      setDeleteDialogOpen(false)
      setErrorDialogOpen(true)
      return
    }
    router.push('/projects')
  }

  return (
    <>
      {/* Read view */}
      {!editing && (
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/projects"
            style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}
            className="hover:text-white transition-colors"
          >
            ← Projects
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                {project.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {project.client_name}
                {project.client_email && <span> · {project.client_email}</span>}
                {project.project_value && (
                  <span> · {project.currency} {Number(project.project_value).toLocaleString()}</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--brand-green)',
                fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.75rem',
                borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {project.status}
              </span>
              {isOverdue && (
                <span style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--urgency-high)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}>
                  OVERDUE
                </span>
              )}
              <button onClick={() => setEditing(true)} style={btnStyles.outline}>
                Edit project
              </button>
              <button onClick={() => setDeleteDialogOpen(true)} style={btnStyles.outline}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/projects"
            style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}
            className="hover:text-white transition-colors"
          >
            ← Projects
          </Link>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Project name *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            {/* Client name */}
            <div>
              <label style={labelStyle}>Client name *</label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            {/* Client email */}
            <div>
              <label style={labelStyle}>Client email</label>
              <input
                type="email"
                value={form.client_email}
                onChange={e => set('client_email', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            {/* Project value + currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Project value</label>
                <input
                  type="number"
                  value={form.project_value}
                  onChange={e => set('project_value', e.target.value)}
                  min="0"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select
                  value={form.currency}
                  onChange={e => set('currency', e.target.value)}
                  style={{ ...inputStyle, width: 'auto', minWidth: '80px' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
              />
            </div>
            {/* Button row */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...btnStyles.primary, padding: '0.75rem', fontSize: '1rem', ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={btnStyles.ghost}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} style={dialogContentStyle}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Are you sure?
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            This will permanently delete the project and all its messages. There&apos;s no undo.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...btnStyles.destructive, ...(deleting ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
            >
              {deleting ? 'Deleting…' : 'Delete project'}
            </button>
            <button onClick={() => setDeleteDialogOpen(false)} style={btnStyles.ghost}>
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent showCloseButton={false} style={dialogContentStyle}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Something went wrong
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {errorMessage}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setErrorDialogOpen(false)} style={btnStyles.ghost}>
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
