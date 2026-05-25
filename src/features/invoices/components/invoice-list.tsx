import { Avatar } from '@/components/ui/avatar'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { InvoiceListItem } from '../queries'
import { InvoiceStatusChip } from './invoice-status-chip'

const COLS = 'grid-cols-[24px_120px_1fr_120px_110px_100px_100px_40px]'

export async function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const tFields = await getTranslations('invoices.fields')
  return (
    <>
      {/* Desktop: card-wrapped grid table */}
      <div className="hidden md:block rounded-[24px] border border-line-1 bg-card overflow-hidden">
        <div
          className={`grid ${COLS} items-center gap-3 px-6 py-3 bg-paper text-[11px] font-medium uppercase tracking-wider text-ink/50`}
        >
          <input type="checkbox" aria-label="select-all" className="accent-ink" />
          <div>{tFields('number')}</div>
          <div>{tFields('client')}</div>
          <div className="text-right">{tFields('amount')}</div>
          <div>Status</div>
          <div>{tFields('issuedAt')}</div>
          <div>{tFields('dueAt')}</div>
          <div />
        </div>

        {invoices.map((inv) => {
          const client = inv.client
          const isOverdue = inv.status === 'overdue'
          return (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}` as Route}
              className={`grid ${COLS} items-center gap-3 px-6 py-3.5 border-t border-line-1 hover:bg-paper/60 transition-colors`}
            >
              <input
                type="checkbox"
                aria-label={`select-${inv.number}`}
                onClick={(e) => e.stopPropagation()}
                className="accent-ink"
              />
              <div className="font-mono text-[13px] text-ink/70">{inv.number}</div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={client?.name ?? '—'} className="h-7 w-7 text-[11px]" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{client?.name ?? '—'}</div>
                  <div className="text-[11px] text-ink/50 font-mono truncate">
                    {client?.email ?? ''}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-sm font-medium tnum">
                {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
              </div>
              <div>
                <InvoiceStatusChip status={inv.status} />
              </div>
              <div className="text-[13px] text-ink/70">{inv.issued_at ?? '—'}</div>
              <div className={`text-[13px] ${isOverdue ? 'text-neg' : 'text-ink/70'}`}>
                {inv.due_at ?? '—'}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  aria-label="more"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink/50 hover:text-ink hover:bg-line-1/50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="3" cy="8" r="1.4" />
                    <circle cx="8" cy="8" r="1.4" />
                    <circle cx="13" cy="8" r="1.4" />
                  </svg>
                </button>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/invoices/${inv.id}` as Route}
            className="block rounded-[24px] border border-line-1 bg-card p-4 hover:bg-paper/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={inv.client?.name ?? '—'} className="h-9 w-9" />
                <div className="min-w-0">
                  <div className="font-mono text-xs text-ink/60">{inv.number}</div>
                  <div className="font-medium truncate">{inv.client?.name ?? '—'}</div>
                  <div className="mt-0.5 text-sm text-ink/60">{inv.due_at}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <InvoiceStatusChip status={inv.status} />
                <div className="tnum font-mono font-semibold">
                  {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
