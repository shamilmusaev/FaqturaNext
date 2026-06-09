import { Avatar } from '@/components/ui/avatar'
import { InvoiceDetailDialog } from '@/features/invoices/components/invoice-detail-dialog'
import { InvoiceStatusChip } from '@/features/invoices/components/invoice-status-chip'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { DueThisWeekSummary } from '../queries'

function relativeDay(dueAt: string, today = new Date()): string {
  const due = new Date(dueAt)
  const diffDays = Math.round(
    (due.getTime() - new Date(today.toISOString().slice(0, 10)).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
  if (diffDays === 0) return 'today'
  return `in ${diffDays}d`
}

export async function DueThisWeek({ summary }: { summary: DueThisWeekSummary }) {
  const t = await getTranslations('overview.dueThisWeek')
  const { items, totalCount } = summary

  return (
    <section className="rounded-[24px] border border-line-1 bg-card flex min-h-[320px] min-w-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="text-[13px] font-medium text-ink-2">{t('title')}</h2>
          <p className="mt-0.5 text-lg font-semibold">
            {totalCount === 1 ? t('count', { count: 1 }) : t('countPlural', { count: totalCount })}
          </p>
        </div>
        <Link
          href={'/invoices' as Route}
          className="text-[13px] font-medium text-ink-3 hover:text-ink"
        >
          {t('all')} →
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="px-6 text-sm text-ink/50">{t('empty')}</p>
      ) : (
        <ul className="flex flex-1 flex-col">
          {items.map((inv) => (
            <li key={inv.id}>
              <InvoiceDetailDialog invoiceId={inv.id}>
                <button
                  type="button"
                  className="w-full text-left flex items-center gap-3 border-t border-line-1 px-6 py-3 hover:bg-paper transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                >
                  <Avatar name={inv.client?.name ?? '?'} className="h-9 w-9 text-xs shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{inv.client?.name ?? 'N/A'}</div>
                    <div className="text-xs text-ink/55 truncate">
                      {inv.number} · {relativeDay(inv.dueAt)}
                    </div>
                  </div>
                  <div className="flex min-w-0 max-w-[45%] flex-col items-end gap-1">
                    <span className="tnum max-w-full truncate font-semibold">
                      {formatMoney(inv.totalCents, (inv.currency || 'SEK') as 'SEK')}
                    </span>
                    <InvoiceStatusChip status={inv.status} />
                  </div>
                </button>
              </InvoiceDetailDialog>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
