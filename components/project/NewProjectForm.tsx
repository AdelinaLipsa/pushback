'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF']

export default function NewProjectForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        project_value: form.project_value ? Number(form.project_value) : null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      router.push(`/projects/${data.project.id}`)
    }
  }

  const inputStyle = {
    width: '100%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
    borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none',
  }

  const labelStyle = {
    display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{ backgroundColor: 'var(--urgency-high-dim)', border: '1px solid var(--urgency-high)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--urgency-high)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Project name *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Acme Corp Website Redesign"
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Client name *</label>
        <input
          type="text"
          required
          value={form.client_name}
          onChange={e => set('client_name', e.target.value)}
          placeholder="e.g. Sarah Johnson"
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Client email</label>
        <input
          type="email"
          value={form.client_email}
          onChange={e => set('client_email', e.target.value)}
          placeholder="sarah@acme.com"
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
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
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Currency</label>
          <select
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '80px' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
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
          placeholder="Any context about this project, client quirks, etc."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-amber)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: 'var(--brand-amber)', color: '#0a0a0a', fontWeight: 700,
          padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
          opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
        }}
      >
        {loading ? 'Creating…' : 'Create Project →'}
      </button>
    </form>
  )
}
