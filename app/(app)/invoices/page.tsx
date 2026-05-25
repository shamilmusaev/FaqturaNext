import { Button } from '@/components/ui/button'
import { DownloadIcon, PlusIcon } from '@/components/ui/icons'
import { listActiveClientOptions } from '@/features/clients/queries'
import { InvoiceFilters } from '@/features/invoices/components/invoice-filters'
import { InvoiceList } from '@/features/invoices/components/invoice-list'
import {
  NewInvoiceDialog,
  NewInvoiceDialogButton,
} from '@/features/invoices/components/new-invoice-dialog'
import { listInvoices } from '@/features/invoices/queries'
import { formatMoney } from '@/lib/money'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

const VALID_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'all'])

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams
  const t = await getTranslations('invoices')
  const normalised = status && VALID_STATUSES.has(status) ? status : 'all'

  const [invoices, clientOptions] = await Promise.all([
    listInvoices({
      status: normalised as 'all' | 'draft' | 'sent' | 'paid' | 'overdue',
      search: q,
    }),
    listActiveClientOptions(),
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
          <NewInvoiceDialogButton clients={clientOptions} label={t('newInvoice')} />
        </div>
      </div>
      <InvoiceFilters />
      {invoices.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-12 text-center">
          <h2 className="text-lg font-semibold tracking-tight">{t('empty')}</h2>
          <p className="mt-1 text-ink/60">{t('emptyHint')}</p>
          <div className="inline-block mt-6">
            <NewInvoiceDialog clients={clientOptions}>
              <Button>
                <PlusIcon className="h-4 w-4" />
                {t('createCta')}
              </Button>
            </NewInvoiceDialog>
          </div>
        </div>
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  )
}
