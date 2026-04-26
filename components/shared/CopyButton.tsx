'use client'

import { useState } from 'react'
import { markResponseCopied } from '@/lib/api'

interface CopyButtonProps {
  text: string
  responseId?: string
  label?: string
}

export default function CopyButton({ text, responseId, label = 'Copy Message' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [flashing, setFlashing] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      if (!ok) return
    }
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
      {copied ? <><span>✓</span> Copied</> : label}
    </button>
  )
}
