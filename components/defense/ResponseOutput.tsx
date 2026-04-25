'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import CopyButton from '@/components/shared/CopyButton'
import NextStepCard from '@/components/defense/NextStepCard'
import { DefenseTool } from '@/types'
import type { DocumentType } from '@/types'
import { markResponseSent } from '@/lib/api'
import { btnCls } from '@/lib/ui'

const DOCUMENT_TYPE_FOR: Partial<Record<DefenseTool, DocumentType>> = {
  scope_change: 'sow_amendment',
  moving_goalposts: 'sow_amendment',
  kill_fee: 'kill_fee_invoice',
  dispute_response: 'dispute_package',
  chargeback_threat: 'dispute_package',
  review_threat: 'dispute_package',
}

const DOCUMENT_BUTTON_LABELS: Record<DocumentType, string> = {
  sow_amendment: 'Generate SOW Amendment',
  kill_fee_invoice: 'Generate Kill Fee Invoice',
  dispute_package: 'Generate Dispute Package',
}

interface ResponseOutputProps {
  response: string
  responseId: string
  onRegenerate: () => void
  contractClausesUsed?: string[]
  toolType: DefenseTool
  onGenerateDocument?: (type: DocumentType) => void
  documentGenerating?: boolean
  documentError?: string | null
}

export default function ResponseOutput({ response, responseId, onRegenerate, contractClausesUsed, toolType, onGenerateDocument, documentGenerating, documentError }: ResponseOutputProps) {
  const [sent, setSent] = useState(false)

  function handleMarkSent() {
    setSent(true)
    markResponseSent(responseId)
  }

  return (
    <div
      className="response-enter bg-bg-surface border border-bg-border rounded-2xl p-6 mt-4"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-amber shrink-0" />
          <span className="font-semibold text-sm">Ready to send</span>
        </div>
        <button
          onClick={onRegenerate}
          className="px-3 py-1.5 text-xs text-text-secondary border border-bg-border rounded-md bg-transparent cursor-pointer transition-all duration-150 hover:border-white/20 hover:text-text-primary"
        >
          Regenerate
        </button>
      </div>

      <div className="bg-bg-base border border-bg-border rounded-lg p-5 mb-5">
        <pre className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words m-0">
          {response}
        </pre>
      </div>

      {contractClausesUsed && contractClausesUsed.length > 0 && (
        <div className="mt-3">
          <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
            Based on your contract:
          </p>
          <p className="text-text-muted text-sm leading-relaxed">
            {contractClausesUsed.join(', ')}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-5">
        <CopyButton text={response} responseId={responseId} />
        <button
          onClick={handleMarkSent}
          disabled={sent}
          className={[
            'px-5 py-3 rounded-lg text-sm font-medium border transition-all duration-150',
            sent
              ? 'border-brand-green text-brand-green cursor-default bg-transparent'
              : 'border-bg-border text-text-secondary bg-transparent cursor-pointer hover:border-white/20 hover:text-text-primary',
          ].join(' ')}
        >
          {sent ? 'Marked as sent' : 'Mark as sent'}
        </button>
      </div>

      {(() => {
        const docType = DOCUMENT_TYPE_FOR[toolType]
        if (!onGenerateDocument || !docType) return null
        return (
          <div className="mt-4 pt-4 border-t border-bg-border">
            {documentError && (
              <span role="alert" className="text-xs text-urgency-high block mb-2">{documentError}</span>
            )}
            <button
              onClick={() => onGenerateDocument(docType)}
              disabled={documentGenerating}
              aria-busy={documentGenerating}
              className={[btnCls.outline, documentGenerating ? 'lime-pulse-border' : ''].filter(Boolean).join(' ')}
            >
              {documentGenerating ? 'Generating document…' : DOCUMENT_BUTTON_LABELS[docType]}
            </button>
          </div>
        )
      })()}

      <NextStepCard toolType={toolType} />
    </div>
  )
}
