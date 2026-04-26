'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DefenseTool, Project, RiskLevel } from '@/types'
import { RISK_COLORS, btnStyles } from '@/lib/ui'
import ProjectHeader from '@/components/project/ProjectHeader'
import PaymentSection from '@/components/project/PaymentSection'
import DefenseDashboard from '@/components/defense/DefenseDashboard'
import ClientBehaviorCard from '@/components/project/ClientBehaviorCard'
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
  plan: 'free' | 'pro'
  responsesUsed: number
  autoSelectTool?: DefenseTool
}

function calendarDaysSince(dateStr: string): number {
  const from = new Date(dateStr)
  from.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ProjectDetailClient({ project, plan, responsesUsed, autoSelectTool }: ProjectDetailClientProps) {
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)
  const [nudgeAutoSelect, setNudgeAutoSelect] = useState<DefenseTool | undefined>(autoSelectTool)

  const contractsRaw = project.contracts
  const contract = Array.isArray(contractsRaw) ? (contractsRaw as Array<typeof contractsRaw>)[0] ?? null : contractsRaw ?? null
  const riskLevel = contract?.risk_level
  const hasContract = contract !== null
  const contractRiskLevel = contract?.risk_level as RiskLevel | undefined

  // Escalation nudge: find most recent payment_first or payment_second that was sent >7 days ago
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

      {responses.length === 0 && (
        <p
          className="fade-up"
          style={{
            animationDelay: '0.05s',
            fontSize: '0.75rem',
            color: '#3f3f46',
            marginBottom: '0.5rem',
            marginTop: '-0.5rem',
          }}
        >
          New to Pushback? Paste a message from your client above — we&apos;ll figure out what you&apos;re dealing with.
        </p>
      )}

      {/* Contract strip */}
      <div className="fade-up" style={{
        animationDelay: '0.1s',
        marginBottom: '2rem', padding: '0.75rem 1rem',
        backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.85rem',
      }}>
        {contract ? (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>
              Contract linked: {contract.title} ·{' '}
              <span style={{ color: RISK_COLORS[riskLevel ?? ''] ?? 'var(--text-muted)', fontWeight: 600 }}>
                Risk {contract.risk_score}/10 [{RISK_LABEL[riskLevel ?? ''] ?? riskLevel}]
              </span>
            </span>
            <Link href={`/contracts/${contract.id}`} style={{ color: 'var(--brand-lime)', textDecoration: 'none', fontWeight: 500 }}>
              View analysis →
            </Link>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--text-muted)' }}>No contract linked — flying blind.</span>
            <Link href={`/contracts/new?project_id=${project.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
              Analyze a contract →
            </Link>
          </>
        )}
      </div>

      <PaymentSection
        project={project}
        onHandleLatePayment={(prefill) => setPaymentPrefill(prefill)}
      />

      <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', marginBottom: '2rem' }} />

      {showEscalationNudge && escalationNextTool && (
        <div
          className="fade-up"
          style={{
            animationDelay: '0.22s',
            marginBottom: '1.5rem',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderLeft: '3px solid #f59e0b',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
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
        <ClientBehaviorCard
          score={clientRisk.score}
          level={clientRisk.level}
          signals={clientRisk.signals}
          clientName={project.client_name}
        />
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

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href={`/projects/${project.id}/history`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }} className="hover:text-white transition-colors">
          All messages for this project →
        </Link>
      </div>
    </>
  )
}
