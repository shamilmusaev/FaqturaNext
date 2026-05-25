import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'

export type ClientRow = Database['public']['Tables']['clients']['Row']

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

  const { data: clients, error: cErr } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .limit(500)
  if (cErr) throw cErr
  if (!clients || clients.length === 0) return []

  const { data: invoices, error: iErr } = await supabase
    .from('invoices')
    .select('client_id, status, total_cents')
    .eq('organization_id', organizationId)
    .in(
      'client_id',
      clients.map((c) => c.id),
    )
  if (iErr) throw iErr

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

  let result: ClientWithStats[] = clients.map((c) => {
    const s = stats.get(c.id) as Stat
    return { ...c, ...s }
  })

  if (!opts.includeArchived) result = result.filter((c) => !c.archived_at)

  const search = opts.search?.trim()?.toLowerCase()
  if (search) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) || (c.email ?? '').toLowerCase().includes(search),
    )
  }

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
