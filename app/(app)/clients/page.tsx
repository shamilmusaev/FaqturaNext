import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { ClientGrid } from '@/features/clients/components/client-grid'
import { ClientsToolbar } from '@/features/clients/components/clients-toolbar'
import { ClientsEmpty } from '@/features/clients/components/empty-state'
import { listClientsWithStats } from '@/features/clients/queries'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ q?: string; archived?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { q, archived } = await searchParams
  const t = await getTranslations('clients')
  const clients = await listClientsWithStats({
    search: q,
    includeArchived: archived === '1',
  })

  const lifetimeRevenue = clients.reduce<bigint>((sum, c) => sum + c.revenue_cents, 0n)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {t('subtitle.count', { count: clients.length })} ·{' '}
            {t('subtitle.lifetimeRevenue', {
              amount: formatMoney(lifetimeRevenue, 'SEK'),
            })}
          </p>
        </div>
        <Link href={'/clients/new' as Route}>
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('newClient')}
          </Button>
        </Link>
      </div>
      <ClientsToolbar />
      {clients.length === 0 ? <ClientsEmpty /> : <ClientGrid clients={clients} />}
    </div>
  )
}
