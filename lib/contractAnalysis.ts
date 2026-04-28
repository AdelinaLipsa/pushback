import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContractAnalysis } from '@/types'

/**
 * Fetches pro analysis fields for a contract and merges them into the base analysis.
 * Returns base-only analysis for free users — RLS on contract_analysis_pro silently blocks them.
 */
export async function mergeWithProAnalysis(
  supabase: SupabaseClient,
  contractId: string,
  baseAnalysis: unknown
): Promise<ContractAnalysis | null> {
  const base = baseAnalysis as ContractAnalysis | null
  if (!base) return null

  const { data: pro } = await supabase
    .from('contract_analysis_pro' as any)
    .select('flagged_clauses, missing_protections, positive_notes, negotiation_priority')
    .eq('contract_id', contractId)
    .maybeSingle()

  return pro ? { ...base, ...(pro as Partial<ContractAnalysis>) } : base
}
