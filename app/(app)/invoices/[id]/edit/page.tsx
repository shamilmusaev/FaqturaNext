import { listClients } from '@/features/clients/queries'
import { InvoiceEditor } from '@/features/invoices/components/invoice-editor'
import type {
  EditInvoiceInitial,
  EditorClient,
  PreviewOrganization,
} from '@/features/invoices/preview-data'
import { getInvoice } from '@/features/invoices/queries'
import { getCurrentOrganization } from '@/features/settings/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

type Address = EditorClient['address']

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params
  const [invoice, t, clients, org] = await Promise.all([
    getInvoice(id),
    getTranslations('invoices'),
    listClients(),
    getCurrentOrganization(),
  ])
  if (!invoice) notFound()
  if (invoice.status !== 'draft') {
    redirect(`/invoices/${id}` as Route)
  }

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
    bank_name: org.bank_name,
    logo_url: org.logo_url,
    currency_default: org.currency,
    invoice_number_template: org.invoice_number_template,
  }

  // Serializable snapshot (no bigint) handed to the client editor.
  const initial: EditInvoiceInitial = {
    invoiceId: invoice.id,
    clientId: invoice.client_id,
    issuedAt: invoice.issued_at,
    dueAt: invoice.due_at,
    deliveryAt: invoice.delivery_date,
    currency: invoice.currency,
    notes: invoice.notes,
    number: invoice.number,
    template: invoice.template,
    hideOcr: invoice.hide_ocr,
    reverseVat: invoice.reverse_vat,
    rotRutType: invoice.rot_rut_type,
    rotRutCents: invoice.rot_rut_cents,
    ourReference: invoice.our_reference,
    theirReference: invoice.their_reference,
    orderNumber: invoice.order_number,
    lines: invoice.line_items.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitPriceCents: li.unit_price_cents,
      vatRate: li.vat_rate,
      discountPercent: li.discount_percent,
    })),
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('edit')} · {invoice.number}
      </h1>
      <InvoiceEditor
        clients={editorClients}
        org={previewOrg}
        cancelHref={`/invoices/${id}` as Route}
        mode="edit"
        initial={initial}
      />
    </div>
  )
}
