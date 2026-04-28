'use client'

import { useState } from 'react'
import { DefenseResponse } from '@/types'
import type { ReplyThread } from '@/types'
import CopyButton from '@/components/shared/CopyButton'
import ReplyThreadCard from '@/components/defense/ReplyThreadCard'
import { MessageSquarePlus, Lock } from 'lucide-react'
import { inputStyle, btnStyles } from '@/lib/ui'
import { TOOL_LABELS } from '@/lib/defenseTools'
import { startCheckout } from '@/lib/checkout'

interface ResponseHistoryProps {
  responses: DefenseResponse[]
  lockedCount: number
  isPro: boolean
}

export default function ResponseHistory({ responses, lockedCount, isPro }: ResponseHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<Record<string, string>>({})
  const [localThreads, setLocalThreads] = useState<
    Record<string, Pick<ReplyThread, 'defense_response_id' | 'risk_signal' | 'signal_explanation' | 'follow_up'>>
  >({})

  async function handleUpgrade() { await startCheckout(setUpgradeLoading) }

  async function handleAnalyzeReply(responseId: string) {
    const text = (replyText[responseId] ?? '').trim()
    if (text.length < 10) {
      setReplyError((prev) => ({ ...prev, [responseId]: 'Reply must be at least 10 characters.' }))
      return
    }
    setReplyError((prev) => {
      const next = { ...prev }
      delete next[responseId]
      return next
    })
    setReplyLoading(responseId)
    try {
      const res = await fetch(`/api/responses/${responseId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_reply: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg =
          data?.error === 'UPGRADE_REQUIRED'
            ? 'UPGRADE_REQUIRED'
            : (data?.error as string) ?? 'Analysis failed — please try again.'
        setReplyError((prev) => ({ ...prev, [responseId]: errMsg }))
        return
      }
      setLocalThreads((prev) => ({
        ...prev,
        [responseId]: {
          defense_response_id: responseId,
          risk_signal: data.risk_signal,
          signal_explanation: data.signal_explanation,
          follow_up: data.follow_up,
        },
      }))
      setReplyOpen(null)
      setReplyText((prev) => {
        const next = { ...prev }
        delete next[responseId]
        return next
      })
    } catch {
      setReplyError((prev) => ({ ...prev, [responseId]: 'Analysis failed — please try again.' }))
    } finally {
      setReplyLoading(null)
    }
  }

  if (responses.length === 0 && lockedCount === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No messages yet. Go back to the project to generate your first one.</p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {responses.map((r) => (
        <div
          key={r.id}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                {TOOL_LABELS[r.tool_type] ?? r.tool_type}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {new Date(r.created_at).toLocaleDateString()} · {r.was_sent ? 'Sent' : r.was_copied ? 'Copied' : 'Not sent'}
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{expanded === r.id ? '▲' : '▼'}</span>
          </button>

          {expanded === r.id && (
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <pre style={{
                fontFamily: 'var(--font-mono), monospace', fontSize: '0.8rem', lineHeight: 1.7,
                color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)',
                borderRadius: '0.5rem', padding: '1rem', margin: '0 0 1rem',
              }}>
                {r.response}
              </pre>
              <CopyButton text={r.response} responseId={r.id} />

              {/* 999.1 reply threading — D-03/D-04/D-07/D-08 */}
              {(localThreads[r.id] ?? r.reply_threads?.[0]) ? (
                <ReplyThreadCard thread={(localThreads[r.id] ?? r.reply_threads![0])!} />
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  {!isPro ? (
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0',
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      }}
                    >
                      <Lock size={14} aria-hidden={true} />
                      {upgradeLoading ? 'Loading…' : 'Pro — analyze their reply'}
                    </button>
                  ) : (
                  <button
                    type="button"
                    onClick={() => setReplyOpen(replyOpen === r.id ? null : r.id)}
                    aria-expanded={replyOpen === r.id}
                    aria-controls={`reply-textarea-${r.id}`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--brand-lime)', fontSize: '0.9rem', padding: '0.5rem 0',
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    }}
                  >
                    <MessageSquarePlus size={16} aria-hidden={true} />
                    {replyOpen === r.id ? 'Cancel' : 'Paste their reply →'}
                  </button>
                  )}

                  {replyOpen === r.id && (
                    <div className="fadeUp" style={{ marginTop: '0.75rem' }}>
                      <textarea
                        id={`reply-textarea-${r.id}`}
                        placeholder="Paste what they replied..."
                        value={replyText[r.id] ?? ''}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        maxLength={5000}
                        style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                      />
                      {(replyText[r.id]?.length ?? 0) > 4500 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {replyText[r.id]?.length ?? 0}/5000
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyOpen(null)
                            setReplyError((prev) => { const n = { ...prev }; delete n[r.id]; return n })
                          }}
                          style={btnStyles.ghost}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnalyzeReply(r.id)}
                          disabled={
                            replyLoading === r.id ||
                            ((replyText[r.id] ?? '').trim().length < 10)
                          }
                          style={{
                            ...btnStyles.primary,
                            opacity: replyLoading === r.id || ((replyText[r.id] ?? '').trim().length < 10) ? 0.7 : 1,
                            cursor: replyLoading === r.id || ((replyText[r.id] ?? '').trim().length < 10) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {replyLoading === r.id ? 'Analyzing…' : 'Analyze reply →'}
                        </button>
                      </div>

                      {replyError[r.id] === 'UPGRADE_REQUIRED' ? (
                        <div role="alert" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--urgency-high)', fontSize: '0.8rem' }}>
                            You&apos;ve used all your credits. Upgrade to Pro to continue.
                          </span>
                          <button
                            type="button"
                            onClick={handleUpgrade}
                            disabled={upgradeLoading}
                            style={{ ...btnStyles.primary, opacity: upgradeLoading ? 0.7 : 1 }}
                          >
                            {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
                          </button>
                        </div>
                      ) : replyError[r.id] ? (
                        <p role="alert" style={{ marginTop: '0.75rem', color: 'var(--urgency-high)', fontSize: '0.8rem' }}>
                          {replyError[r.id]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {lockedCount > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
            padding: '1.5rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {lockedCount} older message{lockedCount === 1 ? '' : 's'} locked — upgrade to see them all
          </span>
          <button
            onClick={handleUpgrade}
            disabled={upgradeLoading}
            style={{
              backgroundColor: 'var(--brand-lime)',
              color: '#0a0a0a',
              fontWeight: 700,
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: upgradeLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: upgradeLoading ? 0.7 : 1,
            }}
          >
            {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
          </button>
        </div>
      )}
    </div>
  )
}
