import type { InvoiceStatus } from './schema'

type Tone = 'neutral' | 'pos' | 'warn' | 'neg' | 'brand' | 'info'

/** Status → Chip colour tone. Shared by the server chip and the client card. */
export const STATUS_TONE: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  sent: 'brand',
  paid: 'pos',
  overdue: 'neg',
  cancelled: 'neutral',
}
