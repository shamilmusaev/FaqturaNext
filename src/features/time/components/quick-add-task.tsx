'use client'

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef } from 'react'
import { createTaskFormAction } from '../actions'
import type { TimeActionResult } from '../actions'

const initialState: TimeActionResult = {}
const SELECT_CLASS =
  'h-11 rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand'

export function QuickAddTask({ projectId }: { projectId: string }) {
  const t = useTranslations('time.taskForm')
  const [state, dispatch, pending] = useActionState(createTaskFormAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset()
      nameRef.current?.focus()
    }
  }, [state.ok])

  return (
    <form
      ref={formRef}
      action={dispatch}
      className="bg-card border border-line-1 rounded-[20px] p-4 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="flex flex-col gap-1 text-xs text-ink/60 flex-1">
        {t('name')}
        <Input
          ref={nameRef}
          name="name"
          required
          maxLength={200}
          placeholder={t('namePlaceholder')}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-20">
        {t('estMin')}
        <Input name="estMin" placeholder="20" inputMode="decimal" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-20">
        {t('estMax')}
        <Input name="estMax" placeholder="25" inputMode="decimal" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink/60 sm:w-32">
        {t('status')}
        <select name="status" defaultValue="todo" className={SELECT_CLASS}>
          <option value="todo">{t('statusTodo')}</option>
          <option value="in_progress">{t('statusInProgress')}</option>
          <option value="done">{t('statusDone')}</option>
        </select>
      </label>
      <Button type="submit" disabled={pending} className="shrink-0">
        <PlusIcon className="h-4 w-4" /> {t('add')}
      </Button>
      {(state.fieldErrors?.name || state.error) && (
        <p className="text-xs text-neg sm:w-full sm:basis-full">
          {state.fieldErrors?.name ?? state.error}
        </p>
      )}
    </form>
  )
}
