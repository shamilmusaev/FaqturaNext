import { Button } from '@/components/ui/button'
import { DownloadIcon, PlusIcon } from '@/components/ui/icons'
import { InvoiceCards } from '@/features/invoices/components/invoice-cards'
import { InvoiceFilters } from '@/features/invoices/components/invoice-filters'
import { InvoiceList } from '@/features/invoices/components/invoice-list'
import { NewInvoiceDialogButton } from '@/features/invoices/components/new-invoice-dialog'
import { listInvoices } from '@/features/invoices/queries'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>
}

const VALID_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'all'])

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { status, q, view } = await searchParams
  const normalised = status && VALID_STATUSES.has(status) ? status : 'all'
  const cardsView = view === 'cards'

  const [t, invoices] = await Promise.all([
    getTranslations('invoices'),
    listInvoices({
      status: normalised as 'all' | 'draft' | 'sent' | 'paid' | 'overdue',
      search: q,
    }),
  ])

  const outstandingCents = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce<bigint>((sum, i) => sum + BigInt(i.total_cents), 0n)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {t('subtitle.count', { count: invoices.length })} ·{' '}
            {formatMoney(outstandingCents, 'SEK')} {t('subtitle.outstanding')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          <Button
            variant="secondary"
            disabled
            title="coming soon"
            className="h-9 shrink-0 px-3.5 text-sm sm:h-11 sm:px-5 sm:text-[15px]"
          >
            <DownloadIcon className="h-4 w-4" />
            {t('exportCsv')}
          </Button>
          <NewInvoiceDialogButton label={t('newInvoice')} />
        </div>
      </div>
      <InvoiceFilters />
      {invoices.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-12 text-center">
          <h2 className="text-lg font-semibold tracking-tight">{t('empty')}</h2>
          <p className="mt-1 text-ink/60">{t('emptyHint')}</p>
          <div className="inline-block mt-6">
            <Link href={'/invoices/new' as Route}>
              <Button>
                <PlusIcon className="h-4 w-4" />
                {t('createCta')}
              </Button>
            </Link>
          </div>
        </div>
      ) : cardsView ? (
        <InvoiceCards invoices={invoices} />
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  )
}
