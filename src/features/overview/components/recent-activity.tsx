import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronRight } from '@/components/ui/icons'
import { InvoiceDetailDialog } from '@/features/invoices/components/invoice-detail-dialog'
import { getLocale, getTranslations } from 'next-intl/server'
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
  const locale = await getLocale()
  const dateFmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <section className="rounded-[24px] border border-line-1 bg-card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 pt-5 pb-3">
        <h2 className="text-[17px] font-semibold tracking-tight">{t('title')}</h2>
        <Button variant="secondary" size="sm" type="button">
          {t('filter')}
        </Button>
      </header>

      {items.length === 0 ? (
        <p className="px-6 pb-5 text-sm text-ink/50">{t('empty')}</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((e) => (
            <li key={e.id} className="border-t border-line-1">
              {e.invoice ? (
                <InvoiceDetailDialog invoiceId={e.invoice.id}>
                  <button
                    type="button"
                    className="w-full text-left grid grid-cols-[8px_1fr_auto] items-center gap-3 px-6 py-3 transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${DOT[e.type]}`} />
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={e.invoice.clientName ?? e.invoice.number}
                        className="h-9 w-9 text-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {e.invoice.clientName ?? e.invoice.number}
                          <span className="text-ink/60"> · {tTimeline(e.type)}</span>
                        </div>
                        <div className="text-xs text-ink/55 truncate">
                          {e.invoice.number} · {dateFmt.format(new Date(e.createdAt))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink/40 shrink-0" />
                  </button>
                </InvoiceDetailDialog>
              ) : (
                <div className="grid grid-cols-[8px_1fr_auto] items-center gap-3 px-6 py-3">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${DOT[e.type]}`} />
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name="Unknown" className="h-9 w-9 text-xs shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        N/A<span className="text-ink/60"> · {tTimeline(e.type)}</span>
                      </div>
                      <div className="text-xs text-ink/55 truncate">
                        {dateFmt.format(new Date(e.createdAt))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink/20 shrink-0" />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
