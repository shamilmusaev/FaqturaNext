// Backwards-compatible entry point. The invoice document is now a registry of
// templates under ./templates; `InvoiceDocument` aliases the default (modern)
// template so existing importers keep working. New code should prefer
// `getTemplate(id)` from '@/lib/pdf/templates'.
import { ModernTemplate } from './templates/modern'

export type { InvoicePdfData } from './templates/types'
export const InvoiceDocument = ModernTemplate
