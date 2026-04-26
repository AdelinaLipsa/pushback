'use client'

import CopyButton from '@/components/shared/CopyButton'
import { btnCls } from '@/lib/ui'
import type { DocumentType } from '@/types'

interface DocumentOutputProps {
  document: string
  documentType: DocumentType
  onBack: () => void
}

const DOCUMENT_HEADER_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'SOW Amendment',
  kill_fee_invoice: 'Kill Fee Invoice',
  dispute_package: 'Dispute Package',
}

export default function DocumentOutput({ document, documentType, onBack }: DocumentOutputProps) {
  return (
    <div className="response-enter bg-bg-surface border border-bg-border rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm">{DOCUMENT_HEADER_LABELS[documentType]}</span>
        <button
          onClick={onBack}
          aria-label="Back to generated message"
          className={btnCls.ghost}
        >
          ← Back to message
        </button>
      </div>

      <div role="region" aria-label="Generated document" className="bg-bg-base border border-bg-border rounded-lg p-4 mb-4">
        <pre className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0">
          {document}
        </pre>
      </div>

      <p className="text-text-secondary text-xs leading-relaxed mb-4">
        Edit before sending — replace [YOUR NAME], [YOUR PAYMENT DETAILS], and any bracketed placeholders with your specifics before you hit send.
      </p>

      <div className="flex items-center gap-2 mt-4">
        <CopyButton text={document} label="Copy Document" />
      </div>
    </div>
  )
}
