import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiskReport from '@/components/contract/RiskReport'
import { ContractAnalysis } from '@/types'

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) notFound()

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <Link href="/contracts" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.5rem' }} className="hover:text-white transition-colors">
        ← Contracts
      </Link>

      <h1 style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>{contract.title}</h1>
      {contract.original_filename && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem' }}>{contract.original_filename}</p>
      )}

      {contract.status === 'pending' && (
        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Analyzing contract…</div>
      )}

      {contract.status === 'error' && (
        <div style={{ color: 'var(--urgency-high)', backgroundColor: 'var(--urgency-high-dim)', borderRadius: '0.75rem', padding: '1rem 1.25rem' }}>
          Analysis failed. Please try again.
        </div>
      )}

      {contract.status === 'analyzed' && contract.analysis && (
        <RiskReport analysis={contract.analysis as ContractAnalysis} />
      )}
    </div>
  )
}
