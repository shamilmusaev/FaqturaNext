import { Button } from '@/components/ui/button'
import { ChevronRight } from '@/components/ui/icons'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { RecentActivityItem } from '../queries'

const DOT: Record<RecentActivityItem['type'], string> = {
  created: 'bg-ink-3',
  sent: 'bg-brand',
  viewed: 'bg-info',
  reminder_sent: 'bg-warn',
  marked_paid: 'bg-pos',
  cancelled: 'bg-neg',
  note_added: 'bg-ink-3',
}

export async function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  const t = await getTranslations('overview.activity')
  const tTimeline = await getTranslations('invoices.timeline')

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
        <Button variant="secondary" size="sm" type="button">
          {t('filter')}
        </Button>
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
              <span className={`h-2 w-2 rounded-full shrink-0 ${DOT[e.type]}`} />
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
                  <span className="text-ink/60"> · {tTimeline(e.type)}</span>
                </div>
                <div className="text-xs text-ink/50">
                  {e.invoice ? <span className="font-mono">{e.invoice.number} · </span> : null}
                  {new Date(e.createdAt).toLocaleString('sv-SE')}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ink/40 shrink-0" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
