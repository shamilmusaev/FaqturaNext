import { getCurrentOrganization } from '@/features/settings/queries'
import { orgBrandingVersion, thumbnailVersion } from '@/lib/pdf/thumbnail-key'
import { getTranslations } from 'next-intl/server'
import type { InvoiceListItem } from '../queries'
import { InvoiceCard } from './invoice-card'

export async function InvoiceCards({ invoices }: { invoices: InvoiceListItem[] }) {
  const [tStatus, org] = await Promise.all([
    getTranslations('invoiceStatus'),
    getCurrentOrganization(),
  ])
  const orgVersion = orgBrandingVersion(org as unknown as Record<string, unknown>)
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {invoices.map((inv) => {
        const version = thumbnailVersion(
          { updated_at: inv.updated_at, template: inv.template },
          orgVersion,
        )
        return (
          <InvoiceCard
            key={inv.id}
            inv={{
              id: inv.id,
              number: inv.number,
              status: inv.status,
              statusLabel: tStatus(inv.status),
              clientName: inv.client?.name ?? 'N/A',
              totalCents: inv.total_cents,
              currency: inv.currency || 'SEK',
              thumb: `/api/invoices/${inv.id}/thumbnail?v=${version}`,
            }}
          />
        )
      })}
    </div>
  )
}
