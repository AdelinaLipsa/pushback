'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { generateIntake } from '@/lib/api'
import { IntakeQuestionnaire, IntakeQuestion } from '@/types'
import { inputStyle, btnCls } from '@/lib/ui'
import UpgradePrompt from '@/components/shared/UpgradePrompt'
import { PLANS } from '@/lib/plans'

const CATEGORY_CONFIG: Record<IntakeQuestion['category'], { label: string; color: string; bg: string }> = {
  scope: { label: 'Scope', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  payment: { label: 'Payment', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  rights: { label: 'Rights', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  timeline: { label: 'Timeline', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  client: { label: 'Client', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
}

function QuestionCard({ q, index }: { q: IntakeQuestion; index: number }) {
  const [copied, setCopied] = useState(false)
  const cfg = CATEGORY_CONFIG[q.category]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(q.question)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }

  return (
    <div
      className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <span
              className="text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-[0.06em] shrink-0"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-zinc-100 text-[0.9rem] font-medium leading-snug">{q.question}</span>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded text-zinc-500 hover:text-zinc-200 bg-transparent border-0 cursor-pointer transition-colors"
          >
            {copied ? <Check size={13} className="text-brand-lime" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      <div className="px-5 py-3 bg-bg-elevated border-t border-bg-border">
        <p className="text-zinc-400 text-[0.825rem] leading-relaxed m-0">{q.why}</p>
      </div>
    </div>
  )
}

export default function IntakePage() {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IntakeQuestionnaire | null>(null)
  const [allCopied, setAllCopied] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 20) return
    setLoading(true)
    setResult(null)
    const data = await generateIntake(description.trim())
    setLoading(false)
    if (!data) return
    if ('upgradeRequired' in data) { setShowUpgrade(true); return }
    setResult(data.questionnaire)
  }

  async function handleCopyAll() {
    if (!result) return
    const text = result.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setAllCopied(true)
      setTimeout(() => setAllCopied(false), 2000)
    } catch { /* silent */ }
  }

  const grouped = result
    ? (Object.keys(CATEGORY_CONFIG) as IntakeQuestion['category'][]).reduce((acc, cat) => {
        const qs = result.questions.filter(q => q.category === cat)
        if (qs.length) acc[cat] = qs
        return acc
      }, {} as Partial<Record<IntakeQuestion['category'], IntakeQuestion[]>>)
    : null

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Project Intake Questionnaire</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Describe the project you just landed. We&apos;ll generate the questions to ask the client before you start — to prevent scope disputes, payment problems, and misaligned expectations.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div>
          <div className="flex justify-between mb-1.5">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Project description</label>
            <span style={{ fontSize: '0.75rem', color: description.trim().length < 20 ? 'var(--text-muted)' : 'var(--brand-lime)' }}>
              {description.trim().length} chars
            </span>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 'Redesigning a SaaS dashboard for a fintech startup — 5 screens, mobile and desktop. Client is the marketing director, but their CTO also has opinions. $8k fixed price, 6-week timeline. They mentioned wanting to launch before a conference.'"
            rows={6}
            style={{ ...inputStyle, resize: 'vertical' as const }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-lime)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-border)' }}
          />
        </div>
        <button type="submit" disabled={loading || description.trim().length < 20} className={btnCls.primary}>
          {loading ? 'Generating…' : 'Generate questions →'}
        </button>
      </form>

      {showUpgrade && <UpgradePrompt responsesUsed={PLANS.free.defense_responses} />}

      {result && (
        <div className="flex flex-col gap-6 fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-[0.825rem] m-0">{result.project_summary}</p>
            </div>
            <button onClick={handleCopyAll} className={btnCls.outline + ' shrink-0'}>
              {allCopied ? <><Check size={13} className="text-brand-lime" /> Copied</> : <><Copy size={13} /> Copy all</>}
            </button>
          </div>

          {grouped && (Object.entries(grouped) as [IntakeQuestion['category'], IntakeQuestion[]][]).map(([cat, questions]) => {
            const cfg = CATEGORY_CONFIG[cat]
            const allQsFlat = result.questions
            return (
              <section key={cat}>
                <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: cfg.color }}>
                  {cfg.label}
                </h3>
                <div className="flex flex-col gap-2">
                  {questions.map((q) => (
                    <QuestionCard key={q.question} q={q} index={allQsFlat.indexOf(q)} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
