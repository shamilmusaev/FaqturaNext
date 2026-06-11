import { listClients } from '@/features/clients/queries'
import { InvoiceEditor } from '@/features/invoices/components/invoice-editor'
import type { EditorClient, PreviewOrganization } from '@/features/invoices/preview-data'
import { getCurrentOrganization } from '@/features/settings/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

type Address = EditorClient['address']

export default async function NewInvoicePage() {
  const [t, clients, org] = await Promise.all([
    getTranslations('invoices'),
    listClients(),
    getCurrentOrganization(),
  ])

  const editorClients: EditorClient[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    org_number: c.org_number,
    vat_number: c.vat_number,
    address: (c.address as Address) ?? null,
  }))

  const previewOrg: PreviewOrganization = {
    name: org.name,
    org_number: org.org_number,
    vat_number: org.vat_number,
    address: org.address,
    iban: org.iban,
    bankgiro: org.bankgiro,
    plusgiro: org.plusgiro,
    swish_number: org.swish_number,
    logo_url: org.logo_url,
    currency_default: org.currency,
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newInvoice')}</h1>
      {editorClients.length === 0 ? (
        <p className="text-ink/60">{t('errors.needClientFirst')}</p>
      ) : (
        <InvoiceEditor clients={editorClients} org={previewOrg} cancelHref={'/invoices' as Route} />
      )}
    </div>
  )
}
