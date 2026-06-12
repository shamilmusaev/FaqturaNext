'use server'

import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ZodIssue } from 'zod'
import {
  CompanyInputSchema,
  EmailInputSchema,
  InvoicingInputSchema,
  LocalizationInputSchema,
  PasswordInputSchema,
  PaymentInputSchema,
  ProfileInputSchema,
} from './schema'

export type SettingsActionResult = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function flattenErrors(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function requireOwnerOrAdmin(role: string): SettingsActionResult | null {
  if (role !== 'owner' && role !== 'admin') {
    return { error: 'You do not have permission to change these settings.' }
  }
  return null
}

function readAddress(formData: FormData) {
  const keys = ['street', 'postal', 'city', 'country'] as const
  const out: Record<string, string | undefined> = {}
  let any = false
  for (const k of keys) {
    const v = String(formData.get(`address.${k}`) ?? '').trim()
    if (v) {
      out[k] = v
      any = true
    }
  }
  return any ? out : undefined
}

export async function updateCompanyAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { organizationId, role } = await requireUser()
  const block = requireOwnerOrAdmin(role)
  if (block) return block

  const parsed = CompanyInputSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    org_number: String(formData.get('org_number') ?? ''),
    vat_number: String(formData.get('vat_number') ?? ''),
    address: readAddress(formData),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('update_organization', {
    p_org_id: organizationId,
    p_name: parsed.data.name,
    // '' clears the field (the RPC treats null as "keep old value").
    p_org_number: parsed.data.org_number ?? '',
    p_vat_number: parsed.data.vat_number ?? '',
    p_address: parsed.data.address ?? null,
  })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  return { ok: true }
}

/**
 * Persist the organization logo URL after a client-side upload to Storage.
 * Pass an empty string to clear it (the RPC coalesces nulls, so we store '' and
 * treat empty as "no logo" in the templates).
 */
export async function setOrgLogoAction(logoUrl: string): Promise<SettingsActionResult> {
  const { organizationId, role } = await requireUser()
  const block = requireOwnerOrAdmin(role)
  if (block) return block

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('update_organization', {
    p_org_id: organizationId,
    p_logo_url: logoUrl,
  })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  revalidatePath('/invoices', 'layout')
  return { ok: true }
}

export async function updatePaymentAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { organizationId, role } = await requireUser()
  const block = requireOwnerOrAdmin(role)
  if (block) return block

  const parsed = PaymentInputSchema.safeParse({
    bank_name: String(formData.get('bank_name') ?? ''),
    iban: String(formData.get('iban') ?? ''),
    bankgiro: String(formData.get('bankgiro') ?? ''),
    plusgiro: String(formData.get('plusgiro') ?? ''),
    swish_number: String(formData.get('swish_number') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('update_organization', {
    p_org_id: organizationId,
    // Send '' (not null) for cleared fields: the RPC coalesces nulls as
    // "keep old value", so a null would make clearing impossible.
    p_bank_name: parsed.data.bank_name ?? '',
    p_iban: parsed.data.iban ?? '',
    p_bankgiro: parsed.data.bankgiro ?? '',
    p_plusgiro: parsed.data.plusgiro ?? '',
    p_swish_number: parsed.data.swish_number ?? '',
  })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  return { ok: true }
}

export async function updateInvoicingAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { organizationId, role } = await requireUser()
  const block = requireOwnerOrAdmin(role)
  if (block) return block

  const parsed = InvoicingInputSchema.safeParse({
    default_vat_rate: formData.get('default_vat_rate'),
    default_payment_terms_days: formData.get('default_payment_terms_days'),
    invoice_number_template: String(formData.get('invoice_number_template') ?? ''),
    currency: String(formData.get('currency') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('update_organization', {
    p_org_id: organizationId,
    p_default_vat_rate: parsed.data.default_vat_rate,
    p_default_payment_terms_days: parsed.data.default_payment_terms_days,
    p_invoice_number_template: parsed.data.invoice_number_template,
    p_currency: parsed.data.currency,
  })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  return { ok: true }
}

// ---------- Account (auth.users) ----------

export async function updateProfileAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = ProfileInputSchema.safeParse({
    display_name: String(formData.get('display_name') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.updateUser({
    data: { display_name: parsed.data.display_name ?? null },
  })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateEmailAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = EmailInputSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { data: u } = await supabase.auth.getUser()
  if (u.user?.email?.toLowerCase() === parsed.data.email.toLowerCase()) {
    return { fieldErrors: { email: 'sameEmail' } }
  }

  const { error } = await supabase.auth.updateUser({ email: parsed.data.email })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  return { ok: true }
}

export async function updatePasswordAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = PasswordInputSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  return { ok: true }
}

export async function updateLocalizationAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { organizationId, role } = await requireUser()
  const block = requireOwnerOrAdmin(role)
  if (block) return block

  const parsed = LocalizationInputSchema.safeParse({
    locale: String(formData.get('locale') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('update_organization', {
    p_org_id: organizationId,
    p_locale: parsed.data.locale,
  })
  if (error) return { error: error.message }

  revalidatePath('/settings', 'layout')
  return { ok: true }
}
