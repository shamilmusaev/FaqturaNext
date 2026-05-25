import { type ClientActionResult, updateClientAction } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/components/client-form'
import { getClient } from '@/features/clients/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params
  const [client, t] = await Promise.all([getClient(id), getTranslations('clients')])
  if (!client) notFound()

  const boundAction = async (
    _prev: ClientActionResult,
    formData: FormData,
  ): Promise<ClientActionResult> => {
    'use server'
    return updateClientAction(id, formData)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('edit')} · {client.name}
      </h1>
      <ClientForm
        mode="edit"
        action={boundAction}
        initial={client}
        cancelHref={`/clients/${id}` as Route}
      />
    </div>
  )
}
