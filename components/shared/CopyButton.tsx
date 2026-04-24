'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  responseId?: string
}

export default function CopyButton({ text, responseId }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [flashing, setFlashing] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setFlashing(true)
    setCopied(true)

    if (responseId) {
      fetch(`/api/responses/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ was_copied: true }),
      }).catch(() => {})
    }

    setTimeout(() => setFlashing(false), 1500)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={flashing ? 'copy-flash' : ''}
      style={{
        backgroundColor: flashing ? undefined : 'var(--brand-lime)',
        color: flashing ? 'var(--brand-green)' : '#0a0a0a',
        fontWeight: 700, padding: '0.75rem 1.75rem',
        borderRadius: '0.5rem', border: flashing ? '1px solid var(--brand-green)' : 'none',
        cursor: 'pointer', fontSize: '0.95rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        transition: 'color 150ms ease',
      }}
    >
      {copied ? (
        <>
          <span style={{ transform: 'scale(1)', transition: 'transform 150ms ease', display: 'inline-block' }}>✓</span>
          Copied
        </>
      ) : (
        'Copy Message'
      )}
    </button>
  )
}
