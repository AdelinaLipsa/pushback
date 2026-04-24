'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DefenseTool, DefenseToolMeta, DefenseResponse } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { btnStyles, inputStyle } from '@/lib/ui'
import { startCheckout } from '@/lib/checkout'
import { PLANS } from '@/lib/plans'
import DefenseToolCard from './DefenseToolCard'
import SituationPanel from './SituationPanel'
import ResponseOutput from './ResponseOutput'
import UpgradePrompt from '@/components/shared/UpgradePrompt'

interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
  initialPaymentPrefill?: { tool: DefenseTool; contextFields: Record<string, string> }
}

export default function DefenseDashboard({ projectId, plan, responsesUsed, initialPaymentPrefill }: DefenseDashboardProps) {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<DefenseToolMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{ text: string; id: string } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    tool_type: DefenseTool
    explanation: string
    situation_context: string
  } | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const FREE_LIMIT = PLANS.free.defense_responses
  const isAtLimit = plan === 'free' && responsesUsed >= FREE_LIMIT

  useEffect(() => {
    if (initialPaymentPrefill) {
      const matchedTool = DEFENSE_TOOLS.find(t => t.type === initialPaymentPrefill.tool)
      if (matchedTool) {
        setSelectedTool(matchedTool)
        setResponse(null)
      }
    }
  }, [initialPaymentPrefill])

  async function handleUpgrade() { await startCheckout(setUpgradeLoading) }

  function selectTool(tool: DefenseToolMeta) {
    if (isAtLimit) {
      setShowUpgrade(true)
      return
    }
    if (selectedTool?.type === tool.type) {
      setSelectedTool(null)
      setResponse(null)
    } else {
      setSelectedTool(tool)
      setResponse(null)
    }
  }

  async function handleGenerate(situation: string, extraContext: Record<string, string | number>) {
    if (!selectedTool) return
    setLoading(true)
    setResponse(null)

    const res = await fetch(`/api/projects/${projectId}/defend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_type: selectedTool.type, situation, extra_context: extraContext }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.status === 403 && data.error === 'UPGRADE_REQUIRED') {
      setShowUpgrade(true)
      return
    }

    if (!res.ok) {
      setGenerateError(data?.error ?? 'Something went wrong. Please try again.')
      return
    }

    setGenerateError(null)
    setResponse({ text: data.response, id: data.id })
    router.refresh()
  }

  function handleRegenerate() {
    setResponse(null)
  }

  async function handleAnalyze() {
    if (!messageInput.trim()) return
    if (isAtLimit) { setShowUpgrade(true); return }
    setAnalyzeLoading(true)
    setAnalyzeError(null)
    setAnalysisResult(null)

    const res = await fetch(`/api/projects/${projectId}/analyze-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageInput }),
    })

    const data = await res.json()
    setAnalyzeLoading(false)

    if (res.status === 403 && data.error === 'UPGRADE_REQUIRED') {
      setShowUpgrade(true)
      return
    }

    if (!res.ok) {
      setAnalyzeError(data?.error ?? 'Something went wrong. Please try again.')
      return
    }

    setAnalysisResult(data)
    const matchedTool = DEFENSE_TOOLS.find(t => t.type === data.tool_type)
    if (matchedTool) {
      selectTool(matchedTool)
    }
  }

  if (showUpgrade) {
    return (
      <div style={{ maxWidth: '560px' }}>
        <UpgradePrompt responsesUsed={responsesUsed} />
        <button
          onClick={() => setShowUpgrade(false)}
          style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
        >
          ← Back to tools
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Analyze section card (D-01, D-11) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '0.875rem',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <label style={{
          display: 'block',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          marginBottom: '0.4rem',
        }}>
          Paste a client message
        </label>
        <textarea
          rows={4}
          maxLength={3000}
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Paste what your client said..."
          style={{ ...inputStyle, resize: 'vertical' as const }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
          {messageInput.length} / 3000
        </p>
        {analyzeError && (
          <p style={{ color: 'var(--urgency-high)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {analyzeError}
          </p>
        )}
        <button
          onClick={handleAnalyze}
          disabled={!messageInput.trim() || analyzeLoading}
          style={{
            ...btnStyles.primary,
            width: '100%',
            marginTop: '0.75rem',
            opacity: !messageInput.trim() || analyzeLoading ? 0.6 : 1,
            cursor: !messageInput.trim() || analyzeLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {analyzeLoading ? 'Analyzing...' : 'Analyze Message'}
        </button>
      </div>

      {/* Result banner — conditional on analysisResult */}
      {analysisResult && (
        <div
          className="response-enter"
          style={{
            borderLeft: '3px solid var(--brand-lime)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.875rem',
            padding: '1rem 1.25rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-lime)' }}>
            {DEFENSE_TOOLS.find(t => t.type === analysisResult.tool_type)?.label ?? analysisResult.tool_type}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            — {analysisResult.explanation}
          </span>
        </div>
      )}

      {/* Start over button — conditional on analysisResult */}
      {analysisResult && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            onClick={() => {
              setAnalysisResult(null)
              setMessageInput('')
              setSelectedTool(null)
              setResponse(null)
            }}
            style={btnStyles.ghost}
          >
            Start over
          </button>
        </div>
      )}

      {/* Divider + "Or pick manually:" label — always visible */}
      <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', marginBottom: '1rem' }} />
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Or pick manually:
      </p>

      {/* Instruction paragraph */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {selectedTool ? (
            <>
              <span style={{ color: 'var(--brand-lime)' }}>↑</span> Describe your situation below to generate a message
            </>
          ) : (
            'Pick a situation below. Get the exact message to send.'
          )}
        </p>
        {plan === 'free' && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            {FREE_LIMIT - responsesUsed} free message{FREE_LIMIT - responsesUsed !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Tool grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {DEFENSE_TOOLS.map(tool => (
          <DefenseToolCard
            key={tool.type}
            tool={tool}
            selected={selectedTool?.type === tool.type}
            loading={loading && selectedTool?.type === tool.type}
            onSelect={() => selectTool(tool)}
          />
        ))}
      </div>

      {generateError && (
        <p style={{ color: 'var(--urgency-high)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          {generateError}
        </p>
      )}

      {selectedTool && !response && (
        <SituationPanel
          tool={selectedTool}
          onGenerate={handleGenerate}
          onClose={() => { setSelectedTool(null); setResponse(null) }}
          loading={loading}
          initialSituation={analysisResult?.situation_context}
          initialContextFields={initialPaymentPrefill?.contextFields}
        />
      )}

      {response && (
        <ResponseOutput
          response={response.text}
          responseId={response.id}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  )
}
