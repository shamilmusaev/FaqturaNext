'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'
import type { ClientActionResult } from '../actions'
import type { ClientRow } from '../queries'

interface Props {
  mode: 'create' | 'edit'
  action: (prev: ClientActionResult, formData: FormData) => Promise<ClientActionResult>
  initial?: ClientRow
  cancelHref?: Route
}

const initialState: ClientActionResult = {}

export function ClientForm({ mode, action, initial, cancelHref }: Props) {
  const t = useTranslations('clients')
  const [state, dispatch, pending] = useActionState(action, initialState)

  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form action={dispatch} className="flex flex-col gap-5 max-w-2xl">
      <Field label={t('fields.name')} error={err('name')}>
        <Input name="name" defaultValue={initial?.name ?? ''} required maxLength={200} />
      </Field>
      <Field label={t('fields.email')} error={err('email')}>
        <Input name="email" type="email" defaultValue={initial?.email ?? ''} maxLength={200} />
      </Field>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label={t('fields.orgNumber')} error={err('org_number')}>
          <Input name="org_number" defaultValue={initial?.org_number ?? ''} maxLength={50} />
        </Field>
        <Field label={t('fields.vatNumber')} error={err('vat_number')}>
          <Input name="vat_number" defaultValue={initial?.vat_number ?? ''} maxLength={50} />
        </Field>
      </div>
      <fieldset className="grid md:grid-cols-2 gap-5">
        <Field label={t('fields.addressStreet')}>
          <Input name="address.street" defaultValue={initial?.address?.street ?? ''} />
        </Field>
        <Field label={t('fields.addressPostal')}>
          <Input name="address.postal" defaultValue={initial?.address?.postal ?? ''} />
        </Field>
        <Field label={t('fields.addressCity')}>
          <Input name="address.city" defaultValue={initial?.address?.city ?? ''} />
        </Field>
        <Field label={t('fields.addressCountry')}>
          <Input name="address.country" defaultValue={initial?.address?.country ?? ''} />
        </Field>
      </fieldset>
      <Field label={t('fields.notes')} error={err('notes')}>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={4}
          maxLength={2000}
          className="w-full rounded-[12px] border border-line-1 bg-card px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        />
      </Field>

      {state.error && <p className="text-sm text-neg">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? t('actions.create') : t('actions.save')}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm text-ink/60 hover:text-ink">
            {t('actions.cancel')}
          </Link>
        )}
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
