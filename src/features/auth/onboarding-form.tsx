'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { type AuthActionResult, createOrganizationAction } from './actions'

const initialState: AuthActionResult = {}

export function OnboardingForm() {
  const t = useTranslations('onboarding')
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => createOrganizationAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('companyName')}
        <Input name="name" required maxLength={120} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('orgNumber')}
        <Input name="org_number" placeholder="XXXXXX-XXXX" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('vatNumber')}
        <Input name="vat_number" placeholder="SE..." />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {t('create')}
      </Button>
    </form>
  )
}
