import { InvoiceStatusChip } from '@/features/invoices/components/invoice-status-chip'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { DueThisWeekItem } from '../queries'

function relativeDay(dueAt: string, today = new Date()): string {
  const due = new Date(dueAt)
  const diffDays = Math.round(
    (due.getTime() - new Date(today.toISOString().slice(0, 10)).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays < 0) return `${Math.abs(diffDays)} d ago`
  if (diffDays === 0) return 'today'
  return `in ${diffDays} d`
}

export async function DueThisWeek({ items }: { items: DueThisWeekItem[] }) {
  const t = await getTranslations('overview.dueThisWeek')

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <p className="text-sm text-ink/60">
            {items.length === 1
              ? t('count', { count: 1 })
              : t('countPlural', { count: items.length })}
          </p>
        </div>
        <Link href={'/invoices' as Route} className="text-sm text-ink/60 hover:text-ink">
          {t('all')} →
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-ink/50">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}` as Route}
                className="flex items-center gap-3 hover:bg-paper/50 -mx-2 px-2 py-2 rounded-lg"
              >
                <div className="h-9 w-9 rounded-full bg-line-1 text-ink text-xs font-medium inline-flex items-center justify-center shrink-0">
                  {(inv.client?.name ?? '?')
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{inv.client?.name ?? '—'}</div>
                  <div className="text-xs text-ink/60 font-mono truncate">
                    {inv.number} · {relativeDay(inv.dueAt)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="tnum font-mono font-semibold">
                    {formatMoney(inv.totalCents, (inv.currency || 'SEK') as 'SEK')}
                  </span>
                  <InvoiceStatusChip status={inv.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
