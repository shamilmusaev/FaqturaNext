import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'
import { addMonthsUTC, monthKey, startOfMonthUTC } from './utils'

export type OverviewMetrics = {
  outstanding: { count: number; totalCents: bigint; overdueCount: number; overdueCents: bigint }
  paidThisMonth: { totalCents: bigint; deltaVsLastMonthPct: number | null }
  avgDaysToPay: { days: number | null; deltaDays: number | null }
  sentThisWeek: { count: number; invoicedCents: bigint }
}

export type CashflowBucket = {
  month: string // YYYY-MM
  paidCents: bigint
  outstandingCents: bigint
}

export type DueThisWeekItem = {
  id: string
  number: string
  totalCents: bigint
  currency: string
  status: Database['public']['Enums']['invoice_status']
  dueAt: string
  client: { id: string; name: string } | null
}

export type DueThisWeekSummary = {
  items: DueThisWeekItem[]
  totalCount: number
}

export type RecentActivityItem = {
  id: string
  type: Database['public']['Enums']['invoice_event_type']
  createdAt: string
  invoice: { id: string; number: string; clientName: string | null } | null
}

export type OverviewData = {
  metrics: OverviewMetrics
  cashflow: CashflowBucket[]
  due: DueThisWeekSummary
  activity: RecentActivityItem[]
}

