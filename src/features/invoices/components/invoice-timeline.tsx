import { getLocale, getTranslations } from 'next-intl/server'
import type { InvoiceEventRow } from '../queries'

const DOT: Record<InvoiceEventRow['type'], string> = {
  created: 'bg-ink-3',
  sent: 'bg-brand',
  viewed: 'bg-info',
  reminder_sent: 'bg-warn',
  marked_paid: 'bg-pos',
  cancelled: 'bg-neg',
  note_added: 'bg-ink-3',
}

function relTime(iso: string, locale: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export async function InvoiceTimeline({ events }: { events: InvoiceEventRow[] }) {
  const t = await getTranslations('invoices.timeline')
  const locale = await getLocale()
  if (events.length === 0) return null
  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
      <ol className="flex flex-col">
        {events.map((e) => (
          <li
            key={e.id}
            className="grid grid-cols-[110px_24px_1fr] items-center gap-3 py-2.5 border-b border-line-1 last:border-0"
          >
            <span className="text-xs text-ink-3 tabular-nums">{relTime(e.created_at, locale)}</span>
            <span className="inline-flex items-center justify-center">
              <span className={`h-2 w-2 rounded-full ${DOT[e.type]}`} />
            </span>
            <span className="text-sm">{t(e.type)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
