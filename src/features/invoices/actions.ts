'use server'

import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getInvoice, type InvoiceDetail } from './queries'
import { type InvoiceInput, InvoiceInputSchema } from './schema'

export async function fetchInvoiceForDialog(id: string): Promise<InvoiceDetail | null> {
  return await getInvoice(id)
}

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

export async function duplicateInvoiceAction(
  id: string,
): Promise<InvoiceActionResult & { invoiceId?: string }> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data: src, error: srcErr } = await supabase
    .from('invoices')
    .select('client_id, currency, notes, due_at')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()
  if (srcErr || !src) return { error: srcErr?.message ?? 'invoice not found' }

  const { data: items, error: itemsErr } = await supabase
    .from('invoice_line_items')
    .select('description, quantity, unit, unit_price_cents, vat_rate')
    .eq('invoice_id', id)
    .order('position')
  if (itemsErr) return { error: itemsErr.message }
  if (!items || items.length === 0) return { error: 'cannot duplicate empty invoice' }

  const due = new Date()
  due.setDate(due.getDate() + 30)
  const dueAt = due.toISOString().slice(0, 10)

  const { data, error } = await supabase.rpc('create_invoice', {
    p_org: organizationId,
    p_client_id: src.client_id,
    p_due_at: dueAt,
    p_currency: src.currency,
    p_notes: src.notes,
    p_line_items: items.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unit: li.unit,
      unit_price_cents: String(li.unit_price_cents),
      vat_rate: Number(li.vat_rate),
    })),
  })
  if (error || !data) return { error: error?.message ?? 'duplicate failed' }

  revalidatePath('/invoices')
  return { invoiceId: data.id }
}

export async function sendInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .eq('status', 'draft')
    .select('id')
  if (updateError) return { error: updateError.message }
  if (!updated || updated.length === 0) {
    return { error: 'invalid status transition' }
  }

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

  const { data: updated, error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .in('status', ['sent', 'overdue'])
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) {
    return { error: 'invalid status transition' }
  }

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

export async function sendReminderAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status, reminder_count')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!invoice) return { error: 'invoice not found' }
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    return { error: 'reminders only available for sent or overdue invoices' }
  }

  const { error: updateErr } = await supabase
    .from('invoices')
    .update({
      reminder_count: (invoice.reminder_count ?? 0) + 1,
      last_reminder_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (updateErr) return { error: updateErr.message }

  await supabase.from('invoice_events').insert({
    invoice_id: id,
    organization_id: organizationId,
    type: 'reminder_sent',
    actor_user_id: userId,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  return {}
}

export async function cancelInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { data: updated, error } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .in('status', ['draft', 'sent', 'overdue'])
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) {
    return { error: 'invalid status transition' }
  }

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
