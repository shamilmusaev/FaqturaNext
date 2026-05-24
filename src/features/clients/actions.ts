'use server'

import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ClientInputSchema } from './schema'

export type ClientActionResult = { error?: string; fieldErrors?: Record<string, string> }

function flattenErrors(issues: import('zod').ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function readForm(formData: FormData) {
  const addressKeys = ['street', 'postal', 'city', 'country'] as const
  const address: Record<string, string | undefined> = {}
  let hasAddress = false
  for (const k of addressKeys) {
    const v = String(formData.get(`address.${k}`) ?? '')
    if (v) {
      address[k] = v
      hasAddress = true
    }
  }
  return {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    org_number: String(formData.get('org_number') ?? ''),
    vat_number: String(formData.get('vat_number') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    address: hasAddress ? address : undefined,
  }
}

export async function createClientAction(formData: FormData): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const parsed = ClientInputSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error.issues) }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ organization_id: organizationId, ...parsed.data })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect(`/clients/${data.id}` as Route)
}

export async function updateClientAction(
  id: string,
  formData: FormData,
): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const parsed = ClientInputSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error.issues) }
  }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}` as Route)
}

export async function archiveClientAction(id: string): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return {}
}

export async function unarchiveClientAction(id: string): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update({ archived_at: null })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return {}
}