export async function getOverviewData(months = 6, activityLimit = 8): Promise<OverviewData> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const thisMonthStart = startOfMonthUTC(today)
  const lastMonthStart = addMonthsUTC(thisMonthStart, -1)
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const cashflowStart = addMonthsUTC(thisMonthStart, -(months - 1))
  const paidStart = addMonthsUTC(thisMonthStart, -3)
  const inSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [outstandingRes, paidRes, sentWeekRes, activityRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(
        'id, number, total_cents, currency, status, due_at, issued_at, client:clients(id, name)',
      )
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'overdue']),
    supabase
      .from('invoices')
      .select('total_cents, issued_at, paid_at, status')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte(
        'paid_at',
        paidStart < cashflowStart ? paidStart.toISOString() : cashflowStart.toISOString(),
      ),
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('organization_id', organizationId)
      .gte('sent_at', weekStart.toISOString()),
    supabase
      .from('invoice_events')
      .select('id, type, created_at, invoice:invoices(id, number, client:clients(name))')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(activityLimit),
  ])

  for (const r of [outstandingRes, paidRes, sentWeekRes, activityRes]) {
    if (r.error) throw r.error
  }

  const outstandingRows = outstandingRes.data ?? []
  const paidRows = paidRes.data ?? []
  const sentWeekRows = sentWeekRes.data ?? []

  const outstanding = outstandingRows.reduce(
    (acc, inv) => {
      acc.count += 1
      acc.totalCents += BigInt(inv.total_cents)
      const overdue = inv.status === 'overdue' || inv.due_at < todayDate
      if (overdue) {
        acc.overdueCount += 1
        acc.overdueCents += BigInt(inv.total_cents)
      }
      return acc
    },
    { count: 0, totalCents: 0n, overdueCount: 0, overdueCents: 0n },
  )

  const paidThisCents = paidRows
    .filter((r) => r.paid_at && new Date(r.paid_at) >= thisMonthStart)
    .reduce((s, r) => s + BigInt(r.total_cents), 0n)
  const paidLastCents = paidRows
    .filter(
      (r) =>
        r.paid_at && new Date(r.paid_at) >= lastMonthStart && new Date(r.paid_at) < thisMonthStart,
    )
    .reduce((s, r) => s + BigInt(r.total_cents), 0n)
  const deltaPct =
    paidLastCents > 0n
      ? Number(((paidThisCents - paidLastCents) * 10000n) / paidLastCents) / 100
      : null

  const paidLast90 = paidRows.filter((r) => r.paid_at && new Date(r.paid_at) >= paidStart)
  const avgDays =
    paidLast90.length > 0
      ? Math.round(
          (paidLast90.reduce((s, r) => {
            if (!r.paid_at) return s
            const ms = new Date(r.paid_at).getTime() - new Date(r.issued_at).getTime()
            return s + Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)))
          }, 0) /
            paidLast90.length) *
            10,
        ) / 10
      : null

  const buckets = new Map<string, CashflowBucket>()
  for (let i = 0; i < months; i++) {
    const d = addMonthsUTC(cashflowStart, i)
    const key = monthKey(d)
    buckets.set(key, { month: key, paidCents: 0n, outstandingCents: 0n })
  }
  for (const r of paidRows) {
    if (!r.paid_at) continue
    const key = monthKey(new Date(r.paid_at))
    const b = buckets.get(key)
    if (b) b.paidCents += BigInt(r.total_cents)
  }
  for (const r of outstandingRows) {
    if (r.issued_at < cashflowStart.toISOString().slice(0, 10)) continue
    const key = monthKey(new Date(r.issued_at))
    const b = buckets.get(key)
    if (b) b.outstandingCents += BigInt(r.total_cents)
  }

  const dueRows = outstandingRows
    .filter((r) => r.due_at <= inSevenDays)
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
  const dueItems = dueRows.slice(0, 3).map((r) => ({
    id: r.id,
    number: r.number,
    totalCents: BigInt(r.total_cents),
    currency: r.currency,
    status: r.status,
    dueAt: r.due_at,
    client: r.client as unknown as DueThisWeekItem['client'],
  }))

  return {
    metrics: {
      outstanding,
      paidThisMonth: { totalCents: paidThisCents, deltaVsLastMonthPct: deltaPct },
      avgDaysToPay: { days: avgDays, deltaDays: null },
      sentThisWeek: {
        count: sentWeekRows.length,
        invoicedCents: sentWeekRows.reduce((s, r) => s + BigInt(r.total_cents), 0n),
      },
    },
    cashflow: Array.from(buckets.values()),
    due: { items: dueItems, totalCount: dueRows.length },
    activity: (activityRes.data ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      createdAt: e.created_at,
      invoice: e.invoice
        ? {
            id: (e.invoice as unknown as { id: string }).id,
            number: (e.invoice as unknown as { number: string }).number,
            clientName:
              (e.invoice as unknown as { client?: { name: string } | null }).client?.name ?? null,
          }
        : null,
    })),
  }
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const today = new Date()
  const thisMonthStart = startOfMonthUTC(today)
  const lastMonthStart = addMonthsUTC(thisMonthStart, -1)
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [outstandingRes, paidThisRes, paidLastRes, sentWeekRes, paidLast90Res] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_cents, status, due_at')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'overdue']),
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('paid_at', thisMonthStart.toISOString()),
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('paid_at', lastMonthStart.toISOString())
      .lt('paid_at', thisMonthStart.toISOString()),
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('organization_id', organizationId)
      .gte('sent_at', weekStart.toISOString()),
    supabase
      .from('invoices')
      .select('issued_at, paid_at, status')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('paid_at', addMonthsUTC(thisMonthStart, -3).toISOString()),
  ])

  for (const r of [outstandingRes, paidThisRes, paidLastRes, sentWeekRes, paidLast90Res]) {
    if (r.error) throw r.error
  }

  const todayDate = today.toISOString().slice(0, 10)
  const outstanding = (outstandingRes.data ?? []).reduce(
    (acc, inv) => {
      acc.count += 1
      acc.totalCents += BigInt(inv.total_cents)
      const overdue = inv.status === 'overdue' || inv.due_at < todayDate
      if (overdue) {
        acc.overdueCount += 1
        acc.overdueCents += BigInt(inv.total_cents)
      }
      return acc
    },
    { count: 0, totalCents: 0n, overdueCount: 0, overdueCents: 0n },
  )

  const paidThisCents = (paidThisRes.data ?? []).reduce((s, r) => s + BigInt(r.total_cents), 0n)
  const paidLastCents = (paidLastRes.data ?? []).reduce((s, r) => s + BigInt(r.total_cents), 0n)
  let deltaPct: number | null = null
  if (paidLastCents > 0n) {
    deltaPct = Number(((paidThisCents - paidLastCents) * 10000n) / paidLastCents) / 100
  }

  const sentWeekRows = sentWeekRes.data ?? []
  const sentThisWeek = {
    count: sentWeekRows.length,
    invoicedCents: sentWeekRows.reduce((s, r) => s + BigInt(r.total_cents), 0n),
  }

  const paidLast90 = paidLast90Res.data ?? []
  let avgDays: number | null = null
  if (paidLast90.length > 0) {
    const total = paidLast90.reduce((s, r) => {
      if (!r.paid_at) return s
      const ms = new Date(r.paid_at).getTime() - new Date(r.issued_at).getTime()
      return s + Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)))
    }, 0)
    avgDays = Math.round((total / paidLast90.length) * 10) / 10
  }

  return {
    outstanding,
    paidThisMonth: { totalCents: paidThisCents, deltaVsLastMonthPct: deltaPct },
    avgDaysToPay: { days: avgDays, deltaDays: null },
    sentThisWeek,
  }
}

