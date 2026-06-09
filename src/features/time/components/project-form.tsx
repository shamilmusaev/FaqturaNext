'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'
import type { TimeActionResult } from '../actions'
import { formatHM } from '../duration'
import type { ProjectRow } from '../queries'

interface ClientOption {
  id: string
  name: string
}

interface Props {
  mode: 'create' | 'edit'
  action: (prev: TimeActionResult, formData: FormData) => Promise<TimeActionResult>
  clients: ClientOption[]
  initial?: ProjectRow
}

const initialState: TimeActionResult = {}

export function ProjectForm({ mode, action, clients, initial }: Props) {
  const t = useTranslations('time')
  const [state, dispatch, pending] = useActionState(action, initialState)
  const err = (key: string) => state.fieldErrors?.[key]

  const rateValue = initial?.rate_cents != null ? String(initial.rate_cents / 100) : ''
  const estimateValue = initial?.estimate_minutes != null ? formatHM(initial.estimate_minutes) : ''

  return (
    <form action={dispatch} className="flex flex-col gap-5 max-w-xl">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label={t('project.client')} error={err('clientId')}>
        <select
          name="clientId"
          required
          defaultValue={initial?.client_id ?? ''}
          className="h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          <option value="" disabled>
            {t('project.clientPlaceholder')}
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('project.name')} error={err('name')}>
        <Input name="name" defaultValue={initial?.name ?? ''} required maxLength={200} />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field
          label={t('project.estimate')}
          error={err('estimate')}
          hint={t('project.estimateHint')}
        >
          <Input name="estimate" defaultValue={estimateValue} placeholder="100:00" />
        </Field>
        <Field label={t('project.rate')} error={err('rate')} hint={t('project.rateHint')}>
          <Input name="rate" defaultValue={rateValue} placeholder="1500" inputMode="decimal" />
        </Field>
      </div>

      <Field label={t('project.status')}>
        <select
          name="status"
          defaultValue={initial?.status ?? 'active'}
          className="h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          <option value="active">{t('project.statusActive')}</option>
          <option value="closed">{t('project.statusClosed')}</option>
        </select>
      </Field>

      {state.error && <p className="text-sm text-neg">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? t('project.create') : t('project.save')}
        </Button>
        <Link href={'/time/projects' as Route} className="text-sm text-ink/60 hover:text-ink">
          {t('project.cancel')}
        </Link>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: control is rendered via children
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink/80">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink/40">{hint}</span>}
      {error && <span className="text-xs text-neg">{error}</span>}
    </label>
  )
}
