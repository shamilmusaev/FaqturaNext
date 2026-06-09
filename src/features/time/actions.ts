'use server'

import { requireUser } from '@/lib/auth'
import { parseMoney } from '@/lib/money'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { parseHM } from './duration'
import { ProjectInputSchema, TaskInputSchema, TimeEntryInputSchema } from './schema'

export type TimeActionResult = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
}

function flattenErrors(issues: import('zod').ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function readProjectForm(formData: FormData) {
  const fieldErrors: Record<string, string> = {}

  const estimateRaw = String(formData.get('estimate') ?? '').trim()
  let estimateMinutes: number | null = null
  if (estimateRaw) {
    try {
      const parsed = parseHM(estimateRaw)
      estimateMinutes = parsed > 0 ? parsed : null
    } catch {
      fieldErrors.estimate = 'Use H:MM (e.g. 100:00)'
    }
  }

  const rateRaw = String(formData.get('rate') ?? '').trim()
  let rateCents: number | null = null
  if (rateRaw) {
    try {
      rateCents = Number(parseMoney(rateRaw))
    } catch {
      fieldErrors.rate = 'Enter a valid amount'
    }
  }

  const data = {
    clientId: String(formData.get('clientId') ?? ''),
    name: String(formData.get('name') ?? '').trim(),
    estimateMinutes,
    rateCents,
    status: String(formData.get('status') ?? 'active'),
  }
  return { data, fieldErrors }
}

export async function createProjectAction(formData: FormData): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const { data, fieldErrors } = readProjectForm(formData)
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const parsed = ProjectInputSchema.safeParse(data)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { clientId, ...rest } = parsed.data
  if (!(await clientInOrg(supabase, clientId, organizationId))) {
    return { fieldErrors: { clientId: 'Unknown client' } }
  }
  const { error } = await supabase.from('projects').insert({
    organization_id: organizationId,
    client_id: clientId,
    name: rest.name,
    estimate_minutes: rest.estimateMinutes,
    rate_cents: rest.rateCents,
    status: rest.status,
  })
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath('/time/projects')
  redirect('/time/projects' as Route)
}

async function clientInOrg(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  clientId: string,
  organizationId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  return data != null
}

async function projectInOrg(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  projectId: string,
  organizationId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  return data != null
}

export async function updateProjectAction(
  id: string,
  formData: FormData,
): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const { data, fieldErrors } = readProjectForm(formData)
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const parsed = ProjectInputSchema.safeParse(data)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { clientId, ...rest } = parsed.data
  if (!(await clientInOrg(supabase, clientId, organizationId))) {
    return { fieldErrors: { clientId: 'Unknown client' } }
  }
  const { error } = await supabase
    .from('projects')
    .update({
      client_id: clientId,
      name: rest.name,
      estimate_minutes: rest.estimateMinutes,
      rate_cents: rest.rateCents,
      status: rest.status,
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath('/time/projects')
  redirect('/time/projects' as Route)
}

export async function setProjectStatusAction(
  id: string,
  status: 'active' | 'closed',
): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/time')
  revalidatePath('/time/projects')
  return { ok: true }
}

