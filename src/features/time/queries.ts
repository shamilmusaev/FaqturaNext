import 'server-only'
import { requireUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'
import { earnedCents } from './duration'

export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type TimeEntryRow = Database['public']['Tables']['time_entries']['Row']
export type TaskRow = Database['public']['Tables']['project_tasks']['Row']

type TaskSum = { min: number; max: number; total: number; done: number; actual: number }

export type ProjectOption = {
  id: string
  name: string
  clientName: string
}

export type ProjectStats = {
  id: string
  name: string
  clientName: string
  status: 'active' | 'closed'
  /** Effective budget = max of the range (or the single estimate). null = no budget. */
  estimateMinutes: number | null
  estimateMinMinutes: number | null
  estimateMaxMinutes: number | null
  rateCents: number | null
  usedMinutes: number
  earnedCents: number | null
  taskTotal: number
  taskDone: number
}

export type DashboardEntry = {
  id: string
  entryDate: string
  projectName: string
  clientName: string
  category: string | null
  description: string | null
  minutes: number
}

export type TimeDashboard = {
  month: string
  totalMonthMinutes: number
  totalWeekMinutes: number
  totalAllTimeMinutes: number
  activeProjectCount: number
  earnedMonthCents: number
  hasAnyRate: boolean
  projects: ProjectStats[]
  byProject: { id: string; name: string; clientName: string; minutes: number }[]
  byCategory: { id: string; name: string; clientName: string; minutes: number }[]
  recent: DashboardEntry[]
}

// All "today"/"this month"/"this week" calculations use the user's wall-clock
// timezone, not UTC, so entries logged late at night land on the right day.
const TZ = 'Europe/Stockholm'

/** Today as YYYY-MM-DD in the local timezone (sv-SE already formats that way). */
export function localToday(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function currentMonth(): string {
  return localToday().slice(0, 7)
}

/** Monday (ISO) of the current local week, as YYYY-MM-DD. */
export function weekStart(): string {
  const [y, m, d] = localToday().split('-')
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  const dow = date.getUTCDay() // 0 = Sun
  const diff = dow === 0 ? 6 : dow - 1
  date.setUTCDate(date.getUTCDate() - diff)
  return date.toISOString().slice(0, 10)
}

/**
 * The last 12 months (newest first) plus `selected` if it's outside that
 * window. Computed once on the server and passed to the client selector so
 * server and client render identical option lists (no hydration mismatch).
 */
export function monthOptions(selected: string, locale = 'en'): { value: string; label: string }[] {
  const [tyStr, tmStr] = localToday().split('-')
  const ty = Number(tyStr)
  const tm = Number(tmStr)
  const out: { value: string; label: string }[] = []
  const seen = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(ty, tm - 1 - i, 1))
    const value = d.toISOString().slice(0, 7)
    out.push({ value, label: monthLabel(d, locale) })
    seen.add(value)
  }
  if (!seen.has(selected)) {
    const [yStr, mStr] = selected.split('-')
    const d = new Date(Date.UTC(Number(yStr), Number(mStr) - 1, 1))
    out.unshift({ value: selected, label: monthLabel(d, locale) })
  }
  return out
}

