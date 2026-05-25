import { DownloadIcon } from '@/components/ui/icons'
import { DuplicateInvoiceButton } from '@/features/invoices/components/duplicate-button'
import { InvoiceActions } from '@/features/invoices/components/invoice-actions'
import { InvoiceStatusChip } from '@/features/invoices/components/invoice-status-chip'
import { InvoiceTimeline } from '@/features/invoices/components/invoice-timeline'
import { SendReminderButton } from '@/features/invoices/components/send-reminder-button'
import { getInvoice } from '@/features/invoices/queries'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()
  const t = await getTranslations('invoices')
  const tFields = await getTranslations('invoices.fields')
  const currency = (invoice.currency || 'SEK') as 'SEK'

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href={'/invoices' as Route} className="text-sm text-ink/60 hover:text-ink">
          ← {t('back')}
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-sm text-ink/60">{invoice.number}</div>
          <h1 className="text-3xl font-semibold tracking-tight">{invoice.client?.name ?? '—'}</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4">
            {invoice.status === 'draft' && (
              <Link href={`/invoices/${invoice.id}/edit` as Route}>
                <span className="text-sm text-ink/60 hover:text-ink underline">{t('edit')}</span>
              </Link>
            )}
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
            >
              <DownloadIcon className="h-4 w-4" /> PDF
            </a>
            <DuplicateInvoiceButton id={invoice.id} />
          </div>
          <InvoiceActions id={invoice.id} status={invoice.status} />
        </div>
      </div>

      <section className="rounded-[24px] border border-line-1 bg-card p-7 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <InvoiceStatusChip status={invoice.status} />
          <div className="mt-3 text-5xl font-semibold tracking-tight tnum font-mono">
            {formatMoney(BigInt(invoice.total_cents), currency)}
          </div>
          <div className="mt-1 text-sm text-ink/70">
            {tFields('dueAt')} {invoice.due_at}
            {invoice.status === 'overdue' && (
              <span className="ml-2 text-neg">· {t('overdueLabel')}</span>
            )}
          </div>
        </div>
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <SendReminderButton id={invoice.id} />
        )}
      </section>

      <section className="rounded-[24px] border border-line-1 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-ink/60 text-xs uppercase tracking-wide">
            <tr className="border-b border-line-1">
              <th className="text-left font-medium px-4 py-3">{tFields('description')}</th>
              <th className="text-right font-medium px-4 py-3">{tFields('quantity')}</th>
              <th className="text-right font-medium px-4 py-3">{tFields('unitPrice')}</th>
              <th className="text-right font-medium px-4 py-3">{tFields('vat')}</th>
              <th className="text-right font-medium px-4 py-3">{tFields('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((li) => (
              <tr key={li.id} className="border-b border-line-1 last:border-0">
                <td className="px-4 py-3">{li.description}</td>
                <td className="px-4 py-3 text-right tnum font-mono">{li.quantity}</td>
                <td className="px-4 py-3 text-right tnum font-mono">
                  {formatMoney(BigInt(li.unit_price_cents), currency)}
                </td>
                <td className="px-4 py-3 text-right">{li.vat_rate}%</td>
                <td className="px-4 py-3 text-right tnum font-mono">
                  {formatMoney(BigInt(li.amount_cents), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-[24px] border border-line-1 bg-card p-4 md:max-w-sm md:ml-auto">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-ink/60">{tFields('subtotal')}</dt>
          <dd className="tnum font-mono">
            {formatMoney(BigInt(invoice.subtotal_cents), currency)}
          </dd>
          <dt className="text-ink/60">{tFields('vatTotal')}</dt>
          <dd className="tnum font-mono">{formatMoney(BigInt(invoice.vat_cents), currency)}</dd>
          <dt className="font-semibold pt-2 border-t border-line-1 mt-1">{tFields('total')}</dt>
          <dd className="tnum font-mono font-semibold pt-2 border-t border-line-1 mt-1">
            {formatMoney(BigInt(invoice.total_cents), currency)}
          </dd>
        </dl>
      </section>

      {invoice.notes && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-2">{tFields('notes')}</h2>
          <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
        </section>
      )}

      <InvoiceTimeline events={invoice.events} />
    </div>
  )
}
