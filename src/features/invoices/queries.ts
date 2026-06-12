import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'

export type InvoiceRow = Database['public']['Tables']['invoices']['Row']
export type LineItemRow = Database['public']['Tables']['invoice_line_items']['Row']
export type InvoiceEventRow = Database['public']['Tables']['invoice_events']['Row']

export type InvoiceListItem = Pick<
  InvoiceRow,
  | 'id'
  | 'number'
  | 'status'
  | 'issued_at'
  | 'due_at'
  | 'currency'
  | 'total_cents'
  | 'updated_at'
  | 'template'
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
      'id, number, status, issued_at, due_at, currency, total_cents, updated_at, template, client:clients(id, name, email)',
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

export type LineItemHistoryEntry = {
  description: string
  unitPriceCents: bigint
  unit: string | null
  vatRate: number
}

/**
 * Distinct past line items for the org, most recent priced entry per
 * description, used as a "usual rate" reference for AI Magic Fill. Items the
 * user invoiced for the given client are preferred (listed first). Zero-priced
 * lines are dropped — they carry no rate to remember.
 */
export async function listLineItemHistory(opts: {
  clientId?: string | null
  limit?: number
}): Promise<LineItemHistoryEntry[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const limit = opts.limit ?? 40

  // !inner makes the join a filter so RLS + org scoping apply through the
  // parent invoice. Pull a generous window, then dedupe in JS.
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select(
      'description, unit, unit_price_cents, vat_rate, created_at, invoices!inner(organization_id, client_id)',
    )
    .eq('invoices.organization_id', organizationId)
    .gt('unit_price_cents', 0)
    .order('created_at', { ascending: false })
    .limit(400)
  if (error) throw error

  type Row = {
    description: string
    unit: string | null
    unit_price_cents: number | string
    vat_rate: number
    invoices: { client_id: string | null } | { client_id: string | null }[]
  }

  const seen = new Map<string, LineItemHistoryEntry & { forClient: boolean }>()
  for (const row of (data ?? []) as unknown as Row[]) {
    const key = row.description.trim().toLowerCase()
    if (!key || seen.has(key)) continue // rows are newest-first, so keep the first
    const inv = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices
    seen.set(key, {
      description: row.description.trim(),
      unitPriceCents: BigInt(row.unit_price_cents),
      unit: row.unit,
      vatRate: Number(row.vat_rate),
      forClient: Boolean(opts.clientId && inv?.client_id === opts.clientId),
    })
  }

  return [...seen.values()]
    .sort((a, b) => Number(b.forClient) - Number(a.forClient))
    .slice(0, limit)
    .map(({ forClient: _forClient, ...entry }) => entry)
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  // Fire all three queries in parallel — we already know `id`, so items/events
  // don't need to wait for the invoice row to come back first.
  const [invoiceRes, itemsRes, eventsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, client:clients(id, name, email, org_number, vat_number, address)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle(),
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
  if (invoiceRes.error) throw invoiceRes.error
  const invoice = invoiceRes.data
  if (!invoice) return null
  const items = itemsRes.data
  const events = eventsRes.data

  return {
    ...invoice,
    line_items: items ?? [],
    events: events ?? [],
  } as unknown as InvoiceDetail
}
