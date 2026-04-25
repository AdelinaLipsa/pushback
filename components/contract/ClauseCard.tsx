'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown } from 'lucide-react'
import { FlaggedClause } from '@/types'
import { RISK_COLORS_RICH } from '@/lib/ui'

interface ClauseCardProps {
  clause: FlaggedClause
  delay?: number
}

export default function ClauseCard({ clause, delay = 0 }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const colors = RISK_COLORS_RICH[clause.risk_level] ?? RISK_COLORS_RICH.medium

  async function handleCopyPushback() {
    try {
      await navigator.clipboard.writeText(clause.pushback_language)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  return (
    <div
      className="fade-up bg-bg-surface border border-bg-border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30"
      style={{ borderLeft: `4px solid ${colors.border}`, animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-text-primary text-left gap-4 hover:bg-white/[0.02] transition-colors duration-150"
      >
        <div className="flex items-center gap-3 flex-1">
          <span
            className="text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-[0.06em] shrink-0"
            style={{ backgroundColor: colors.badge, color: colors.badgeText }}
          >
            {clause.risk_level}
          </span>
          <span className="font-semibold text-[0.9rem] text-zinc-100">{clause.title}</span>
        </div>
        <ChevronDown
          size={15}
          className={`shrink-0 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="response-enter px-5 pb-5 flex flex-col gap-4">
          {clause.quote && (
            <blockquote
              className="pl-3.5 m-0 text-zinc-300 text-[0.8rem] italic leading-relaxed"
              style={{ borderLeft: `3px solid ${colors.border}` }}
            >
              &ldquo;{clause.quote}&rdquo;
            </blockquote>
          )}

          <div>
            <p className="text-zinc-200 font-bold text-[0.65rem] uppercase tracking-[0.07em] mb-1">What this means</p>
            <p className="text-zinc-300 text-[0.875rem] leading-relaxed m-0">{clause.plain_english}</p>
          </div>

          <div>
            <p className="text-zinc-200 font-bold text-[0.65rem] uppercase tracking-[0.07em] mb-1">Why it matters</p>
            <p className="text-zinc-300 text-[0.875rem] leading-relaxed m-0">{clause.why_it_matters}</p>
          </div>

          <div className="bg-bg-elevated rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-200 font-bold text-[0.65rem] uppercase tracking-[0.07em] m-0">What to say back</p>
              <button
                onClick={handleCopyPushback}
                aria-label="Copy to clipboard"
                className={`flex items-center justify-center w-11 h-11 rounded-lg bg-transparent border-none cursor-pointer transition-all duration-150 hover:bg-white/5 hover:scale-110 active:scale-95 ${copied ? 'text-brand-lime' : 'text-zinc-500'}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-zinc-100 text-[0.875rem] leading-relaxed m-0">{clause.pushback_language}</p>
          </div>
        </div>
      )}
    </div>
  )
}
