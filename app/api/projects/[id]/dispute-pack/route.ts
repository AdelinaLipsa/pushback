export const maxDuration = 30

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, defendRateLimit } from '@/lib/rate-limit'
import { assemblePackData } from '@/lib/dispute/assemble'
import { renderPack } from '@/lib/dispute/renderPack'
import { z } from 'zod'

const DISPUTE_TYPE_VALUES = ['not_as_described', 'not_received', 'cancelled', 'unauthorized'] as const

const disputePackSchema = z.object({
  dispute_type: z.enum(DISPUTE_TYPE_VALUES),
  case_reference: z.string().max(80).optional(),
})

type ContractRow = {
  id: string
  contract_text: string | null
  analysis: { clauses_present?: string[] | null } | null
}

type DefenseRow = {
  id: string
  tool_type: string
  response: string
  situation: string
  created_at: string
  was_sent: boolean
}

function safeFilename(disputeType: string, projectTitle: string): string {
  const cleaned = projectTitle
    .replace(/[^A-Za-z0-9- ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .toLowerCase()
  const cleanTitle = cleaned.length > 0 ? cleaned : 'project'
  const stamp = new Date().toISOString().slice(0, 10)
  return `dispute-pack-${disputeType}-${cleanTitle}-${stamp}.pdf`
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, email, full_name')
    .eq('id', user.id)
    .single()
  if (!profile || profile.plan !== 'pro') {
    return Response.json({ error: 'PRO_REQUIRED' }, { status: 403 })
  }

  const rateLimitResponse = await checkRateLimit(defendRateLimit, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const { data: gateResult, error: gateError } = await supabase.rpc(
    'check_and_increment_defense_responses',
    { uid: user.id }
  )
  const gate = gateResult as { allowed: boolean; reason?: string } | null
  if (gateError || !gate?.allowed) {
    return Response.json({ error: gate?.reason ?? 'UPGRADE_REQUIRED' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = disputePackSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json(
        { error: `${String(issue.path[0])}: ${issue.message}` },
        { status: 400 }
      )
    }
    const { dispute_type, case_reference } = parsed.data

    const { data: project } = await supabase
      .from('projects')
      .select(`
        id, title, client_name, project_value, currency,
        payment_due_date, payment_received_at, payment_amount,
        contracts(id, contract_text, analysis),
        defense_responses(id, tool_type, response, situation, created_at, was_sent)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const contractsField = project.contracts as ContractRow | ContractRow[] | null
    const contractRow: ContractRow | null = Array.isArray(contractsField)
      ? (contractsField[0] ?? null)
      : (contractsField ?? null)

    const packData = assemblePackData({
      disputeType: dispute_type,
      caseReference: case_reference ?? null,
      user: {
        id: user.id,
        email: profile.email ?? user.email ?? '',
        full_name: profile.full_name ?? null,
      },
      project: {
        id: project.id,
        title: project.title,
        client_name: project.client_name ?? '',
        project_value: project.project_value,
        currency: project.currency ?? 'EUR',
        payment_due_date: project.payment_due_date,
        payment_received_at: project.payment_received_at,
        payment_amount: project.payment_amount,
      },
      contract: contractRow
        ? {
            contract_text: contractRow.contract_text,
            clausesPresent: contractRow.analysis?.clauses_present ?? null,
          }
        : null,
      responses: (project.defense_responses ?? []) as DefenseRow[],
    })

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderPack(packData)
    } catch (renderErr) {
      console.error('renderPack error:', renderErr)
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Pack generation failed — please try again' }, { status: 500 })
    }
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      await supabase.rpc('decrement_defense_responses', { uid: user.id })
      return Response.json({ error: 'Pack generation failed — please try again' }, { status: 500 })
    }

    const filename = safeFilename(dispute_type, project.title)
    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('Dispute-pack route error:', err)
    await supabase.rpc('decrement_defense_responses', { uid: user.id })
    return Response.json({ error: 'Pack generation failed — please try again' }, { status: 500 })
  }
}
