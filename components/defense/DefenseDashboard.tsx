'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DefenseTool, DefenseToolMeta, DefenseResponse } from '@/types'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import { btnStyles, inputStyle } from '@/lib/ui'
import DefenseToolCard from './DefenseToolCard'
import SituationPanel from './SituationPanel'
import ResponseOutput from './ResponseOutput'
import UpgradePrompt from '@/components/shared/UpgradePrompt'

interface DefenseDashboardProps {
  projectId: string
  plan: 'free' | 'pro'
  responsesUsed: number
}

export default function DefenseDashboard({ projectId, plan, responsesUsed }: DefenseDashboardProps) {
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

  const FREE_LIMIT = 1
  const isAtLimit = plan === 'free' && responsesUsed >= FREE_LIMIT

  async function handleUpgrade() {
    setUpgradeLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setUpgradeLoading(false)
    }
  }

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
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {selectedTool ? (
            <>
              <span style={{ color: 'var(--brand-amber)' }}>↑</span> Describe your situation below to generate a message
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
