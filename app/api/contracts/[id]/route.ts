import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, writesRateLimit } from '@/lib/rate-limit'
import { anthropic } from '@/lib/anthropic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ contract: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await checkRateLimit(writesRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  // Fetch anthropic_file_id before deleting — row must exist to read it
  const { data: contract } = await supabase
    .from('contracts')
    .select('anthropic_file_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return Response.json({ error: 'Not found' }, { status: 404 })

  // Best-effort Anthropic Files API cleanup (D-12)
  // If anthropic_file_id is null (text-upload contract) or if delete fails, log and continue
  if (contract.anthropic_file_id) {
    try {
      await (anthropic.beta.files as any).delete(
        contract.anthropic_file_id,
        { betas: ['files-api-2025-04-14'] }
      )
    } catch (err) {
      console.error('Anthropic file delete error:', err)
      // continue regardless — do not fail the whole operation
    }
  }

  const { error } = await supabase.from('contracts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