export async function createTimeEntryAction(formData: FormData): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()

  const hoursRaw = String(formData.get('hours') ?? '').trim()
  let minutes = 0
  try {
    minutes = parseHM(hoursRaw)
  } catch {
    return { fieldErrors: { hours: 'Use H:MM (e.g. 2:30)' } }
  }

  const parsed = TimeEntryInputSchema.safeParse({
    projectId: String(formData.get('projectId') ?? ''),
    entryDate: String(formData.get('entryDate') ?? ''),
    minutes,
    category: String(formData.get('category') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  if (!(await projectInOrg(supabase, parsed.data.projectId, organizationId))) {
    return { fieldErrors: { projectId: 'Unknown project' } }
  }
  const { error } = await supabase.from('time_entries').insert({
    organization_id: organizationId,
    project_id: parsed.data.projectId,
    entry_date: parsed.data.entryDate,
    minutes: parsed.data.minutes,
    category: parsed.data.category ?? null,
    description: parsed.data.description ?? null,
  })
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath('/time/log')
  return { ok: true }
}

export async function updateTimeEntryAction(
  id: string,
  formData: FormData,
): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()

  const hoursRaw = String(formData.get('hours') ?? '').trim()
  let minutes = 0
  try {
    minutes = parseHM(hoursRaw)
  } catch {
    return { fieldErrors: { hours: 'Use H:MM (e.g. 2:30)' } }
  }

  const parsed = TimeEntryInputSchema.safeParse({
    projectId: String(formData.get('projectId') ?? ''),
    entryDate: String(formData.get('entryDate') ?? ''),
    minutes,
    category: String(formData.get('category') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
  })
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  if (!(await projectInOrg(supabase, parsed.data.projectId, organizationId))) {
    return { fieldErrors: { projectId: 'Unknown project' } }
  }
  const { error } = await supabase
    .from('time_entries')
    .update({
      project_id: parsed.data.projectId,
      entry_date: parsed.data.entryDate,
      minutes: parsed.data.minutes,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath('/time/log')
  redirect('/time/log' as Route)
}

export async function deleteTimeEntryAction(id: string): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/time')
  revalidatePath('/time/log')
  return { ok: true }
}

// ---- project tasks --------------------------------------------------------

function parseOptionalHM(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const minutes = parseHM(trimmed)
  return minutes > 0 ? minutes : null
}

function readTaskForm(formData: FormData) {
  const fieldErrors: Record<string, string> = {}
  let estMinMinutes: number | null = null
  let estMaxMinutes: number | null = null
  let actualMinutes: number | null = null
  try {
    estMinMinutes = parseOptionalHM(String(formData.get('estMin') ?? ''))
  } catch {
    fieldErrors.estMin = 'Use hours (e.g. 20 or 5:30)'
  }
  try {
    estMaxMinutes = parseOptionalHM(String(formData.get('estMax') ?? ''))
  } catch {
    fieldErrors.estMax = 'Use hours (e.g. 25)'
  }
  try {
    actualMinutes = parseOptionalHM(String(formData.get('actual') ?? ''))
  } catch {
    fieldErrors.actual = 'Use hours (e.g. 25)'
  }
  // A lone min or max means a single value; keep both filled for a clean range.
  if (estMinMinutes != null && estMaxMinutes == null) estMaxMinutes = estMinMinutes
  if (estMaxMinutes != null && estMinMinutes == null) estMinMinutes = estMaxMinutes
  const data = {
    projectId: String(formData.get('projectId') ?? ''),
    name: String(formData.get('name') ?? '').trim(),
    estMinMinutes,
    estMaxMinutes,
    actualMinutes,
    status: String(formData.get('status') ?? 'todo'),
  }
  return { data, fieldErrors }
}

export async function createTaskAction(formData: FormData): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const { data, fieldErrors } = readTaskForm(formData)
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }
  const parsed = TaskInputSchema.safeParse(data)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  if (!(await projectInOrg(supabase, parsed.data.projectId, organizationId))) {
    return { fieldErrors: { projectId: 'Unknown project' } }
  }
  const { error } = await supabase.from('project_tasks').insert({
    organization_id: organizationId,
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    est_min_minutes: parsed.data.estMinMinutes,
    est_max_minutes: parsed.data.estMaxMinutes,
    actual_minutes: parsed.data.actualMinutes,
    status: parsed.data.status,
  })
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath(`/time/projects/${parsed.data.projectId}`)
  return { ok: true }
}

export async function updateTaskAction(id: string, formData: FormData): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const { data, fieldErrors } = readTaskForm(formData)
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }
  const parsed = TaskInputSchema.safeParse(data)
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error.issues) }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_tasks')
    .update({
      name: parsed.data.name,
      est_min_minutes: parsed.data.estMinMinutes,
      est_max_minutes: parsed.data.estMaxMinutes,
      actual_minutes: parsed.data.actualMinutes,
      status: parsed.data.status,
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  revalidatePath('/time')
  revalidatePath(`/time/projects/${parsed.data.projectId}`)
  redirect(`/time/projects/${parsed.data.projectId}` as Route)
}

export async function setTaskStatusAction(
  id: string,
  status: 'todo' | 'in_progress' | 'done',
): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_tasks')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/time')
  return { ok: true }
}

export async function deleteTaskAction(id: string): Promise<TimeActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/time')
  return { ok: true }
}

// ---- useActionState adapters: (prevState, formData) => result -------------

export async function createProjectFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return createProjectAction(formData)
}

export async function updateProjectFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return updateProjectAction(String(formData.get('id') ?? ''), formData)
}

export async function createTimeEntryFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return createTimeEntryAction(formData)
}

export async function updateTimeEntryFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return updateTimeEntryAction(String(formData.get('id') ?? ''), formData)
}

export async function createTaskFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return createTaskAction(formData)
}

export async function updateTaskFormAction(
  _prev: TimeActionResult,
  formData: FormData,
): Promise<TimeActionResult> {
  return updateTaskAction(String(formData.get('id') ?? ''), formData)
}
