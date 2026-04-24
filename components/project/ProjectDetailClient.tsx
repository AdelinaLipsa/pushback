'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DefenseTool, Project } from '@/types'
import { RISK_COLORS } from '@/lib/ui'
import ProjectHeader from '@/components/project/ProjectHeader'
import PaymentSection from '@/components/project/PaymentSection'
import DefenseDashboard from '@/components/defense/DefenseDashboard'

const RISK_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

interface PaymentPrefill {
  tool: DefenseTool
  contextFields: Record<string, string>
}

interface ProjectDetailClientProps {
  project: Project & {
    contracts?: { id: string; risk_score: number | null; risk_level: string | null; title: string | null } | null
  }
  plan: 'free' | 'pro'
  responsesUsed: number
}

export default function ProjectDetailClient({ project, plan, responsesUsed }: ProjectDetailClientProps) {
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)

  const contractsRaw = project.contracts
  const contract = Array.isArray(contractsRaw) ? (contractsRaw as Array<typeof contractsRaw>)[0] ?? null : contractsRaw ?? null
  const riskLevel = contract?.risk_level

  return (
    <>
      <ProjectHeader project={project} />

      {/* Contract strip */}
      <div style={{
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
            <span style={{ color: 'var(--text-muted)' }}>No contract linked</span>
            <Link href={`/contracts/new?project_id=${project.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem' }} className="hover:text-white transition-colors">
              Add contract
            </Link>
          </>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--bg-border)', marginBottom: '2rem' }} />

      <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        What&apos;s happening?
      </h2>

      <div id="defense-dashboard">
        <DefenseDashboard
          projectId={project.id}
          plan={plan}
          responsesUsed={responsesUsed}
          initialPaymentPrefill={paymentPrefill ?? undefined}
        />
      </div>

      <PaymentSection
        project={project}
        onHandleLatePayment={(prefill) => setPaymentPrefill(prefill)}
      />

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href={`/projects/${project.id}/history`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }} className="hover:text-white transition-colors">
          View message history →
        </Link>
      </div>
    </>
  )
}
