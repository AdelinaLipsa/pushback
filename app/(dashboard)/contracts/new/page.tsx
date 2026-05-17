import { Lock } from 'lucide-react'
import ContractUploader from '@/components/contract/ContractUploader'

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ project_id?: string }> }) {
  const params = await searchParams
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Analyze a contract</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Upload a PDF or paste your contract text. We&apos;ll flag every risky clause and tell you exactly what to push back on.
      </p>

      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderLeft: '3px solid var(--brand-lime)',
          borderRadius: '0.625rem',
          padding: '1rem 1.125rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <Lock size={16} style={{ color: 'var(--brand-lime)', marginTop: '0.15rem', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
            Your contract is yours.
          </p>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Only visible to your account. Never shared with anyone else, never used to train AI. Deleting a contract removes it from our database <em>and</em> from our analysis provider in one step.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
        <ContractUploader projectId={params.project_id} />
      </div>
    </div>
  )
}
