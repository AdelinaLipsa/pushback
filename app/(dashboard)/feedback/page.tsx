'use client'

import { useState } from 'react'

const CATEGORIES = [
  { value: 'bug', label: 'Bug report' },
  { value: 'feature', label: 'Feature request' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
] as const

type Category = typeof CATEGORIES[number]['value']

export default function FeedbackPage() {
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('loading')
    setErrorMsg('')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim(), category: category || undefined }),
    })
    if (res.ok) {
      setStatus('success')
      setMessage('')
      setCategory('')
    } else {
      const data = await res.json().catch(() => ({}))
      setErrorMsg(data.error ?? 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-[600px]">
      <h1 className="font-bold text-[1.4rem] tracking-tight mb-1.5">Share feedback</h1>
      <p className="text-text-secondary text-sm leading-relaxed mb-8">
        What&apos;s working, what&apos;s broken, what you need — all of it is useful.
      </p>

      {status === 'success' ? (
        <div className="bg-bg-surface border border-brand-lime rounded-xl p-6">
          <p className="font-semibold text-brand-lime mb-1">Got it — thank you.</p>
          <p className="text-text-secondary text-sm">Your feedback was submitted.</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 bg-transparent border border-bg-border rounded-lg px-3.5 py-1.5 text-text-secondary text-sm cursor-pointer hover:border-white/20 transition-colors"
          >
            Send more
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-2">
              Category <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(category === c.value ? '' : c.value)}
                  className={[
                    'px-3 py-1.5 rounded-full border text-xs transition-colors duration-150 cursor-pointer',
                    category === c.value
                      ? 'border-brand-lime bg-brand-lime/10 text-brand-lime font-semibold'
                      : 'border-bg-border bg-bg-surface text-text-secondary hover:border-white/20',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-text-secondary text-xs font-medium mb-2">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="What's on your mind?"
              required
              className="w-full box-border bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-text-primary text-sm leading-relaxed resize-y outline-none transition-colors duration-150 focus:border-brand-lime font-[inherit]"
            />
            <p className="text-right text-xs text-text-muted mt-1">{message.length}/2000</p>
          </div>

          {status === 'error' && (
            <p className="text-urgency-high text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !message.trim()}
            className="self-start bg-brand-lime text-bg-base font-semibold px-5 py-2.5 rounded-lg border-0 text-sm cursor-pointer transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  )
}