export async function getCashflow(months = 6): Promise<CashflowBucket[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const today = new Date()
  const start = addMonthsUTC(startOfMonthUTC(today), -(months - 1))

  const [paidRes, outstandingRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_cents, paid_at')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('paid_at', start.toISOString()),
    supabase
      .from('invoices')
      .select('total_cents, issued_at, status')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'overdue'])
      .gte('issued_at', start.toISOString().slice(0, 10)),
  ])

  for (const r of [paidRes, outstandingRes]) {
    if (r.error) throw r.error
  }
  const paid = paidRes.data
  const outstanding = outstandingRes.data

  const buckets = new Map<string, CashflowBucket>()
  for (let i = 0; i < months; i++) {
    const d = addMonthsUTC(start, i)
    const key = monthKey(d)
    buckets.set(key, { month: key, paidCents: 0n, outstandingCents: 0n })
  }

  for (const r of paid ?? []) {
    if (!r.paid_at) continue
    const key = monthKey(new Date(r.paid_at))
    const b = buckets.get(key)
    if (b) b.paidCents += BigInt(r.total_cents)
  }
  for (const r of outstanding ?? []) {
    const key = monthKey(new Date(r.issued_at))
    const b = buckets.get(key)
    if (b) b.outstandingCents += BigInt(r.total_cents)
  }

  return Array.from(buckets.values())
}

export async function getDueThisWeek(): Promise<DueThisWeekSummary> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const today = new Date()
  const inSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data, error, count } = await supabase
    .from('invoices')
    .select('id, number, total_cents, currency, status, due_at, client:clients(id, name)', {
      count: 'exact',
    })
    .eq('organization_id', organizationId)
    .in('status', ['sent', 'overdue'])
    .lte('due_at', inSevenDays.toISOString().slice(0, 10))
    .order('due_at', { ascending: true })
    .limit(3)
  if (error) throw error

  const items = (data ?? []).map((r) => ({
    id: r.id,
    number: r.number,
    totalCents: BigInt(r.total_cents),
    currency: r.currency,
    status: r.status,
    dueAt: r.due_at,
    client: r.client as unknown as DueThisWeekItem['client'],
  }))

  return { items, totalCount: count ?? items.length }
}

export async function getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('invoice_events')
    .select('id, type, created_at, invoice:invoices(id, number, client:clients(name))')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    createdAt: e.created_at,
    invoice: e.invoice
      ? {
          id: (e.invoice as unknown as { id: string }).id,
          number: (e.invoice as unknown as { number: string }).number,
          clientName:
            (e.invoice as unknown as { client?: { name: string } | null }).client?.name ?? null,
        }
      : null,
  }))
}
