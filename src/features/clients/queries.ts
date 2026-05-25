import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'

export type ClientRow = Database['public']['Tables']['clients']['Row']
export type ClientOption = Pick<ClientRow, 'id' | 'name'>

export type ListClientsOptions = {
  search?: string
  includeArchived?: boolean
}

export async function listClients(opts: ListClientsOptions = {}): Promise<ClientRow[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  let q = supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .limit(500)

  if (!opts.includeArchived) q = q.is('archived_at', null)

  const search = opts.search?.trim()
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, '\\$&')}%`
    q = q.or(`name.ilike.${pattern},email.ilike.${pattern}`)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function listActiveClientOptions(): Promise<ClientOption[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('name', { ascending: true })
    .limit(500)
  if (error) throw error
  return data ?? []
}

export type ClientWithStats = ClientRow & {
  invoice_count: number
  revenue_cents: bigint
  outstanding_cents: bigint
  has_overdue: boolean
}

export async function listClientsWithStats(
  opts: ListClientsOptions = {},
): Promise<ClientWithStats[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  let clientsQuery = supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .limit(500)

  if (!opts.includeArchived) clientsQuery = clientsQuery.is('archived_at', null)

  const search = opts.search?.trim()
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, '\\$&')}%`
    clientsQuery = clientsQuery.or(`name.ilike.${pattern},email.ilike.${pattern}`)
  }

  // Run both queries in parallel. We filter invoices only by organization_id
  // here (not by client ids) so the invoices request doesn't have to wait for
  // the clients response. Postgres + the RLS-filtered index on
  // (organization_id) makes this still cheap, and aggregation happens locally.
  const [clientsRes, invoicesRes] = await Promise.all([
    clientsQuery,
    supabase
      .from('invoices')
      .select('client_id, status, total_cents')
      .eq('organization_id', organizationId),
  ])
  if (clientsRes.error) throw clientsRes.error
  if (invoicesRes.error) throw invoicesRes.error
  const clients = clientsRes.data
  const invoices = invoicesRes.data
  if (!clients || clients.length === 0) return []

  type Stat = {
    invoice_count: number
    revenue_cents: bigint
    outstanding_cents: bigint
    has_overdue: boolean
  }
  const stats = new Map<string, Stat>()
  for (const c of clients) {
    stats.set(c.id, {
      invoice_count: 0,
      revenue_cents: 0n,
      outstanding_cents: 0n,
      has_overdue: false,
    })
  }
  for (const inv of invoices ?? []) {
    if (!inv.client_id) continue
    const s = stats.get(inv.client_id)
    if (!s) continue
    s.invoice_count += 1
    const total = BigInt(inv.total_cents)
    if (inv.status === 'paid') s.revenue_cents += total
    else if (inv.status === 'sent' || inv.status === 'overdue') s.outstanding_cents += total
    if (inv.status === 'overdue') s.has_overdue = true
  }

  const result: ClientWithStats[] = clients.map((c) => {
    const s = stats.get(c.id) as Stat
    return { ...c, ...s }
  })

  return result.sort((a, b) => {
    const diff = b.revenue_cents - a.revenue_cents
    if (diff > 0n) return 1
    if (diff < 0n) return -1
    return a.name.localeCompare(b.name)
  })
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}
