import { toast } from 'sonner'
import type { DefenseTool } from '@/types'

async function request<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    const data = await res.json()
    if (!res.ok) {
      toast.error(data?.error ?? 'Something went wrong.')
      return null
    }
    return data as T
  } catch {
    toast.error('Network error — check your connection.')
    return null
  }
}

// ─── Projects ───────────────────────────────────────────────────────────────

export async function createProject(body: {
  title: string
  client_name: string
  client_email?: string
  project_value?: number | null
  currency: string
  notes?: string
}) {
  return request<{ project: { id: string } }>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  return request<{ project: unknown }>(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function deleteProject(id: string) {
  return request<{ success: true }>(`/api/projects/${id}`, { method: 'DELETE' })
}

// ─── Contracts ──────────────────────────────────────────────────────────────

export async function analyzeContract(formData: FormData) {
  return request<{ contract: { id: string } }>('/api/contracts/analyze', {
    method: 'POST',
    body: formData,
  })
}

export async function deleteContract(id: string) {
  return request<{ success: true }>(`/api/contracts/${id}`, { method: 'DELETE' })
}

// ─── Defense ────────────────────────────────────────────────────────────────

type DefensePayload = {
  tool_type: DefenseTool
  situation: string
  extra_context: Record<string, string | number>
}

type DefenseData = {
  response: string
  id: string
  contract_clauses_used?: string[]
  usage_warning?: string
}

export type DefenseResult = { upgradeRequired: true } | (DefenseData & { upgradeRequired?: false }) | null

export async function generateDefense(
  projectId: string,
  body: DefensePayload,
): Promise<DefenseResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}/defend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.status === 403 && data.error === 'UPGRADE_REQUIRED') return { upgradeRequired: true }
    if (res.status === 403 && data.error === 'PERIOD_LIMIT_REACHED') {
      toast.error('Monthly limit reached — resets at your next billing date.')
      return null
    }
    if (!res.ok) { toast.error(data?.error ?? 'Something went wrong.'); return null }
    if (data.usage_warning) toast.warning(data.usage_warning)
    return data as DefenseData
  } catch {
    toast.error('Network error — check your connection.')
    return null
  }
}

type AnalyzeData = {
  tool_type: DefenseTool
  explanation: string
  situation_context: string
}

export type AnalyzeResult = { upgradeRequired: true } | (AnalyzeData & { upgradeRequired?: false }) | null

export async function analyzeMessage(
  projectId: string,
  message: string,
): Promise<AnalyzeResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}/analyze-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    if (res.status === 403 && data.error === 'UPGRADE_REQUIRED') return { upgradeRequired: true }
    if (!res.ok) { toast.error(data?.error ?? 'Something went wrong.'); return null }
    return data as AnalyzeData
  } catch {
    toast.error('Network error — check your connection.')
    return null
  }
}

// ─── Responses (fire-and-forget) ─────────────────────────────────────────────

export function markResponseSent(id: string) {
  fetch(`/api/responses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ was_sent: true }),
  }).catch(() => {})
}

export function markResponseCopied(id: string) {
  fetch(`/api/responses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ was_copied: true }),
  }).catch(() => {})
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export async function checkout(): Promise<string | null> {
  const data = await request<{ url: string }>('/api/checkout', { method: 'POST' })
  return data?.url ?? null
}

export async function billingPortal(): Promise<string | null> {
  const data = await request<{ url: string }>('/api/billing-portal', { method: 'POST' })
  return data?.url ?? null
}
