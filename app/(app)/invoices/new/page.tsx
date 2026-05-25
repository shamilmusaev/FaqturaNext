import { listActiveClientOptions } from '@/features/clients/queries'
import { InvoiceForm } from '@/features/invoices/components/invoice-form'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function NewInvoicePage() {
  const [t, clients] = await Promise.all([getTranslations('invoices'), listActiveClientOptions()])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newInvoice')}</h1>
      {clients.length === 0 ? (
        <p className="text-ink/60">{t('errors.needClientFirst')}</p>
      ) : (
        <InvoiceForm clients={clients} cancelHref={'/invoices' as Route} />
      )}
    </div>
  )
}
