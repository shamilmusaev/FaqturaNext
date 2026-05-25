import { listClients } from '@/features/clients/queries'
import { InvoiceDrawer } from '@/features/invoices/components/invoice-drawer'
import { InvoiceForm } from '@/features/invoices/components/invoice-form'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function NewInvoiceModal() {
  const t = await getTranslations('invoices')
  const clients = await listClients({ includeArchived: false })

  return (
    <InvoiceDrawer title={t('newInvoice')}>
      {clients.length === 0 ? (
        <p className="text-ink/60">{t('errors.needClientFirst')}</p>
      ) : (
        <InvoiceForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          cancelHref={'/invoices' as Route}
        />
      )}
    </InvoiceDrawer>
  )
}
