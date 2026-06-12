import { formatMoney } from '@/lib/money'
import { thumbnailVersion } from '@/lib/pdf/thumbnail-key'
import type { InvoiceListItem } from '../queries'
import { InvoiceDetailDialog } from './invoice-detail-dialog'
import { InvoiceStatusChip } from './invoice-status-chip'

export function InvoiceCards({ invoices }: { invoices: InvoiceListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {invoices.map((inv) => {
        const version = thumbnailVersion({ updated_at: inv.updated_at, template: inv.template })
        const thumb = `/api/invoices/${inv.id}/thumbnail?v=${version}`
        return (
          <InvoiceDetailDialog key={inv.id} invoiceId={inv.id}>
            <button
              type="button"
              className="group block w-full overflow-hidden rounded-[18px] border border-line-1 bg-card text-left transition-colors hover:border-line-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {/* A4-portrait thumbnail of the rendered invoice PDF (first page). */}
              <div className="relative aspect-[1/1.414] overflow-hidden bg-paper">
                {/* Dynamic per-invoice PNG from an API route, not a static asset. */}
                <img
                  src={thumb}
                  alt={inv.number}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute right-2 top-2">
                  <InvoiceStatusChip
                    status={inv.status}
                    className="whitespace-nowrap shadow-soft"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{inv.client?.name ?? 'N/A'}</div>
                  <div className="truncate text-[11px] text-ink/45">{inv.number}</div>
                </div>
                <div className="tnum shrink-0 text-sm font-semibold text-ink/90">
                  {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                </div>
              </div>
            </button>
          </InvoiceDetailDialog>
        )
      })}
    </div>
  )
}
