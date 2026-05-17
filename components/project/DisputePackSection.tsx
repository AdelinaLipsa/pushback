'use client'

import { useState } from 'react'
import { ShieldAlert, Lock } from 'lucide-react'
import { startCheckout } from '@/lib/checkout'
import Button from '@/components/shared/Button'
import type { Project, Plan } from '@/types'
import DisputePackModal from './DisputePackModal'

interface DisputePackSectionProps {
  project: Project
  plan: Plan
}

const cardStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
  padding: '1rem 1.25rem',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderLeft: '3px solid var(--brand-lime)',
  borderRadius: '0.5rem',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
}

const eyebrowRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  marginBottom: '0.5rem',
}

const eyebrowTextStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 600,
  margin: '0 0 0.25rem 0',
}

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  margin: 0,
  maxWidth: '52ch',
}

export default function DisputePackSection({ project, plan }: DisputePackSectionProps) {
  const [open, setOpen] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const isPro = plan === 'pro'

  async function handleUpgrade() {
    await startCheckout(setUpgradeLoading)
  }

  return (
    <>
      <div className="fade-up" style={cardStyle}>
        <div style={rowStyle}>
          <div>
            <div style={eyebrowRowStyle}>
              <ShieldAlert size={14} style={{ color: 'var(--text-secondary)' }} />
              <span style={eyebrowTextStyle}>Recovery</span>
            </div>
            <p style={titleStyle}>Compile a chargeback evidence pack</p>
            <p style={descriptionStyle}>
              Generate a Stripe/PayPal-ready PDF rebuttal with contract excerpt, delivery timeline, ranked communication log, and sign-off proofs.
            </p>
          </div>
          {isPro ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label="Compile dispute pack"
            >
              Compile Dispute Pack
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              loading={upgradeLoading}
              onClick={handleUpgrade}
              icon={<Lock size={12} />}
              aria-label="Pro feature — upgrade to unlock dispute packs"
            >
              Pro feature — upgrade
            </Button>
          )}
        </div>
      </div>
      {isPro && open ? (
        <DisputePackModal project={project} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}
