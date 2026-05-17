'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Button from '@/components/shared/Button'
import { Download, X } from 'lucide-react'
import { inputStyle, labelStyle, dialogContentStyle } from '@/lib/ui'
import { generateDisputePack } from '@/lib/api'
import type { Project } from '@/types'

interface DisputePackModalProps {
  project: Project
  onClose: () => void
}

type DisputeType = 'not_as_described' | 'not_received' | 'cancelled' | 'unauthorized'

const DISPUTE_OPTIONS: { value: DisputeType; label: string; description: string }[] = [
  {
    value: 'not_as_described',
    label: 'Not as described',
    description: 'Client claims the work did not match the agreed scope or deliverables.',
  },
  {
    value: 'not_received',
    label: 'Not received',
    description: 'Client claims they never received the deliverables paid for.',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Client claims the engagement was cancelled before payment was due.',
  },
  {
    value: 'unauthorized',
    label: 'Unauthorized',
    description: 'Client claims they did not authorize the charge.',
  },
]

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function DisputePackModal({ project, onClose }: DisputePackModalProps) {
  const [disputeType, setDisputeType] = useState<DisputeType>('not_as_described')
  const [caseReference, setCaseReference] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    const result = await generateDisputePack(project.id, {
      dispute_type: disputeType,
      case_reference: caseReference.trim() || undefined,
    })
    setGenerating(false)
    if (!result) {
      setError('Pack generation failed — please try again.')
      return
    }
    if ('upgradeRequired' in result && result.upgradeRequired) {
      setError('Pro account required.')
      return
    }
    if ('quotaExceeded' in result && result.quotaExceeded) {
      setError(
        "You've used this month's response budget. It resets at the start of your next billing period.",
      )
      return
    }
    if ('blob' in result) {
      triggerBlobDownload(result.blob, result.filename)
      toast.success('Dispute pack downloaded')
      onClose()
    }
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(o) => {
        if (!o && !generating) onClose()
      }}
    >
      <DialogContent showCloseButton={false} style={{ ...dialogContentStyle, maxWidth: '34rem' }}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Compile dispute pack
          </DialogTitle>
        </DialogHeader>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.25rem',
          }}
        >
          We will assemble a PDF from this project&apos;s contract, timeline, and communication log. Uses 1 of your monthly responses.
        </p>
        <fieldset style={{ border: 0, padding: 0, margin: '1.25rem 0 0.5rem 0' }}>
          <legend style={{ ...labelStyle, marginBottom: '0.5rem' }}>Dispute type</legend>
          {DISPUTE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
                padding: '0.5rem 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="dispute_type"
                value={opt.value}
                checked={disputeType === opt.value}
                onChange={() => setDisputeType(opt.value)}
                style={{ marginTop: '0.25rem' }}
              />
              <span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {opt.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="case_reference" style={labelStyle}>Case reference (optional)</label>
          <input
            id="case_reference"
            type="text"
            maxLength={80}
            value={caseReference}
            onChange={(e) => setCaseReference(e.target.value)}
            placeholder="e.g. STRIPE-DSP-2026-04-001"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand-lime)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--bg-border)'
            }}
          />
        </div>
        {error ? (
          <p
            role="alert"
            style={{
              marginTop: '0.75rem',
              color: 'var(--urgency-high)',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </p>
        ) : null}
        <div className="flex gap-2 justify-end" style={{ marginTop: '1.5rem' }}>
          <Button
            variant="ghost"
            icon={<X size={13} />}
            onClick={onClose}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Download size={14} />}
            loading={generating}
            onClick={handleGenerate}
          >
            {generating ? 'Generating…' : 'Generate pack'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
