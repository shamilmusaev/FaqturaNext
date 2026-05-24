import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { ClientList } from '@/features/clients/components/client-list'
import { ClientsToolbar } from '@/features/clients/components/clients-toolbar'
import { ClientsEmpty } from '@/features/clients/components/empty-state'
import { listClients } from '@/features/clients/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ q?: string; archived?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { q, archived } = await searchParams
  const t = await getTranslations('clients')
  const clients = await listClients({
    search: q,
    includeArchived: archived === '1',
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <Link href={'/clients/new' as Route}>
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('newClient')}
          </Button>
        </Link>
      </div>
      <ClientsToolbar />
      {clients.length === 0 ? <ClientsEmpty /> : <ClientList clients={clients} />}
    </div>
  )
}
