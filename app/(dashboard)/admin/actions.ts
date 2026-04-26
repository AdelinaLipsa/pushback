'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'

const MAINTENANCE_KEY = 'pb:maintenance'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null

async function assertAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')
  return createAdminSupabaseClient()
}

export async function setPlan(userId: string, plan: 'pro' | 'free') {
  const admin = await assertAdmin()
  const { error } = await admin
    .from('user_profiles')
    .update({ plan } as never)
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function resetPeriodUsage(userId: string) {
  const admin = await assertAdmin()
  const { error } = await admin
    .from('user_profiles')
    .update({ period_responses_used: 0, period_contracts_used: 0 } as never)
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function getMaintenanceMode(): Promise<boolean> {
  if (!redis) return false
  const val = await redis.get(MAINTENANCE_KEY)
  return val === '1'
}

export async function setMaintenanceMode(on: boolean): Promise<void> {
  await assertAdmin()
  if (!redis) throw new Error('Redis not configured — add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars')
  if (on) {
    await redis.set(MAINTENANCE_KEY, '1')
  } else {
    await redis.del(MAINTENANCE_KEY)
  }
  revalidatePath('/admin')
}

export async function deleteUser(userId: string) {
  const admin = await assertAdmin()
  await admin.from('defense_responses').delete().eq('user_id', userId)
  await admin.from('contracts').delete().eq('user_id', userId)
  await admin.from('user_profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
