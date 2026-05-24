import { describe, expect, it } from 'vitest'
import { calcLineTotal, calcInvoiceTotals } from '@/features/invoices/vat'

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
})

describe('calcInvoiceTotals', () => {
  it('sums multiple lines', () => {
    const totals = calcInvoiceTotals([
      { quantity: 2, unitPriceCents: 10000n, vatRate: 25 }, // 20000 + 5000
      { quantity: 1, unitPriceCents: 5000n, vatRate: 12 },  // 5000 + 600
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
})
