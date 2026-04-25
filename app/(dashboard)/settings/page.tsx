import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSubscriptionNextBillingDate } from '@/lib/stripe'
import SettingsClient from '@/components/settings/SettingsClient'
import type { UserProfile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as UserProfile | null
  if (!p) redirect('/login')

  const isEmailUser = user.app_metadata?.provider === 'email'

  let nextBillingDate: string | null = null
  if (p.plan === 'pro' && p.stripe_subscription_id) {
    nextBillingDate = await getSubscriptionNextBillingDate(p.stripe_subscription_id)
  }

  return <SettingsClient profile={p} nextBillingDate={nextBillingDate} isEmailUser={isEmailUser} />
}
