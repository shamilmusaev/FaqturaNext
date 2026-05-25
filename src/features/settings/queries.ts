import 'server-only'
import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export type Organization = {
  id: string
  name: string
  org_number: string | null
  vat_number: string | null
  address: { street?: string; postal?: string; city?: string; country?: string } | null
  iban: string | null
  bankgiro: string | null
  plusgiro: string | null
  swish_number: string | null
  default_vat_rate: number
  default_payment_terms_days: number
  locale: string
  currency: string
  invoice_number_template: string
  logo_url: string | null
}

export async function getCurrentOrganization(): Promise<Organization> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id,name,org_number,vat_number,address,iban,bankgiro,plusgiro,swish_number,default_vat_rate,default_payment_terms_days,locale,currency,invoice_number_template,logo_url',
    )
    .eq('id', organizationId)
    .single()
  if (error) throw error
  return data as unknown as Organization
}
