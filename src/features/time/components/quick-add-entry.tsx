'use client'

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { createTimeEntryFormAction } from '../actions'
import type { TimeActionResult } from '../actions'
import type { ProjectOption } from '../queries'

interface Props {
  projects: ProjectOption[]
  categories: string[]
  today: string
}

const initialState: TimeActionResult = {}

export function QuickAddEntry({ projects, categories, today }: Props) {
  const t = useTranslations('time')
  const [state, dispatch, pending] = useActionState(createTimeEntryFormAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const hoursRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset()
      hoursRef.current?.focus()
    }
  }, [state.ok])

  if (projects.length === 0) {
    return (
      <div className="bg-card border border-line-1 rounded-[24px] p-6 text-sm text-ink/50">
        {t('quickAdd.needProject')}
      </div>
    )
  }

  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form
      ref={formRef}
      action={dispatch}
      className="bg-card border border-line-1 rounded-[24px] p-4 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-36">
        {t('quickAdd.date')}
        <Input type="date" name="entryDate" defaultValue={today} required />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-48">
        {t('quickAdd.project')}
        <select
          name="projectId"
          required
          className="h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-40">
        {t('quickAdd.category')}
        <Input
          name="category"
          list="time-categories"
          placeholder={t('quickAdd.categoryPlaceholder')}
        />
        <datalist id="time-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 flex-1">
        {t('quickAdd.description')}
        <Input
          name="description"
          maxLength={500}
          placeholder={t('quickAdd.descriptionPlaceholder')}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-24">
        {t('quickAdd.hours')}
        <Input ref={hoursRef} name="hours" placeholder="2:30" required />
      </label>
      <Button type="submit" disabled={pending} className="shrink-0">
        <PlusIcon className="h-4 w-4" /> {t('quickAdd.add')}
      </Button>
      {(err('hours') || err('projectId') || state.error) && (
        <p className="text-xs text-neg sm:w-full sm:basis-full">
          {err('hours') ?? err('projectId') ?? state.error}
        </p>
      )}
    </form>
  )
}
