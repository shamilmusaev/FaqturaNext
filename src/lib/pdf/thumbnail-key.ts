import { createHash } from 'node:crypto'

// Lightweight cache-key helpers, kept free of the heavy react-pdf / pdf-to-img
// imports so the invoices list (server component) can build thumbnail URLs
// without pulling the rasterizer into its bundle.

export const THUMBNAIL_BUCKET = 'invoice-thumbnails'

// Org-level fields that change how every invoice PDF renders (logo, payment
// details, address...). Their hash feeds the thumbnail version so editing org
// branding invalidates all cached thumbnails — invoice.updated_at alone misses
// this since it doesn't change on org edits.
const ORG_BRANDING_FIELDS = [
  'name',
  'org_number',
  'vat_number',
  'address',
  'iban',
  'bankgiro',
  'plusgiro',
  'swish_number',
  'bank_name',
  'logo_url',
] as const

export function orgBrandingVersion(org: Record<string, unknown>): string {
  const subset = ORG_BRANDING_FIELDS.map((f) => org[f] ?? null)
  return createHash('sha1').update(JSON.stringify(subset)).digest('hex').slice(0, 8)
}

/**
 * Cache-busting version for an invoice thumbnail. Combines the invoice's own
 * content (`updated_at`, `template`) with the org branding version so both
 * invoice edits and org-branding edits invalidate the cached PNG.
 */
export function thumbnailVersion(
  invoice: { updated_at: string; template: string },
  orgVersion: string,
): string {
  return createHash('sha1')
    .update(`${invoice.updated_at}|${invoice.template}|${orgVersion}`)
    .digest('hex')
    .slice(0, 12)
}

/** Storage object key: "<org>/<invoice>-<version>.png". */
export function thumbnailKey(orgId: string, invoiceId: string, version: string): string {
  return `${orgId}/${invoiceId}-${version}.png`
}
