import { Avatar } from '@/components/ui/avatar'
import { formatMoney } from '@/lib/money'
import { getTranslations } from 'next-intl/server'
import type { InvoiceListItem } from '../queries'
import { InvoiceDetailDialog } from './invoice-detail-dialog'
import { InvoiceQuickActions } from './invoice-quick-actions'
import { InvoiceRowCheckbox } from './invoice-row-actions'
import { InvoiceStatusChip } from './invoice-status-chip'

const OUTER_COLS = 'grid-cols-[24px_minmax(0,1fr)_auto]'
const INNER_COLS = 'grid-cols-[150px_260px_150px_150px_120px_120px]'

export async function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const tFields = await getTranslations('invoices.fields')
  return (
    <>
      {/* Desktop: card-wrapped grid table */}
      <div className="hidden overflow-hidden rounded-[22px] border border-line-1 bg-card xl:block">
        <div
          className={`grid ${OUTER_COLS} min-h-11 items-center gap-3 bg-paper px-6 text-[11px] font-medium uppercase tracking-wider text-ink/45`}
        >
          <input type="checkbox" aria-label="select-all" className="h-4 w-4 accent-ink" />
          <div className={`grid ${INNER_COLS} items-center justify-between`}>
            <div>{tFields('number')}</div>
            <div>{tFields('client')}</div>
            <div className="text-right">{tFields('amount')}</div>
            <div>{tFields('status')}</div>
            <div>{tFields('issuedAt')}</div>
            <div>{tFields('dueAt')}</div>
          </div>
          <div />
        </div>

        {invoices.map((inv) => {
          const client = inv.client
          const isOverdue = inv.status === 'overdue'
          return (
            <div
              key={inv.id}
              className={`grid ${OUTER_COLS} group min-h-[68px] items-center gap-3 border-t border-line-1 px-6 transition-colors hover:bg-paper/60`}
            >
              <InvoiceRowCheckbox id={inv.id} invoiceNumber={inv.number} />
              <InvoiceDetailDialog invoiceId={inv.id}>
                <button
                  type="button"
                  className={`grid ${INNER_COLS} min-h-[68px] items-center justify-between rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
                >
                  <div className="text-[13px] font-normal text-ink/55">{inv.number}</div>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={client?.name ?? 'N/A'} className="h-7 w-7 shrink-0 text-[11px]" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{client?.name ?? 'N/A'}</div>
                      <div className="truncate text-[11px] font-normal text-ink/45">
                        {client?.email ?? ''}
                      </div>
                    </div>
                  </div>
                  <div className="tnum text-right text-sm font-semibold text-ink/90">
                    {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                  </div>
                  <div>
                    <InvoiceStatusChip status={inv.status} className="whitespace-nowrap" />
                  </div>
                  <div className="text-[13px] text-ink/65">{inv.issued_at ?? 'N/A'}</div>
                  <div className={`text-[13px] ${isOverdue ? 'text-neg' : 'text-ink/65'}`}>
                    {inv.due_at ?? 'N/A'}
                  </div>
                </button>
              </InvoiceDetailDialog>
              <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <InvoiceQuickActions
                  invoice={{ id: inv.id, status: inv.status, number: inv.number }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 xl:hidden">
        {invoices.map((inv) => (
          <InvoiceDetailDialog key={inv.id} invoiceId={inv.id}>
            <button
              type="button"
              className="text-left block w-full rounded-[20px] border border-line-1 bg-card p-4 transition-colors hover:bg-paper/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={inv.client?.name ?? 'N/A'} className="h-9 w-9 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-normal text-ink/55">{inv.number}</div>
                    <div className="truncate font-medium">{inv.client?.name ?? 'N/A'}</div>
                    <div className="mt-0.5 text-sm text-ink/60">{inv.due_at}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <InvoiceStatusChip status={inv.status} className="whitespace-nowrap" />
                  <div className="tnum max-w-[42vw] truncate font-semibold text-ink/90">
                    {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                  </div>
                </div>
              </div>
            </button>
          </InvoiceDetailDialog>
        ))}
      </div>
    </>
  )
}
