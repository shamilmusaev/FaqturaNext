import type { DraftLine } from '@/features/invoices/preview-data'
import type { SwedishVatRate } from '@/features/invoices/vat'
import { type AiLine, AiLineSchema } from './schema'

/** Cap on how many lines a single Magic Fill run may apply to the form. */
export const MAX_APPLIED_LINES = 50

/**
 * Convert a model-produced line into the form's DraftLine. This is the trust
 * boundary where kronor become bigint öre — `Math.round` guards fractional öre
 * from float drift, and the unit is narrowed back to the form's vocabulary.
 */
export function aiLineToDraftLine(line: AiLine): DraftLine {
  const unit = line.unit === 'h' || line.unit === 'st' ? line.unit : ''
  return {
    description: line.description.trim(),
    quantity: line.quantity,
    unit,
    unitPriceCents: BigInt(Math.round(line.unitPrice * 100)),
    vatRate: line.vatRate as SwedishVatRate,
    discountPercent: line.discountPercent,
  }
}

/**
 * Parse a streamed/partial array of unknown objects, keeping only the elements
 * that already satisfy the schema. Partial objects still mid-stream are simply
 * skipped until they complete, so the dialog can render a growing valid list.
 */
export function parsePartialLines(raw: unknown): AiLine[] {
  if (!Array.isArray(raw)) return []
  const lines: AiLine[] = []
  for (const item of raw) {
    const parsed = AiLineSchema.safeParse(item)
    if (parsed.success) lines.push(parsed.data)
  }
  return lines
}
