'use server'

import { requireUser } from '@/lib/auth'
import type { InvoicePdfData } from '@/lib/pdf/templates'
import { DEFAULT_TEMPLATE_ID, type TemplateId, isTemplateId } from '@/lib/pdf/templates/ids'
import { THUMBNAIL_BUCKET } from '@/lib/pdf/thumbnail-key'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PDF_ORG_COLUMNS, invoiceToPdfData } from './pdf-data'
import { type InvoiceDetail, getInvoice } from './queries'
import { type InvoiceInput, InvoiceInputSchema } from './schema'

export async function fetchInvoiceForDialog(id: string): Promise<InvoiceDetail | null> {
  return await getInvoice(id)
}

type Supabase = Awaited<ReturnType<typeof createServerClient>>

/** Best-effort removal of cached PNG thumbnails for the given invoice ids. */
async function removeThumbnails(supabase: Supabase, orgId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return
  const { data: files } = await supabase.storage.from(THUMBNAIL_BUCKET).list(orgId)
  if (!files) return
  // Keys are "<invoiceId>-<version>.png"; invoiceId is a UUID (has dashes), so
  // match by prefix rather than splitting on '-'.
  const remove = files
    .filter((f) => invoiceIds.some((id) => f.name.startsWith(`${id}-`)))
    .map((f) => `${orgId}/${f.name}`)
  if (remove.length > 0) await supabase.storage.from(THUMBNAIL_BUCKET).remove(remove)
}

export interface InvoicePreviewPayload {
  data: InvoicePdfData
  template: TemplateId
}

/** Build the react-pdf payload for an existing invoice, for the dialog preview. */
export async function fetchInvoicePreviewData(id: string): Promise<InvoicePreviewPayload | null> {
  const { organizationId } = await requireUser()
  const invoice = await getInvoice(id)
  if (!invoice) return null

  const supabase = await createServerClient()
  const { data: org } = await supabase
    .from('organizations')
    .select(PDF_ORG_COLUMNS)
    .eq('id', organizationId)
    .maybeSingle()
  if (!org) return null

  const template = isTemplateId(invoice.template) ? invoice.template : DEFAULT_TEMPLATE_ID
  return { data: invoiceToPdfData(invoice, org), template }
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
  redirectTo: 'detail' | false = 'detail',
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
    p_delivery_date: parsed.data.deliveryAt ?? null,
    p_hide_ocr: parsed.data.hideOcr,
    p_currency: parsed.data.currency,
    p_notes: parsed.data.notes ?? null,
    p_number: parsed.data.number ?? null,
    p_template: parsed.data.template,
    p_reverse_vat: parsed.data.reverseVat,
    p_rot_rut_type: parsed.data.rotRutType ?? null,
    // bigint isn't JSON-serializable in rpc args; deduction fits in a safe int.
    p_rot_rut_cents: Number(parsed.data.rotRutCents),
    p_our_reference: parsed.data.ourReference ?? null,
    p_their_reference: parsed.data.theirReference ?? null,
    p_order_number: parsed.data.orderNumber ?? null,
    p_payment_terms_days: parsed.data.paymentTermsDays ?? null,
    p_line_items: parsed.data.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit ?? null,
      unit_price_cents: li.unitPriceCents.toString(),
      vat_rate: li.vatRate,
      discount_percent: li.discountPercent,
    })),
  })
  if (error) return { error: error.message }
  void userId
  if (!data) return { error: 'invoice creation returned no row' }

  revalidatePath('/invoices')
  if (redirectTo === 'detail') redirect(`/invoices/${data.id}` as Route)
  return { invoiceId: data.id }
}

/**
 * Persist edits to an existing DRAFT invoice. `redirectTo` controls navigation:
 * pass false for background autosave (returns the result instead of redirecting).
 */
export async function updateInvoiceAction(
  invoiceId: string,
  input: InvoiceInput,
  redirectTo: 'detail' | false = 'detail',
): Promise<InvoiceActionResult & { invoiceId?: string }> {
  await requireUser()
  const parsed = InvoiceInputSchema.safeParse(input)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('update_invoice', {
    p_invoice_id: invoiceId,
    p_client_id: parsed.data.clientId,
    p_due_at: parsed.data.dueAt,
    p_issued_at: parsed.data.issuedAt ?? null,
    p_delivery_date: parsed.data.deliveryAt ?? null,
    p_hide_ocr: parsed.data.hideOcr,
    p_currency: parsed.data.currency,
    p_notes: parsed.data.notes ?? null,
    p_number: parsed.data.number ?? null,
    p_template: parsed.data.template,
    p_reverse_vat: parsed.data.reverseVat,
    p_rot_rut_type: parsed.data.rotRutType ?? null,
    p_rot_rut_cents: Number(parsed.data.rotRutCents),
    p_our_reference: parsed.data.ourReference ?? null,
    p_their_reference: parsed.data.theirReference ?? null,
    p_order_number: parsed.data.orderNumber ?? null,
    p_payment_terms_days: parsed.data.paymentTermsDays ?? null,
    p_line_items: parsed.data.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit ?? null,
      unit_price_cents: li.unitPriceCents.toString(),
      vat_rate: li.vatRate,
      discount_percent: li.discountPercent,
    })),
  })
  if (error) return { error: error.message }
  if (!data) return { error: 'invoice update returned no row' }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  if (redirectTo === 'detail') redirect(`/invoices/${invoiceId}` as Route)
  return { invoiceId }
}

