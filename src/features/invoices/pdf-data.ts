import 'server-only'
import type { InvoicePdfData } from '@/lib/pdf/templates'
import type { Database } from '@/lib/supabase/database.types'
import type { InvoiceDetail } from './queries'

export type PdfOrgRow = Pick<
  Database['public']['Tables']['organizations']['Row'],
  | 'name'
  | 'org_number'
  | 'vat_number'
  | 'address'
  | 'iban'
  | 'bankgiro'
  | 'plusgiro'
  | 'swish_number'
  | 'bank_name'
  | 'logo_url'
>

export const PDF_ORG_COLUMNS =
  'name, org_number, vat_number, address, iban, bankgiro, plusgiro, swish_number, bank_name, logo_url'

type Address = InvoicePdfData['organization']['address']

/**
 * Map a persisted invoice + organization into the shared react-pdf payload.
 * Single source used by both the PDF download route and the preview action, so
 * the downloaded file and the dialog preview never diverge.
 */
export function invoiceToPdfData(invoice: InvoiceDetail, org: PdfOrgRow): InvoicePdfData {
  return {
    // Drafts have no assigned number until sent; show a placeholder on the PDF.
    number: invoice.number ?? '—',
    issuedAt: invoice.issued_at,
    dueAt: invoice.due_at,
    deliveryAt: invoice.delivery_date,
    currency: invoice.currency,
    subtotalCents: BigInt(invoice.subtotal_cents),
    vatCents: BigInt(invoice.vat_cents),
    totalCents: BigInt(invoice.total_cents),
    notes: invoice.notes,
    ocrReference: invoice.hide_ocr ? null : invoice.ocr_reference,
    reverseVat: invoice.reverse_vat,
    rotRut:
      invoice.rot_rut_type && BigInt(invoice.rot_rut_cents) > 0n
        ? {
            type: invoice.rot_rut_type as 'ROT' | 'RUT',
            cents: BigInt(invoice.rot_rut_cents),
          }
        : null,
    ourReference: invoice.our_reference,
    theirReference: invoice.their_reference,
    orderNumber: invoice.order_number,
    organization: {
      name: org.name,
      org_number: org.org_number,
      vat_number: org.vat_number,
      address: (org.address as Address) ?? null,
      iban: org.iban,
      bankgiro: org.bankgiro,
      plusgiro: org.plusgiro,
      swish_number: org.swish_number,
      bank_name: org.bank_name,
      logo_url: org.logo_url,
    },
    client: {
      name: invoice.client?.name ?? 'N/A',
      email: invoice.client?.email ?? null,
      org_number: invoice.client?.org_number ?? null,
      vat_number: invoice.client?.vat_number ?? null,
      address: (invoice.client?.address as Address) ?? null,
    },
    lineItems: invoice.line_items.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unit: li.unit,
      unitPriceCents: BigInt(li.unit_price_cents),
      vatRate: Number(li.vat_rate),
      amountCents: BigInt(li.amount_cents),
      discountPercent: Number(li.discount_percent ?? 0),
    })),
  }
}
