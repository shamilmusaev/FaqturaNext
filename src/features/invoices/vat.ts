export type SwedishVatRate = 0 | 6 | 12 | 25

export interface LineItemInput {
  quantity: number
  unitPriceCents: bigint
  vatRate: SwedishVatRate | number
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

/**
 * Computes line amount and VAT. Skatteverket rule: round VAT per line to whole öre.
 * Quantity may be fractional; unit price is integer cents (öre).
 */
export function calcLineTotal(input: LineItemInput): LineItemTotals {
  // amount = quantity × unit_price. Quantity is number, unit price is bigint.
  // Multiply via number then convert: precision OK because amounts fit in safe int range.
  const amount = BigInt(Math.round(input.quantity * Number(input.unitPriceCents)))
  // VAT = round(amount × rate / 100)
  const vat = BigInt(Math.round((Number(amount) * input.vatRate) / 100))
  return { amountCents: amount, vatCents: vat }
}

export function calcInvoiceTotals(lines: LineItemInput[]): InvoiceTotals {
  let subtotal = 0n
  let vat = 0n
  for (const line of lines) {
    const t = calcLineTotal(line)
    subtotal += t.amountCents
    vat += t.vatCents
  }
  return { subtotalCents: subtotal, vatCents: vat, totalCents: subtotal + vat }
}
