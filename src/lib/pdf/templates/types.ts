// Shared data shape consumed by every invoice template. Templates are pure
// @react-pdf components rendering this data, so the live preview (client) and
// the downloaded PDF (server) stay byte-for-byte identical.

export type { TemplateId } from './ids'

export interface InvoicePdfData {
  number: string
  issuedAt: string
  dueAt: string
  currency: string
  subtotalCents: bigint | number
  vatCents: bigint | number
  totalCents: bigint | number
  notes?: string | null
  // Swedish invoice fields (Phase 2).
  ocrReference?: string | null
  reverseVat?: boolean
  rotRut?: { type: 'ROT' | 'RUT'; cents: bigint | number } | null
  ourReference?: string | null
  theirReference?: string | null
  orderNumber?: string | null
  organization: {
    name: string
    org_number?: string | null
    vat_number?: string | null
    address?: { street?: string; postal?: string; city?: string; country?: string } | null
    iban?: string | null
    bankgiro?: string | null
    plusgiro?: string | null
    swish_number?: string | null
    logo_url?: string | null
  }
  client: {
    name: string
    email?: string | null
    org_number?: string | null
    vat_number?: string | null
    address?: { street?: string; postal?: string; city?: string; country?: string } | null
  }
  lineItems: Array<{
    description: string
    quantity: number
    unit?: string | null
    unitPriceCents: bigint | number
    vatRate: number
    amountCents: bigint | number
    discountPercent?: number
  }>
}

export interface InvoiceTemplateProps {
  invoice: InvoicePdfData
}
