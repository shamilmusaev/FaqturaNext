import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type { RecentActivityItem } from '../queries'

const TYPE_LABELS: Record<RecentActivityItem['type'], string> = {
  created: 'Invoice created',
  sent: 'Invoice sent',
  viewed: 'Invoice viewed',
  reminder_sent: 'Reminder sent',
  marked_paid: 'Marked as paid',
  cancelled: 'Cancelled',
  note_added: 'Note added',
}

export async function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  const t = await getTranslations('overview.activity')

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-ink/50">{t('empty')}</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-4 py-3 border-b border-line-1 last:border-0"
            >
              <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {e.invoice ? (
                    <Link
                      href={`/invoices/${e.invoice.id}` as Route}
                      className="font-medium hover:underline"
                    >
                      {e.invoice.clientName ?? e.invoice.number}
                    </Link>
                  ) : (
                    <span className="font-medium">—</span>
                  )}
                  <span className="text-ink/60"> · {TYPE_LABELS[e.type]}</span>
                </div>
                <div className="text-xs text-ink/50">
                  {e.invoice ? (
                    <span className="font-mono">{e.invoice.number} · </span>
                  ) : null}
                  {new Date(e.createdAt).toLocaleString('sv-SE')}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