export async function duplicateInvoiceAction(
  id: string,
): Promise<InvoiceActionResult & { invoiceId?: string }> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data: src, error: srcErr } = await supabase
    .from('invoices')
    .select(
      'client_id, currency, notes, due_at, template, reverse_vat, rot_rut_type, rot_rut_cents, our_reference, their_reference, order_number, payment_terms_days',
    )
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()
  if (srcErr || !src) return { error: srcErr?.message ?? 'invoice not found' }

  const { data: items, error: itemsErr } = await supabase
    .from('invoice_line_items')
    .select('description, quantity, unit, unit_price_cents, vat_rate, discount_percent')
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
    p_template: src.template ?? undefined,
    p_reverse_vat: src.reverse_vat ?? false,
    p_rot_rut_type: src.rot_rut_type ?? null,
    p_rot_rut_cents: Number(src.rot_rut_cents ?? 0),
    p_our_reference: src.our_reference ?? null,
    p_their_reference: src.their_reference ?? null,
    p_order_number: src.order_number ?? null,
    p_payment_terms_days: src.payment_terms_days ?? null,
    p_line_items: items.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unit: li.unit,
      unit_price_cents: String(li.unit_price_cents),
      vat_rate: Number(li.vat_rate),
      discount_percent: Number(li.discount_percent ?? 0),
    })),
  })
  if (error || !data) return { error: error?.message ?? 'duplicate failed' }

  revalidatePath('/invoices')
  return { invoiceId: data.id }
}

export async function setInvoiceTemplateAction(
  id: string,
  template: string,
): Promise<InvoiceActionResult> {
  const { organizationId } = await requireUser()
  if (!isTemplateId(template)) return { error: 'unknown template' }
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('invoices')
    .update({ template })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'invoice not found' }

  revalidatePath(`/invoices/${id}`)
  return {}
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

/** Permanently delete a DRAFT invoice (RLS blocks non-drafts). */
export async function deleteInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data: deleted, error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
    .eq('status', 'draft')
    .select('id')
  if (error) return { error: error.message }
  if (!deleted || deleted.length === 0) return { error: 'only drafts can be deleted' }

  await removeThumbnails(supabase, organizationId, [id])
  revalidatePath('/invoices')
  return {}
}

/** Bulk-delete drafts; returns how many were removed vs skipped (non-drafts). */
export async function deleteDraftsAction(
  ids: string[],
): Promise<{ deleted: number; skipped: number; error?: string }> {
  if (ids.length === 0) return { deleted: 0, skipped: 0 }
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data: deleted, error } = await supabase
    .from('invoices')
    .delete()
    .eq('organization_id', organizationId)
    .eq('status', 'draft')
    .in('id', ids)
    .select('id')
  if (error) return { deleted: 0, skipped: ids.length, error: error.message }

  const deletedIds = (deleted ?? []).map((r) => r.id)
  await removeThumbnails(supabase, organizationId, deletedIds)
  revalidatePath('/invoices')
  return { deleted: deletedIds.length, skipped: ids.length - deletedIds.length }
}

/** Bulk-cancel invoices (draft/sent/overdue → cancelled). */
export async function cancelInvoicesAction(
  ids: string[],
): Promise<{ cancelled: number; skipped: number; error?: string }> {
  if (ids.length === 0) return { cancelled: 0, skipped: 0 }
  const { organizationId, userId } = await requireUser()
  const supabase = await createServerClient()

  const { data: updated, error } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('organization_id', organizationId)
    .in('status', ['draft', 'sent', 'overdue'])
    .in('id', ids)
    .select('id')
  if (error) return { cancelled: 0, skipped: ids.length, error: error.message }

  const cancelledIds = (updated ?? []).map((r) => r.id)
  if (cancelledIds.length > 0) {
    await supabase.from('invoice_events').insert(
      cancelledIds.map((invoiceId) => ({
        invoice_id: invoiceId,
        organization_id: organizationId,
        type: 'cancelled' as const,
        actor_user_id: userId,
      })),
    )
  }
  revalidatePath('/invoices')
  return { cancelled: cancelledIds.length, skipped: ids.length - cancelledIds.length }
}
