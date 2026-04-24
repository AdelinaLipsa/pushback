import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Contract } from '@/types'
import { RISK_COLORS } from '@/lib/ui'

export default async function ContractsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Contracts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Signing something? Upload it first.</p>
        </div>
        <Link
          href="/contracts/new"
          style={{
            backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Analyze Contract →
        </Link>
      </div>

      {!contracts || contracts.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>📋</div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No contracts analyzed yet.</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Upload a contract before you sign it. We&apos;ll flag every clause that could cost you.
          </p>
          <Link
            href="/contracts/new"
            style={{
              backgroundColor: 'var(--brand-lime)', color: '#0a0a0a', fontWeight: 600,
              padding: '0.7rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem',
            }}
          >
            Analyze a contract →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(contracts as Contract[]).map(contract => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderRadius: '0.875rem', padding: '1.25rem 1.5rem', textDecoration: 'none', color: 'inherit',
                transition: 'border-color 150ms ease',
              }}
              className="hover:border-white/20"
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{contract.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(contract.created_at).toLocaleDateString()}
                  {contract.original_filename && <span> · {contract.original_filename}</span>}
                </div>
              </div>
              {contract.risk_score != null && contract.risk_level && (
                <div style={{
                  border: `1px solid ${RISK_COLORS[contract.risk_level]}`,
                  color: RISK_COLORS[contract.risk_level],
                  fontSize: '0.8rem', fontWeight: 700, padding: '0.3rem 0.75rem',
                  borderRadius: '0.375rem', flexShrink: 0,
                }}>
                  {contract.risk_score}/10
                </div>
              )}
              {contract.status === 'pending' && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Analyzing…</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
