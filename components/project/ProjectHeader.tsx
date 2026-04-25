'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { inputStyle, labelStyle, dialogContentStyle } from '@/lib/ui'
import { updateProject, deleteProject } from '@/lib/api'
import Button from '@/components/shared/Button'

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
    const result = await updateProject(project.id, {
      ...form,
      project_value: form.project_value ? Number(form.project_value) : null,
    })
    setLoading(false)
    if (!result) return
    setEditing(false)
    router.refresh()
    toast('Project updated')
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteProject(project.id)
    setDeleting(false)
    if (!result) return
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
            <div className="flex items-center gap-2">
              <span style={{
                backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--brand-green)',
                fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.75rem',
                borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {project.status}
              </span>
              {isOverdue && (
                <span style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--urgency-high)',
                  fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                  borderRadius: '9999px', letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                }}>
                  OVERDUE
                </span>
              )}
              <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
                Edit project
              </Button>
              <Button variant="outline" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
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
            <div>
              <label style={labelStyle}>Project name *</label>
              <input type="text" required value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }} />
            </div>
            <div>
              <label style={labelStyle}>Client name *</label>
              <input type="text" required value={form.client_name} onChange={e => set('client_name', e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }} />
            </div>
            <div>
              <label style={labelStyle}>Client email</label>
              <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Project value</label>
                <input type="number" value={form.project_value} onChange={e => set('project_value', e.target.value)} min="0" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }} />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '80px' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }} />
            </div>
            <div className="flex gap-3 items-center mt-2">
              <Button type="submit" variant="primary" icon={<Check size={14} />} loading={loading}>
                {loading ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="ghost" icon={<X size={13} />} onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
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
          <div className="flex gap-2">
            <Button variant="destructive" icon={<Trash2 size={13} />} loading={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete project'}
            </Button>
            <Button variant="ghost" icon={<X size={13} />} onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
