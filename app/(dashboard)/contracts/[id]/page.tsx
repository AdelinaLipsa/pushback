import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiskReport from '@/components/contract/RiskReport'
import ContractDeleteButton from '@/components/contract/ContractDeleteButton'
import ContractPendingState from '@/components/contract/ContractPendingState'
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

  const showFilename = contract.original_filename && contract.original_filename !== contract.title

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/contracts"
          className="text-text-muted text-sm no-underline inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
        >
          ← Contracts
        </Link>
        <ContractDeleteButton contractId={contract.id} />
      </div>

      <h1 className={`fade-up font-bold text-2xl tracking-tight break-words leading-snug ${showFilename ? 'mb-1' : 'mb-8'}`}>
        {contract.title}
      </h1>
      {showFilename && (
        <p className="text-text-muted text-xs break-all mb-8">{contract.original_filename}</p>
      )}

      {contract.status === 'pending' && <ContractPendingState contractId={contract.id} />}

      {contract.status === 'error' && (
        <div className="text-urgency-high bg-urgency-high-dim rounded-xl px-5 py-4 text-sm">
          Analysis failed. Go back and try uploading again, or paste the text instead.
        </div>
      )}

      {contract.status === 'analyzed' && contract.analysis && (
        <RiskReport analysis={contract.analysis as ContractAnalysis} contractId={contract.id} />
      )}
    </div>
  )
}
