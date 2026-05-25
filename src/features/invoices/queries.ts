import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'

export type InvoiceRow = Database['public']['Tables']['invoices']['Row']
export type LineItemRow = Database['public']['Tables']['invoice_line_items']['Row']
export type InvoiceEventRow = Database['public']['Tables']['invoice_events']['Row']

export type InvoiceListItem = Pick<
  InvoiceRow,
  'id' | 'number' | 'status' | 'issued_at' | 'due_at' | 'currency' | 'total_cents'
> & {
  client: { id: string; name: string; email: string | null } | null
}

export type InvoiceDetail = InvoiceRow & {
  client: {
    id: string
    name: string
    email: string | null
    org_number: string | null
    vat_number: string | null
    address: unknown | null
  } | null
  line_items: LineItemRow[]
  events: InvoiceEventRow[]
}

export type ListInvoicesOptions = {
  status?: 'all' | 'draft' | 'sent' | 'paid' | 'overdue'
  search?: string
}

export async function listInvoices(opts: ListInvoicesOptions = {}): Promise<InvoiceListItem[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  let q = supabase
    .from('invoices')
    .select(
      'id, number, status, issued_at, due_at, currency, total_cents, client:clients(id, name, email)',
    )
    .eq('organization_id', organizationId)
    .order('issued_at', { ascending: false })
    .limit(500)

  if (opts.status && opts.status !== 'all') {
    q = q.eq('status', opts.status)
  }

  const search = opts.search?.trim()
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, '\\$&')}%`
    q = q.or(`number.ilike.${pattern}`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data as unknown as InvoiceListItem[]) ?? []
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name, email, org_number, vat_number, address)')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (invErr) throw invErr
  if (!invoice) return null

  const [{ data: items }, { data: events }] = await Promise.all([
    supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('invoice_events')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: false }),
  ])

  return {
    ...invoice,
    line_items: items ?? [],
    events: events ?? [],
  } as unknown as InvoiceDetail
}
