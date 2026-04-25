'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { inputStyle } from '@/lib/ui'
import { analyzeContract } from '@/lib/api'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MIN_PASTE_CHARS = 100

interface ContractUploaderProps {
  projectId?: string
}

export default function ContractUploader({ projectId }: ContractUploaderProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'upload') {
      if (!file) { toast.error('Please select a PDF file.'); return }
      if (file.size > MAX_FILE_BYTES) { toast.error('File too large — maximum size is 10 MB.'); return }
    } else {
      if (text.trim().length < MIN_PASTE_CHARS) {
        toast.error(`Paste at least ${MIN_PASTE_CHARS} characters of contract text.`)
        return
      }
    }

    const formData = new FormData()
    formData.append('title', title || (file?.name ?? 'Untitled contract'))
    if (projectId) formData.append('project_id', projectId)
    if (mode === 'upload' && file) formData.append('file', file)
    else formData.append('text', text.trim())

    setLoading(true)
    const result = await analyzeContract(formData)
    setLoading(false)
    if (!result) return
    router.push(`/contracts/${result.contract.id}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          Contract name
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Acme Corp Service Agreement"
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['upload', 'paste'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--bg-border)',
              backgroundColor: mode === m ? 'var(--bg-elevated)' : 'transparent',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: mode === m ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            {m === 'upload' ? 'Upload PDF' : 'Paste text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', border: `2px dashed ${file ? 'var(--brand-lime)' : 'var(--bg-border)'}`,
              borderRadius: '0.75rem', padding: '2rem', backgroundColor: 'var(--bg-base)',
              cursor: 'pointer', color: file ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.9rem', transition: 'border-color 150ms ease',
            }}
            className="hover:border-white/30"
          >
            {file ? (
              <div>
                <div style={{ color: 'var(--brand-lime)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {file.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0 }}>
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </div>
                Click to upload a PDF
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Max 10 MB</div>
              </div>
            )}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Paste contract text
            </label>
            <span style={{ fontSize: '0.75rem', color: text.trim().length < MIN_PASTE_CHARS ? 'var(--text-muted)' : 'var(--brand-lime)' }}>
              {text.trim().length} / {MIN_PASTE_CHARS} min
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your contract text here. The more complete, the better the analysis."
            rows={10}
            style={{ ...inputStyle, resize: 'vertical' as const }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 700,
          padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Analyzing contract…' : 'Analyze Contract →'}
      </button>

      <p className="text-text-muted text-[0.75rem] text-center leading-relaxed">
        Your contract is never stored after analysis. We read it, flag the risks, delete it.
      </p>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          Takes about 15–30 seconds. Reading every clause so you don&apos;t have to.
        </p>
      )}
    </form>
  )
}
