import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CheckoutForm, { PlanSummary } from './CheckoutForm'

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan === 'pro') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="px-8 py-5 border-b border-bg-border">
        <Link href="/dashboard" className="font-extrabold text-xl tracking-tight no-underline">
          <span className="text-text-primary">Pushback</span>
          <span className="text-brand-lime">.</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-bold text-2xl tracking-tight mb-2">Upgrade to Pro</h1>
          <p className="text-text-secondary text-sm mb-8">Unlimited tools for freelancers who don't back down.</p>
          <PlanSummary />
          <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
            <CheckoutForm />
          </div>
        </div>
      </main>
    </div>
  )
}
