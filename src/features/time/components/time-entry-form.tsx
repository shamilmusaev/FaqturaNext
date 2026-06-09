'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'
import type { TimeActionResult } from '../actions'
import { formatHM } from '../duration'
import type { ProjectOption, TimeEntryRow } from '../queries'
import { Field, SELECT_CLASS } from './form-field'

interface Props {
  action: (prev: TimeActionResult, formData: FormData) => Promise<TimeActionResult>
  projects: ProjectOption[]
  categories: string[]
  initial: TimeEntryRow
}

const initialState: TimeActionResult = {}

export function TimeEntryForm({ action, projects, categories, initial }: Props) {
  const t = useTranslations('time')
  const [state, dispatch, pending] = useActionState(action, initialState)
  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form action={dispatch} className="flex flex-col gap-5 max-w-xl">
      <input type="hidden" name="id" value={initial.id} />

      <Field label={t('quickAdd.date')} error={err('entryDate')}>
        <Input type="date" name="entryDate" defaultValue={initial.entry_date} required />
      </Field>
      <Field label={t('quickAdd.project')} error={err('projectId')}>
        <select
          name="projectId"
          required
          defaultValue={initial.project_id}
          className={SELECT_CLASS}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('quickAdd.category')}>
        <Input name="category" list="time-categories" defaultValue={initial.category ?? ''} />
        <datalist id="time-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label={t('quickAdd.description')}>
        <Input name="description" maxLength={500} defaultValue={initial.description ?? ''} />
      </Field>
      <Field label={t('quickAdd.hours')} error={err('hours')}>
        <Input name="hours" defaultValue={formatHM(initial.minutes)} placeholder="2:30" required />
      </Field>

      {state.error && <p className="text-sm text-neg">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t('log.save')}
        </Button>
        <Link href={'/time/log' as Route} className="text-sm text-ink/60 hover:text-ink">
          {t('log.cancel')}
        </Link>
      </div>
    </form>
  )
}
