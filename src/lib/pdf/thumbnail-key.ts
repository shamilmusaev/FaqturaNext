import { createHash } from 'node:crypto'

// Lightweight cache-key helpers, kept free of the heavy react-pdf / pdf-to-img
// imports so the invoices list (server component) can build thumbnail URLs
// without pulling the rasterizer into its bundle.

export const THUMBNAIL_BUCKET = 'invoice-thumbnails'

/**
 * Cache-busting version derived from everything that changes the rendered look.
 * `updated_at` covers content edits (update_invoice bumps it); `template` covers
 * a template switch even if it doesn't touch updated_at.
 */
export function thumbnailVersion(invoice: { updated_at: string; template: string }): string {
  return createHash('sha1')
    .update(`${invoice.updated_at}|${invoice.template}`)
    .digest('hex')
    .slice(0, 12)
}

/** Storage object key: "<org>/<invoice>-<version>.png". */
export function thumbnailKey(orgId: string, invoiceId: string, version: string): string {
  return `${orgId}/${invoiceId}-${version}.png`
}
