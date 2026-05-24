import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { InvoiceFilters } from '@/features/invoices/components/invoice-filters'
import { InvoiceList } from '@/features/invoices/components/invoice-list'
import { listInvoices } from '@/features/invoices/queries'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

const VALID_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'all'])

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams
  const t = await getTranslations('invoices')
  const normalised = status && VALID_STATUSES.has(status) ? status : 'all'

  const invoices = await listInvoices({
    status: normalised as 'all' | 'draft' | 'sent' | 'paid' | 'overdue',
    search: q,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <Link href={'/invoices/new' as Route}>
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('newInvoice')}
          </Button>
        </Link>
      </div>
      <InvoiceFilters />
      {invoices.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-12 text-center">
          <h2 className="text-lg font-semibold tracking-tight">{t('empty')}</h2>
          <p className="mt-1 text-ink/60">{t('emptyHint')}</p>
          <Link href={'/invoices/new' as Route} className="inline-block mt-6">
            <Button>
              <PlusIcon className="h-4 w-4" />
              {t('createCta')}
            </Button>
          </Link>
        </div>
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  )
}
