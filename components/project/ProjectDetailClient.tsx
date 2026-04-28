'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DefenseTool, DefenseResponse, Project, RiskLevel, Plan } from '@/types'
import { RISK_COLORS, btnStyles } from '@/lib/ui'
import ProjectHeader from '@/components/project/ProjectHeader'
import PaymentSection from '@/components/project/PaymentSection'
import DefenseDashboard from '@/components/defense/DefenseDashboard'
import ClientBehaviorCard from '@/components/project/ClientBehaviorCard'
import ResponseHistory from '@/components/defense/ResponseHistory'
import { computeClientRisk } from '@/lib/clientRisk'

const RISK_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

interface PaymentPrefill {
  tool: DefenseTool
  contextFields: Record<string, string>
}

interface ProjectDetailClientProps {
  project: Project & {
    contracts?: { id: string; risk_score: number | null; risk_level: string | null; title: string | null } | null
    defense_responses?: Array<{ id: string; tool_type: DefenseTool; created_at: string; was_sent: boolean }> | null
  }
  plan: Plan
  responsesUsed: number
  autoSelectTool?: DefenseTool
  view: 'defend' | 'contract' | 'history'
  historyResponses: DefenseResponse[] | null
  lockedCount: number
}

function calendarDaysSince(dateStr: string): number {
  const from = new Date(dateStr)
  from.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

const TABS = [
  { key: 'defend', label: 'Defend' },
  { key: 'contract', label: 'Contract' },
  { key: 'history', label: 'History' },
] as const

export default function ProjectDetailClient({ project, plan, responsesUsed, autoSelectTool, view, historyResponses, lockedCount }: ProjectDetailClientProps) {
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)
  const [nudgeAutoSelect, setNudgeAutoSelect] = useState<DefenseTool | undefined>(autoSelectTool)

  const contractsRaw = project.contracts
  const contract = Array.isArray(contractsRaw) ? (contractsRaw as Array<typeof contractsRaw>)[0] ?? null : contractsRaw ?? null
  const riskLevel = contract?.risk_level
  const hasContract = contract !== null
  const contractRiskLevel = contract?.risk_level as RiskLevel | undefined

  const responses = project.defense_responses ?? []
  const sentPaymentResponses = responses
    .filter(r => (r.tool_type === 'payment_first' || r.tool_type === 'payment_second') && r.was_sent)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const stalledResponse = sentPaymentResponses.length > 0 && !project.payment_received_at
    ? sentPaymentResponses[0]
    : null
  const stalledDaysSince = stalledResponse ? calendarDaysSince(stalledResponse.created_at) : 0
  const showEscalationNudge = stalledResponse !== null && stalledDaysSince > 7
  const escalationNextTool: DefenseTool | null = showEscalationNudge && stalledResponse
    ? stalledResponse.tool_type === 'payment_first' ? 'payment_second' : 'payment_final'
    : null

  const clientRisk = computeClientRisk(project)

  return (
    <>
      <ProjectHeader project={project} />

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--bg-border)',
        marginBottom: '2rem',
        marginTop: '0.5rem',
      }}>
        {TABS.map(tab => (
          <Link
            key={tab.key}
            href={`/projects/${project.id}?view=${tab.key}`}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: view === tab.key ? 600 : 400,
              color: view === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: view === tab.key ? '2px solid var(--brand-lime)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'color 150ms ease, border-color 150ms ease',
              marginBottom: '-1px',
            }}
            className="hover:text-text-secondary"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Defend view */}
      {view === 'defend' && (
        <>
          {responses.length === 0 && (
            <p className="fade-up" style={{ animationDelay: '0.05s', fontSize: '0.75rem', color: '#3f3f46', marginBottom: '0.5rem', marginTop: '-0.5rem' }}>
              New to Pushback? Paste a message from your client above — we&apos;ll figure out what you&apos;re dealing with.
            </p>
          )}

          <PaymentSection project={project} onHandleLatePayment={(prefill) => setPaymentPrefill(prefill)} />

          <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', marginBottom: '2rem' }} />

          {showEscalationNudge && escalationNextTool && (
            <div className="fade-up" style={{
              animationDelay: '0.22s', marginBottom: '1.5rem', padding: '0.875rem 1rem',
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderLeft: '3px solid #f59e0b', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Payment reminder sent {stalledDaysSince} day{stalledDaysSince !== 1 ? 's' : ''} ago — time to escalate?
              </span>
              <button
                onClick={() => {
                  setNudgeAutoSelect(escalationNextTool)
                  const el = document.getElementById('defense-dashboard')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                style={{ ...btnStyles.outline, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {escalationNextTool === 'payment_second' ? 'Send firm follow-up' : 'Send final notice'}
              </button>
            </div>
          )}

          {clientRisk.score > 0 && (
            <ClientBehaviorCard score={clientRisk.score} level={clientRisk.level} signals={clientRisk.signals} clientName={project.client_name} />
          )}

          <div id="defense-dashboard">
            <DefenseDashboard
              projectId={project.id}
              plan={plan}
              responsesUsed={responsesUsed}
              initialPaymentPrefill={paymentPrefill ?? undefined}
              hasContract={hasContract}
              contractRiskLevel={contractRiskLevel}
              autoSelectTool={nudgeAutoSelect}
            />
          </div>
        </>
      )}

      {/* Contract view */}
      {view === 'contract' && (
        <div className="fade-up">
          {contract ? (
            <div style={{
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderRadius: '0.75rem', padding: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Contract</p>
                  <h2 style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em', margin: 0 }}>{contract.title}</h2>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: RISK_COLORS[riskLevel ?? ''] ?? 'var(--text-muted)', lineHeight: 1 }}>
                    {contract.risk_score}/10
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: RISK_COLORS[riskLevel ?? ''] ?? 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {RISK_LABEL[riskLevel ?? ''] ?? riskLevel} risk
                  </div>
                </div>
              </div>
              <Link
                href={`/contracts/${contract.id}`}
                style={{ display: 'inline-block', padding: '0.625rem 1.25rem', backgroundColor: 'var(--brand-lime)', color: '#000', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem', textDecoration: 'none' }}
              >
                View full analysis →
              </Link>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--bg-border)',
              borderRadius: '0.75rem', padding: '3rem 2rem', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                No contract analyzed for this project yet.
              </p>
              <Link
                href={`/contracts/new?project_id=${project.id}`}
                style={{ display: 'inline-block', padding: '0.625rem 1.25rem', backgroundColor: 'var(--brand-lime)', color: '#000', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem', textDecoration: 'none' }}
              >
                Analyze a contract →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* History view */}
      {view === 'history' && (
        <div className="fade-up">
          <ResponseHistory responses={historyResponses ?? []} lockedCount={lockedCount} />
        </div>
      )}
    </>
  )
}
