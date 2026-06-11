import { calcInvoiceTotals, calcLineTotal } from '@/features/invoices/vat'
import { describe, expect, it } from 'vitest'

describe('calcLineTotal', () => {
  it('computes amount and VAT for SEK 25%', () => {
    // 2 units × 100,00 kr = 200,00 kr; VAT 25% = 50,00 kr
    const r = calcLineTotal({ quantity: 2, unitPriceCents: 10000n, vatRate: 25 })
    expect(r.amountCents).toBe(20000n)
    expect(r.vatCents).toBe(5000n)
  })
  it('rounds VAT per Skatteverket rules (per line, to öre)', () => {
    // 1 × 33.33 kr (3333 öre) at 25% = 833.25 öre → rounded to 833
    const r = calcLineTotal({ quantity: 1, unitPriceCents: 3333n, vatRate: 25 })
    expect(r.amountCents).toBe(3333n)
    expect(r.vatCents).toBe(833n)
  })
  it('handles 0% VAT (exports)', () => {
    const r = calcLineTotal({ quantity: 1, unitPriceCents: 5000n, vatRate: 0 })
    expect(r.vatCents).toBe(0n)
  })
  it('handles fractional quantities', () => {
    const r = calcLineTotal({ quantity: 1.5, unitPriceCents: 10000n, vatRate: 25 })
    expect(r.amountCents).toBe(15000n)
    expect(r.vatCents).toBe(3750n)
  })
  it('applies a per-line discount before VAT', () => {
    // 1 × 100,00 kr, 10% off → 90,00 kr; VAT 25% = 22,50 kr
    const r = calcLineTotal({
      quantity: 1,
      unitPriceCents: 10000n,
      vatRate: 25,
      discountPercent: 10,
    })
    expect(r.amountCents).toBe(9000n)
    expect(r.vatCents).toBe(2250n)
  })
})

describe('calcInvoiceTotals', () => {
  it('sums multiple lines', () => {
    const totals = calcInvoiceTotals([
      { quantity: 2, unitPriceCents: 10000n, vatRate: 25 }, // 20000 + 5000
      { quantity: 1, unitPriceCents: 5000n, vatRate: 12 }, // 5000 + 600
    ])
    expect(totals.subtotalCents).toBe(25000n)
    expect(totals.vatCents).toBe(5600n)
    expect(totals.totalCents).toBe(30600n)
  })
  it('handles empty invoices', () => {
    const totals = calcInvoiceTotals([])
    expect(totals.subtotalCents).toBe(0n)
    expect(totals.vatCents).toBe(0n)
    expect(totals.totalCents).toBe(0n)
  })

  // These mirror the live-DB trigger test in 0033 (A-1/A-2/A-3) so client and
  // server math stay in lockstep.
  const swedishLines = [
    { quantity: 2, unitPriceCents: 10000n, vatRate: 25 }, // 20000 + 5000
    { quantity: 1, unitPriceCents: 10000n, vatRate: 25, discountPercent: 10 }, // 9000 + 2250
  ]
  it('matches server math for a normal invoice with a discount', () => {
    const t = calcInvoiceTotals(swedishLines)
    expect([t.subtotalCents, t.vatCents, t.totalCents]).toEqual([29000n, 7250n, 36250n])
  })
  it('zeroes VAT under reverse charge (omvänd moms)', () => {
    const t = calcInvoiceTotals(swedishLines, { reverseVat: true })
    expect([t.subtotalCents, t.vatCents, t.totalCents]).toEqual([29000n, 0n, 29000n])
  })
  it('subtracts the ROT/RUT deduction from the total', () => {
    const t = calcInvoiceTotals(swedishLines, { rotRutCents: 5000n })
    expect([t.subtotalCents, t.vatCents, t.totalCents]).toEqual([29000n, 7250n, 31250n])
  })
})
