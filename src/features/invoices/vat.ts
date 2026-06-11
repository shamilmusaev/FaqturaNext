export type SwedishVatRate = 0 | 6 | 12 | 25

export interface LineItemInput {
  quantity: number
  unitPriceCents: bigint
  vatRate: SwedishVatRate | number
  /** Per-line discount in percent (0..100). Defaults to 0. */
  discountPercent?: number
}

export interface LineItemTotals {
  amountCents: bigint
  vatCents: bigint
}

export interface InvoiceTotals {
  subtotalCents: bigint
  vatCents: bigint
  totalCents: bigint
}

export interface InvoiceTotalsOptions {
  /** Omvänd skattskyldighet — no VAT is charged when true. */
  reverseVat?: boolean
  /** ROT/RUT deduction in öre, subtracted from the amount due. */
  rotRutCents?: bigint
}

/**
 * Computes line amount and VAT. Skatteverket rule: round VAT per line to whole öre.
 * Quantity may be fractional; unit price is integer cents (öre). A per-line
 * discount reduces the amount before VAT.
 *
 * Mirrors the server-side math in supabase/migrations/0033 (faqtura create_invoice
 * + recompute_invoice_totals) so the live preview matches the persisted invoice.
 */
export function calcLineTotal(input: LineItemInput): LineItemTotals {
  const discount = input.discountPercent ?? 0
  // amount = quantity × unit_price × (1 - discount/100), rounded to whole öre.
  const amount = BigInt(
    Math.round(input.quantity * Number(input.unitPriceCents) * (1 - discount / 100)),
  )
  // VAT = round(amount × rate / 100)
  const vat = BigInt(Math.round((Number(amount) * input.vatRate) / 100))
  return { amountCents: amount, vatCents: vat }
}

export function calcInvoiceTotals(
  lines: LineItemInput[],
  opts: InvoiceTotalsOptions = {},
): InvoiceTotals {
  let subtotal = 0n
  let vat = 0n
  for (const line of lines) {
    const t = calcLineTotal(line)
    subtotal += t.amountCents
    vat += t.vatCents
  }
  if (opts.reverseVat) vat = 0n
  const rotRut = opts.rotRutCents ?? 0n
  return { subtotalCents: subtotal, vatCents: vat, totalCents: subtotal + vat - rotRut }
}
