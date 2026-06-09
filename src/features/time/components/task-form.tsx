'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'
import type { TimeActionResult } from '../actions'
import type { TaskRow } from '../queries'

const initialState: TimeActionResult = {}
const SELECT_CLASS =
  'h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand'

/** Minutes -> input value the user can re-edit ("20" or "5:30"). */
function toInput(minutes: number | null): string {
  if (minutes == null) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? String(h) : `${h}:${String(m).padStart(2, '0')}`
}

export function TaskForm({
  action,
  initial,
}: {
  action: (prev: TimeActionResult, formData: FormData) => Promise<TimeActionResult>
  initial: TaskRow
}) {
  const t = useTranslations('time.taskForm')
  const [state, dispatch, pending] = useActionState(action, initialState)
  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form action={dispatch} className="flex flex-col gap-5 max-w-xl">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="projectId" value={initial.project_id} />

      <Field label={t('name')} error={err('name')}>
        <Input name="name" defaultValue={initial.name} required maxLength={200} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label={t('estMin')} error={err('estMin')}>
          <Input name="estMin" defaultValue={toInput(initial.est_min_minutes)} placeholder="20" />
        </Field>
        <Field label={t('estMax')} error={err('estMax')}>
          <Input name="estMax" defaultValue={toInput(initial.est_max_minutes)} placeholder="25" />
        </Field>
        <Field label={t('actual')} error={err('actual')}>
          <Input name="actual" defaultValue={toInput(initial.actual_minutes)} placeholder="25" />
        </Field>
      </div>
      <Field label={t('status')}>
        <select name="status" defaultValue={initial.status} className={SELECT_CLASS}>
          <option value="todo">{t('statusTodo')}</option>
          <option value="in_progress">{t('statusInProgress')}</option>
          <option value="done">{t('statusDone')}</option>
        </select>
      </Field>

      {state.error && <p className="text-sm text-neg">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t('save')}
        </Button>
        <Link
          href={`/time/projects/${initial.project_id}` as Route}
          className="text-sm text-ink/60 hover:text-ink"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: control is rendered via children
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink/80">{label}</span>
      {children}
      {error && <span className="text-xs text-neg">{error}</span>}
    </label>
  )
}
