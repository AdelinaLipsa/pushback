'use client'

import { useState } from 'react'
import { markResponseCopied } from '@/lib/api'

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

    if (responseId) markResponseCopied(responseId)

    setTimeout(() => setFlashing(false), 1500)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={[
        'inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-bold cursor-pointer border-0 transition-all duration-150',
        flashing
          ? 'copy-flash'
          : 'bg-brand-amber text-bg-base hover:opacity-85 active:opacity-75',
      ].join(' ')}
      style={flashing ? { color: 'var(--brand-green)' } : undefined}
    >
      {copied ? <><span>✓</span> Copied</> : 'Copy Message'}
    </button>
  )
}
