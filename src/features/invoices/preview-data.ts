import type { InvoicePdfData } from '@/lib/pdf/templates'
import { generateOcrReference } from './ocr'
import type { RotRutType } from './schema'
import { type SwedishVatRate, calcInvoiceTotals, calcLineTotal } from './vat'

// Client-side draft shapes shared by the form and the live preview. These mirror
// the editor's local state; `buildPreviewData` maps them into the same
// `InvoicePdfData` the server feeds to react-pdf, so preview === downloaded PDF.

export interface DraftLine {
  description: string
  quantity: number
  unit: string
  unitPriceCents: bigint
  vatRate: SwedishVatRate
  discountPercent: number
}

export interface InvoiceDraft {
  issuedAt: string
  dueAt: string
  currency: string
  notes: string
  lines: DraftLine[]
  /** Manual invoice number; blank means auto-generated on save. */
  number: string
  // Swedish invoice fields (Phase 2).
  reverseVat: boolean
  rotRutType: RotRutType | null
  rotRutCents: bigint
  ourReference: string
  theirReference: string
  orderNumber: string
}

/** Draft emitted by the form, including the selected client id. */
export interface FormDraft extends InvoiceDraft {
  clientId: string
}

type Address = { street?: string; postal?: string; city?: string; country?: string } | null

export interface PreviewOrganization {
  name: string
  org_number?: string | null
  vat_number?: string | null
  address?: Address
  iban?: string | null
  bankgiro?: string | null
  plusgiro?: string | null
  swish_number?: string | null
  logo_url?: string | null
  /** Org's default invoice currency, used to seed the form. */
  currency_default?: string | null
  /** Number template like "INV-{YYYY}-{NNNN}", for the read-only number preview. */
  invoice_number_template?: string | null
}

export interface PreviewClient {
  name: string
  email?: string | null
  org_number?: string | null
  vat_number?: string | null
  address?: Address
}

/** Client passed to the editor: preview fields plus the id used by the form. */
export interface EditorClient extends PreviewClient {
  id: string
}

/**
 * Build the react-pdf payload from the editor's live draft state. Pure and
 * synchronous so it can run on every (debounced) keystroke in the browser.
 * Lines with no description are dropped so the preview matches what would
 * actually be persisted.
 */
export function buildPreviewData(
  draft: InvoiceDraft,
  org: PreviewOrganization,
  client: PreviewClient | null,
  numberLabel: string,
): InvoicePdfData {
  const renderableLines = draft.lines.filter((l) => l.description.trim() || l.unitPriceCents > 0n)
  const totals = calcInvoiceTotals(
    renderableLines.map((l) => ({
      quantity: Number(l.quantity) || 0,
      unitPriceCents: l.unitPriceCents,
      vatRate: l.vatRate,
      discountPercent: l.discountPercent,
    })),
    { reverseVat: draft.reverseVat, rotRutCents: draft.rotRutCents },
  )

  const num = draft.number.trim() || numberLabel
  return {
    number: num,
    issuedAt: draft.issuedAt,
    dueAt: draft.dueAt,
    currency: draft.currency,
    subtotalCents: totals.subtotalCents,
    vatCents: totals.vatCents,
    totalCents: totals.totalCents,
    notes: draft.notes.trim() || null,
    // OCR is assigned server-side from the final number; in the live preview we
    // derive it from the (placeholder) label, which yields null until saved.
    ocrReference: generateOcrReference(num),
    reverseVat: draft.reverseVat,
    rotRut:
      draft.rotRutType && draft.rotRutCents > 0n
        ? { type: draft.rotRutType, cents: draft.rotRutCents }
        : null,
    ourReference: draft.ourReference.trim() || null,
    theirReference: draft.theirReference.trim() || null,
    orderNumber: draft.orderNumber.trim() || null,
    organization: {
      name: org.name,
      org_number: org.org_number ?? null,
      vat_number: org.vat_number ?? null,
      address: org.address ?? null,
      iban: org.iban ?? null,
      bankgiro: org.bankgiro ?? null,
      plusgiro: org.plusgiro ?? null,
      swish_number: org.swish_number ?? null,
      logo_url: org.logo_url ?? null,
    },
    client: {
      name: client?.name ?? '—',
      email: client?.email ?? null,
      org_number: client?.org_number ?? null,
      vat_number: client?.vat_number ?? null,
      address: client?.address ?? null,
    },
    lineItems: renderableLines.map((l) => {
      const { amountCents } = calcLineTotal({
        quantity: Number(l.quantity) || 0,
        unitPriceCents: l.unitPriceCents,
        vatRate: l.vatRate,
        discountPercent: l.discountPercent,
      })
      return {
        description: l.description.trim() || '—',
        quantity: Number(l.quantity) || 0,
        unit: l.unit.trim() || null,
        unitPriceCents: l.unitPriceCents,
        vatRate: l.vatRate,
        amountCents,
        discountPercent: l.discountPercent || 0,
      }
    }),
  }
}
