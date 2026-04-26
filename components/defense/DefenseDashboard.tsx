'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt,
  type LucideIcon,
} from 'lucide-react'
import { DefenseTool, DefenseToolMeta, DocumentType, RiskLevel } from '@/types'
import { DEFENSE_TOOLS, URGENCY_COLORS } from '@/lib/defenseTools'
import { btnStyles, inputStyle } from '@/lib/ui'
import { startCheckout } from '@/lib/checkout'
import { generateDefense, generateDocument, analyzeMessage } from '@/lib/api'
import { PLANS } from '@/lib/plans'
import SituationPanel from './SituationPanel'
import ResponseOutput from './ResponseOutput'
import DocumentOutput from './DocumentOutput'
import UpgradePrompt from '@/components/shared/UpgradePrompt'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers, Clock, AlertTriangle, Ban, RefreshCw, XCircle, CheckCircle2, ShieldAlert,
  EyeOff, Hourglass, Shuffle, TrendingDown, TrendingUp, Zap, Copyright, CreditCard,
  Eye, PackageOpen, Star, Receipt,
}

const TOOL_MAP = Object.fromEntries(DEFENSE_TOOLS.map(t => [t.type, t])) as Record<DefenseTool, DefenseToolMeta>

const CATEGORIES: { label: string; types: DefenseTool[] }[] = [
  {
    label: 'Payment',
    types: ['payment_first', 'payment_second', 'payment_final', 'kill_fee', 'retroactive_discount', 'rush_fee_demand'],
  },
  {
    label: 'Scope & Revisions',
    types: ['scope_change', 'revision_limit', 'feedback_stall', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    label: 'Disputes',
    types: ['dispute_response', 'chargeback_threat', 'review_threat', 'ip_dispute'],
  },
  {
    label: 'Client Behaviour',
    types: ['ghost_client', 'discount_pressure', 'rate_increase_pushback', 'spec_work_pressure'],
  },
]

interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
  initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }
  hasContract?: boolean
  contractRiskLevel?: RiskLevel
  autoSelectTool?: DefenseTool
}

