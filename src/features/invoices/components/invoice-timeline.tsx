import { getTranslations } from 'next-intl/server'
import type { InvoiceEventRow } from '../queries'

export async function InvoiceTimeline({ events }: { events: InvoiceEventRow[] }) {
  const t = await getTranslations('invoices.timeline')
  if (events.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
      <ol className="border-l border-line-1 pl-6 flex flex-col gap-4">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-ink/40" />
            <div className="text-sm">{t(e.type)}</div>
            <div className="text-xs text-ink/50">
              {new Date(e.created_at).toLocaleString('sv-SE')}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
