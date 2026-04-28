import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Contract } from '@/types'
import ContractsTable from '@/components/contract/ContractsTable'

export default async function ContractsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, projects(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2rem' }}>
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
          <div style={{ marginBottom: '1rem', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
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
        <div className="fade-up" style={{ animationDelay: '0.08s' }}>
          <ContractsTable contracts={contracts as Contract[]} />
        </div>
      )}
    </div>
  )
}
