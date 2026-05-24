'use server'

import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type InvoiceInput, InvoiceInputSchema } from './schema'

export type InvoiceActionResult = { error?: string; fieldErrors?: Record<string, string> }

function flattenErrors(issues: import('zod').ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export async function createInvoiceAction(
  input: InvoiceInput,
): Promise<InvoiceActionResult & { invoiceId?: string }> {
  const { organizationId, userId } = await requireUser()
  const parsed = InvoiceInputSchema.safeParse(input)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('create_invoice', {
    p_org: organizationId,
    p_client_id: parsed.data.clientId,
    p_due_at: parsed.data.dueAt,
    p_issued_at: parsed.data.issuedAt ?? null,
    p_currency: parsed.data.currency,
    p_notes: parsed.data.notes ?? null,
    p_line_items: parsed.data.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit ?? null,
      unit_price_cents: li.unitPriceCents.toString(),
      vat_rate: li.vatRate,
    })),
  })
  if (error) return { error: error.message }
  void userId
  if (!data) return { error: 'invoice creation returned no row' }

  revalidatePath('/invoices')
  redirect(`/invoices/${data.id}` as Route)
}

export async function sendInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (updateError) return { error: updateError.message }

  await supabase.from('invoice_events').insert({
    invoice_id: id,
    organization_id: organizationId,
    type: 'sent',
    actor_user_id: userId,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  return {}
}

export async function markInvoicePaidAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  await supabase.from('invoice_events').insert({
    invoice_id: id,
    organization_id: organizationId,
    type: 'marked_paid',
    actor_user_id: userId,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  return {}
}

export async function cancelInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  await supabase.from('invoice_events').insert({
    invoice_id: id,
    organization_id: organizationId,
    type: 'cancelled',
    actor_user_id: userId,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  return {}
}