function monthLabel(d: Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

type RawProject = ProjectRow & { clients: { name: string } | null }

async function fetchProjectsWithClient(organizationId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .limit(500)
    .returns<RawProject[]>()
  if (error) throw error
  return data ?? []
}

export async function listProjectOptions(): Promise<ProjectOption[]> {
  const { organizationId } = await requireUser()
  const projects = await fetchProjectsWithClient(organizationId)
  return projects
    .filter((p) => p.status === 'active')
    .map((p) => ({ id: p.id, name: p.name, clientName: p.clients?.name ?? '' }))
}

export async function listCategoryOptions(): Promise<string[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('time_entries')
    .select('category')
    .eq('organization_id', organizationId)
    .not('category', 'is', null)
    .limit(2000)
  if (error) throw error
  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.category) set.add(row.category)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export async function listProjects(
  opts: { status?: 'active' | 'closed' | 'all' } = {},
): Promise<ProjectStats[]> {
  const { organizationId } = await requireUser()
  const status = opts.status ?? 'all'
  const supabase = await createServerClient()

  const [projects, entriesRes, taskSums] = await Promise.all([
    fetchProjectsWithClient(organizationId),
    supabase
      .from('time_entries')
      .select('project_id, minutes')
      .eq('organization_id', organizationId),
    fetchTaskSums(organizationId),
  ])
  if (entriesRes.error) throw entriesRes.error

  const usedByProject = new Map<string, number>()
  for (const e of entriesRes.data ?? []) {
    usedByProject.set(e.project_id, (usedByProject.get(e.project_id) ?? 0) + e.minutes)
  }

  return projects
    .filter((p) => status === 'all' || p.status === status)
    .map((p) => toStats(p, usedByProject.get(p.id) ?? 0, taskSums.get(p.id)))
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listTasks(projectId: string): Promise<TaskRow[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export type DashboardTask = {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'todo' | 'in_progress' | 'done'
}

type RawDashboardTask = {
  id: string
  name: string
  status: string
  project_id: string
  projects: { name: string; status: string } | null
}

/** Tasks across active projects, for the dashboard mini board. */
export async function listDashboardTasks(): Promise<DashboardTask[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('id, name, status, project_id, projects!inner(name, status)')
    .eq('organization_id', organizationId)
    .eq('projects.status', 'active')
    .order('position', { ascending: true })
    .limit(200)
    .returns<RawDashboardTask[]>()
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    projectId: row.project_id,
    projectName: row.projects?.name ?? '',
    status: row.status as DashboardTask['status'],
  }))
}

export type ProjectBoard = {
  project: ProjectRow & { clientName: string }
  tasks: TaskRow[]
}

export async function getProjectBoard(id: string): Promise<ProjectBoard | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
    .returns<RawProject>()
  if (error) throw error
  if (!data) return null
  const tasks = await listTasks(id)
  return { project: { ...data, clientName: data.clients?.name ?? '' }, tasks }
}

export async function getTask(id: string): Promise<TaskRow | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Active budgeted projects at or over 80% of their estimate, worst first. */
export async function getBudgetAlerts(): Promise<ProjectStats[]> {
  const projects = await listProjects({ status: 'active' })
  return projects
    .filter((p) => p.estimateMinutes != null && p.estimateMinutes > 0)
    .filter((p) => p.usedMinutes / (p.estimateMinutes ?? 1) >= 0.8)
    .sort(
      (a, b) => b.usedMinutes / (b.estimateMinutes ?? 1) - a.usedMinutes / (a.estimateMinutes ?? 1),
    )
}

export async function getTimeEntry(id: string): Promise<TimeEntryRow | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}

export type ListEntriesOptions = { projectId?: string; month?: string; limit?: number }

type RawEntry = TimeEntryRow & {
  projects: { name: string; clients: { name: string } | null } | null
}

export async function listEntries(opts: ListEntriesOptions = {}): Promise<DashboardEntry[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  let q = supabase
    .from('time_entries')
    .select('*, projects(name, clients(name))')
    .eq('organization_id', organizationId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 500)

  if (opts.projectId) q = q.eq('project_id', opts.projectId)
  if (opts.month) {
    q = q.gte('entry_date', `${opts.month}-01`).lt('entry_date', nextMonthStart(opts.month))
  }

  const { data, error } = await q.returns<RawEntry[]>()
  if (error) throw error
  return (data ?? []).map(toDashboardEntry)
}

