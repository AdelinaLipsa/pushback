import ContractUploader from '@/components/contract/ContractUploader'

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ project_id?: string }> }) {
  const params = await searchParams
  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Analyze a contract</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Upload a PDF or paste your contract text. We&apos;ll flag every risky clause and tell you exactly what to push back on.
      </p>
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
        <ContractUploader projectId={params.project_id} />
      </div>
    </div>
  )
}
