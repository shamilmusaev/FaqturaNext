import { listClients } from '@/features/clients/queries'
import { InvoiceForm } from '@/features/invoices/components/invoice-form'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function NewInvoicePage() {
  const t = await getTranslations('invoices')
  const clients = await listClients({ includeArchived: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newInvoice')}</h1>
      {clients.length === 0 ? (
        <p className="text-ink/60">You need at least one client to create an invoice.</p>
      ) : (
        <InvoiceForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          cancelHref={'/invoices' as Route}
        />
      )}
    </div>
  )
}