export async function getTimeDashboard(opts: { month?: string } = {}): Promise<TimeDashboard> {
  const { organizationId } = await requireUser()
  const month = opts.month ?? currentMonth()
  const supabase = await createServerClient()

  const week = weekStart()
  const [projects, entriesRes, recent, taskSums] = await Promise.all([
    fetchProjectsWithClient(organizationId),
    supabase
      .from('time_entries')
      .select('project_id, entry_date, minutes, category')
      .eq('organization_id', organizationId),
    listEntries({ month, limit: 8 }),
    fetchTaskSums(organizationId),
  ])
  if (entriesRes.error) throw entriesRes.error
  const entries = entriesRes.data ?? []

  const usedAllTime = new Map<string, number>()
  const usedMonth = new Map<string, number>()
  const catMonth = new Map<string, number>()
  let totalMonthMinutes = 0
  let totalWeekMinutes = 0
  let totalAllTimeMinutes = 0
  for (const e of entries) {
    usedAllTime.set(e.project_id, (usedAllTime.get(e.project_id) ?? 0) + e.minutes)
    totalAllTimeMinutes += e.minutes
    if (e.entry_date >= week) totalWeekMinutes += e.minutes
    if (e.entry_date.slice(0, 7) === month) {
      usedMonth.set(e.project_id, (usedMonth.get(e.project_id) ?? 0) + e.minutes)
      const cat = e.category?.trim() || 'Uncategorized'
      catMonth.set(cat, (catMonth.get(cat) ?? 0) + e.minutes)
      totalMonthMinutes += e.minutes
    }
  }

  const rateById = new Map(projects.map((p) => [p.id, p.rate_cents]))
  let earnedMonthCents = 0
  for (const [projectId, minutes] of usedMonth) {
    const rate = rateById.get(projectId)
    if (rate) earnedMonthCents += earnedCents(minutes, rate)
  }

  const projectStats = projects.map((p) =>
    toStats(p, usedAllTime.get(p.id) ?? 0, taskSums.get(p.id)),
  )

  const byProject = projects
    .map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.clients?.name ?? '',
      minutes: usedMonth.get(p.id) ?? 0,
    }))
    .filter((p) => p.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)

  const byCategory = [...catMonth.entries()]
    .map(([name, minutes]) => ({ id: name, name, clientName: '', minutes }))
    .sort((a, b) => b.minutes - a.minutes)

  return {
    month,
    totalWeekMinutes,
    byCategory,
    totalMonthMinutes,
    totalAllTimeMinutes,
    activeProjectCount: projects.filter((p) => p.status === 'active').length,
    earnedMonthCents,
    hasAnyRate: projects.some((p) => p.rate_cents != null),
    projects: projectStats.filter((p) => p.status === 'active'),
    byProject,
    recent,
  }
}

async function fetchTaskSums(organizationId: string): Promise<Map<string, TaskSum>> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('project_id, est_min_minutes, est_max_minutes, actual_minutes, status')
    .eq('organization_id', organizationId)
  if (error) throw error
  const map = new Map<string, TaskSum>()
  for (const t of data ?? []) {
    const cur = map.get(t.project_id) ?? { min: 0, max: 0, total: 0, done: 0, actual: 0 }
    cur.min += t.est_min_minutes ?? t.est_max_minutes ?? 0
    cur.max += t.est_max_minutes ?? t.est_min_minutes ?? 0
    cur.total += 1
    if (t.status === 'done') cur.done += 1
    cur.actual += t.actual_minutes ?? 0
    map.set(t.project_id, cur)
  }
  return map
}

function toStats(p: RawProject, usedMinutes: number, taskSum?: TaskSum): ProjectStats {
  const hasTasks = taskSum != null && taskSum.total > 0
  const estimateMinMinutes = hasTasks ? taskSum.min : p.estimate_minutes
  const estimateMaxMinutes = hasTasks ? taskSum.max : p.estimate_minutes
  return {
    id: p.id,
    name: p.name,
    clientName: p.clients?.name ?? '',
    status: p.status as 'active' | 'closed',
    estimateMinutes: estimateMaxMinutes,
    estimateMinMinutes,
    estimateMaxMinutes,
    rateCents: p.rate_cents,
    usedMinutes,
    earnedCents: p.rate_cents != null ? earnedCents(usedMinutes, p.rate_cents) : null,
    taskTotal: taskSum?.total ?? 0,
    taskDone: taskSum?.done ?? 0,
  }
}

function toDashboardEntry(e: RawEntry): DashboardEntry {
  return {
    id: e.id,
    entryDate: e.entry_date,
    projectName: e.projects?.name ?? '',
    clientName: e.projects?.clients?.name ?? '',
    category: e.category,
    description: e.description,
    minutes: e.minutes,
  }
}

function nextMonthStart(month: string): string {
  const [yStr, mStr] = month.split('-')
  const date = new Date(Date.UTC(Number(yStr), Number(mStr), 1))
  return date.toISOString().slice(0, 10)
}
