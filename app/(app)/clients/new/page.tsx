import { type ClientActionResult, createClientAction } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/components/client-form'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function NewClientPage() {
  const t = await getTranslations('clients')

  // ClientForm expects (prev, formData); createClientAction is (formData) only.
  const adapter = async (
    _prev: ClientActionResult,
    formData: FormData,
  ): Promise<ClientActionResult> => {
    'use server'
    return createClientAction(formData)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newClient')}</h1>
      <ClientForm mode="create" action={adapter} cancelHref={'/clients' as Route} />
    </div>
  )
}