function ToolSidebar({
  selectedType,
  loadingType,
  onSelect,
  plan,
  responsesUsed,
}: {
  selectedType: DefenseTool | null
  loadingType: DefenseTool | null
  onSelect: (tool: DefenseToolMeta) => void
  plan: 'free' | 'pro'
  responsesUsed: number
}) {
  const FREE_LIMIT = PLANS.free.defense_responses

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '0.875rem',
      padding: '0.75rem',
      position: 'sticky',
      top: '1.5rem',
      maxHeight: 'calc(100vh - 3rem)',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '0.25rem 0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Situation
        </span>
        {plan === 'free' && (
          <span style={{ fontSize: '0.65rem', color: FREE_LIMIT - responsesUsed <= 0 ? 'var(--urgency-high)' : 'var(--text-muted)' }}>
            {FREE_LIMIT - responsesUsed} left
          </span>
        )}
      </div>

      {CATEGORIES.map((cat, ci) => (
        <div key={cat.label} style={{ marginBottom: ci < CATEGORIES.length - 1 ? '0.75rem' : 0 }}>
          <div style={{
            padding: '0.2rem 0.5rem',
            marginBottom: '0.125rem',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {cat.label}
          </div>
          {cat.types.map(type => {
            const tool = TOOL_MAP[type]
            const Icon = ICON_MAP[tool.icon]
            const colors = URGENCY_COLORS[tool.urgency]
            const isSelected = selectedType === type
            const isLoading = loadingType === type

            return (
              <button
                key={type}
                onClick={() => onSelect(tool)}
                title={tool.description}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  backgroundColor: isSelected ? 'rgba(132,204,22,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 120ms ease',
                  animation: isLoading ? 'limepulse 1.5s ease-in-out infinite' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)'
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                {Icon && (
                  <Icon
                    size={13}
                    strokeWidth={isSelected ? 2 : 1.75}
                    style={{ color: isSelected ? 'var(--brand-lime)' : colors.border, flexShrink: 0 }}
                  />
                )}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--brand-lime)' : 'var(--text-secondary)',
                  lineHeight: 1.3,
                }}>
                  {tool.label}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function DefenseDashboard({
  projectId, plan, responsesUsed, initialPaymentPrefill,
  hasContract, contractRiskLevel, autoSelectTool,
}: DefenseDashboardProps) {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<DefenseToolMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{ text: string; id: string; contractClausesUsed?: string[] } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    tool_type: DefenseTool
    explanation: string
    situation_context: string
  } | null>(null)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentOutput, setDocumentOutput] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [localResponsesUsed, setLocalResponsesUsed] = useState(responsesUsed)

  const FREE_LIMIT = PLANS.free.defense_responses
  const isAtLimit = plan === 'free' && localResponsesUsed >= FREE_LIMIT

  useEffect(() => {
    if (initialPaymentPrefill) {
      const t = DEFENSE_TOOLS.find(t => t.type === initialPaymentPrefill.tool)
      if (t) { setSelectedTool(t); setResponse(null) }
    }
  }, [initialPaymentPrefill])

  useEffect(() => {
    if (autoSelectTool) {
      const t = DEFENSE_TOOLS.find(t => t.type === autoSelectTool)
      if (t) { setSelectedTool(t); setResponse(null) }
    }
  }, [autoSelectTool])

  function selectTool(tool: DefenseToolMeta) {
    if (isAtLimit) { setShowUpgrade(true); return }
    if (selectedTool?.type === tool.type) {
      setSelectedTool(null); setResponse(null); setDocumentOutput(null); setDocumentType(null)
    } else {
      setSelectedTool(tool); setResponse(null); setDocumentOutput(null); setDocumentType(null)
    }
  }

  async function handleGenerate(situation: string, extraContext: Record<string, string | number>) {
    if (!selectedTool) return
    setLoading(true); setResponse(null)
    const result = await generateDefense(projectId, { tool_type: selectedTool.type, situation, extra_context: extraContext })
    setLoading(false)
    if (!result) return
    if (result.upgradeRequired) { setShowUpgrade(true); return }
    setResponse({ text: result.response, id: result.id, contractClausesUsed: result.contract_clauses_used ?? [] })
    setLocalResponsesUsed(prev => prev + 1)
    router.refresh()
  }

  async function handleGenerateDocument(type: DocumentType) {
    setDocumentLoading(true)
    setDocumentError(null)
    setDocumentType(type)
    const result = await generateDocument(projectId, { document_type: type })
    setDocumentLoading(false)
    if (!result) {
      setDocumentError('Document generation failed — please try again.')
      return
    }
    if (result.upgradeRequired) { setShowUpgrade(true); return }
    setDocumentOutput(result.document)
  }

  async function handleAnalyze() {
    if (!messageInput.trim()) return
    if (isAtLimit) { setShowUpgrade(true); return }
    setAnalyzeLoading(true); setAnalysisResult(null); setSelectedTool(null); setResponse(null)
    const result = await analyzeMessage(projectId, messageInput)
    setAnalyzeLoading(false)
    if (!result) return
    if (result.upgradeRequired) { setShowUpgrade(true); return }
    setAnalysisResult(result)
    const matched = DEFENSE_TOOLS.find(t => t.type === result.tool_type)
    if (matched) selectTool(matched)
  }

  if (showUpgrade) {
    return (
      <div style={{ maxWidth: '560px' }}>
        <UpgradePrompt responsesUsed={responsesUsed} />
        <button
          onClick={() => setShowUpgrade(false)}
          style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
        >
          ← Back
        </button>
      </div>
    )
  }

  const showAnalyzePanel = !selectedTool && !response
  const showSituation = !!selectedTool && !response
  const showResponse = !!selectedTool && !!response

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      {/* Left: tool list */}
      <ToolSidebar
        selectedType={selectedTool?.type ?? null}
        loadingType={loading ? (selectedTool?.type ?? null) : null}
        onSelect={selectTool}
        plan={plan}
        responsesUsed={responsesUsed}
      />

      {/* Right: work panel */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Analyze panel — shown when no tool selected */}
        {showAnalyzePanel && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.875rem',
            padding: '1.25rem',
          }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Paste a client message — we'll identify the situation
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Paste what they sent. Pushback figures out what you're dealing with."
              style={{ ...inputStyle, resize: 'vertical' as const }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{messageInput.length} / 3000</span>
              <button
                onClick={handleAnalyze}
                disabled={!messageInput.trim() || analyzeLoading}
                style={{
                  ...btnStyles.primary,
                  opacity: !messageInput.trim() || analyzeLoading ? 0.6 : 1,
                  cursor: !messageInput.trim() || analyzeLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {analyzeLoading ? 'Analyzing…' : 'Analyze →'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-border)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>or pick from the left</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-border)' }} />
            </div>
          </div>
        )}

        {/* Analysis result banner */}
        {analysisResult && selectedTool && (
          <div
            className="response-enter"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(132,204,22,0.25)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--brand-lime)' }}>
                {DEFENSE_TOOLS.find(t => t.type === analysisResult.tool_type)?.label}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                — {analysisResult.explanation}
              </span>
            </div>
            <button
              onClick={() => { setAnalysisResult(null); setMessageInput(''); setSelectedTool(null); setResponse(null) }}
              style={{ ...btnStyles.ghost, fontSize: '0.78rem', padding: '0.3rem 0.6rem', flexShrink: 0 }}
            >
              Start over
            </button>
          </div>
        )}

        {/* Situation panel */}
        {showSituation && (
          <SituationPanel
            tool={selectedTool}
            onGenerate={handleGenerate}
            onClose={() => { setSelectedTool(null); setResponse(null) }}
            loading={loading}
            initialSituation={analysisResult?.situation_context}
            initialContextFields={initialPaymentPrefill?.contextFields}
            hasContract={hasContract}
            contractRiskLevel={contractRiskLevel}
          />
        )}

        {/* Response or Document */}
        {showResponse && !documentOutput && (
          <ResponseOutput
            response={response!.text}
            responseId={response!.id}
            onRegenerate={() => setResponse(null)}
            contractClausesUsed={response!.contractClausesUsed}
            toolType={selectedTool.type}
            onGenerateDocument={handleGenerateDocument}
            documentGenerating={documentLoading}
            documentError={documentError}
          />
        )}
        {showResponse && documentOutput && documentType && (
          <DocumentOutput
            document={documentOutput}
            documentType={documentType}
            onBack={() => { setDocumentOutput(null); setDocumentType(null) }}
          />
        )}
      </div>
    </div>
  )
}
