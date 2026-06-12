import 'server-only'
import { type PdfOrgRow, invoiceToPdfData } from '@/features/invoices/pdf-data'
import type { InvoiceDetail } from '@/features/invoices/queries'
import { getTemplate } from '@/lib/pdf/templates'
import { renderToBuffer } from '@react-pdf/renderer'
import { pdf } from 'pdf-to-img'

export {
  THUMBNAIL_BUCKET,
  orgBrandingVersion,
  thumbnailKey,
  thumbnailVersion,
} from './thumbnail-key'

/** Render the invoice to a PDF and rasterize its first page to a PNG buffer. */
export async function renderInvoiceThumbnail(
  invoice: InvoiceDetail,
  org: PdfOrgRow,
): Promise<Buffer> {
  const { Component } = getTemplate(invoice.template)
  const pdfBuffer = await renderToBuffer(Component({ invoice: invoiceToPdfData(invoice, org) }))
  const doc = await pdf(Buffer.from(pdfBuffer), { scale: 1.5 })
  return doc.getPage(1)
}
