'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { inputStyle, labelStyle } from '@/lib/ui'
import { createProject } from '@/lib/api'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ color: 'var(--urgency-high)', fontSize: '0.75rem', marginTop: '0.35rem' }}>{msg}</p>
}

function fieldStyle(hasError: boolean): React.CSSProperties {
  return { ...inputStyle, ...(hasError && { border: '1px solid var(--urgency-high)' }) }
}

export default function NewProjectForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    title: '',
    client_name: '',
    client_email: '',
    project_value: '',
    currency: 'EUR',
    notes: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Project name is required'
    if (!form.client_name.trim()) errs.client_name = 'Client name is required'
    if (form.client_email && !EMAIL_RE.test(form.client_email)) errs.client_email = 'Enter a valid email address'
    if (form.project_value && Number(form.project_value) < 0) errs.project_value = 'Must be a positive number'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setLoading(true)
    const result = await createProject({
      ...form,
      project_value: form.project_value ? Number(form.project_value) : null,
    })
    setLoading(false)
    if (!result) { toast.error('Failed to create project'); return }
    toast.success('Project created')
    router.push(`/projects/${result.project.id}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={labelStyle}>Project name *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Acme Corp Website Redesign"
          style={fieldStyle(!!fieldErrors.title)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.title ? 'var(--urgency-high)' : 'var(--bg-border)' }}
        />
        <FieldError msg={fieldErrors.title} />
      </div>

      <div>
        <label style={labelStyle}>Client name *</label>
        <input
          type="text"
          value={form.client_name}
          onChange={e => set('client_name', e.target.value)}
          placeholder="e.g. Sarah Johnson"
          style={fieldStyle(!!fieldErrors.client_name)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.client_name ? 'var(--urgency-high)' : 'var(--bg-border)' }}
        />
        <FieldError msg={fieldErrors.client_name} />
      </div>

      <div>
        <label style={labelStyle}>Client email</label>
        <input
          type="text"
          value={form.client_email}
          onChange={e => set('client_email', e.target.value)}
          placeholder="sarah@acme.com"
          style={fieldStyle(!!fieldErrors.client_email)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.client_email ? 'var(--urgency-high)' : 'var(--bg-border)' }}
        />
        <FieldError msg={fieldErrors.client_email} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Project value</label>
          <input
            type="number"
            value={form.project_value}
            onChange={e => set('project_value', e.target.value)}
            placeholder="3200"
            min="0"
            style={fieldStyle(!!fieldErrors.project_value)}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.project_value ? 'var(--urgency-high)' : 'var(--bg-border)' }}
          />
          <FieldError msg={fieldErrors.project_value} />
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

      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Client quirks, red flags, context you'll want when things go sideways."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 700,
          padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
          opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
        }}
      >
        {loading ? 'Creating…' : 'Create project →'}
      </button>
    </form>
  )
}
