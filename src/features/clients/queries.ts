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
