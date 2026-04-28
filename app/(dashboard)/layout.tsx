import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import { UserProfile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: recentProjects }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('id, title, client_name').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3),
  ])

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Ambient glow — mix-blend-mode:screen so it tints through transparent content, sidebar solid bg covers it naturally */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', mixBlendMode: 'screen' }}>
        <div className="dash-glow-a" />
        <div className="dash-glow-b" />
      </div>
      <Navbar profile={profile as UserProfile | null} isAdmin={isAdmin} recentProjects={recentProjects ?? []} />
      <main style={{ flex: 1, overflow: 'auto', paddingBottom: '4rem', position: 'relative', zIndex: 1 }} className="md:pb-0">
        {children}
      </main>
    </div>
  )
}
