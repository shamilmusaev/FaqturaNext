import {
  InvoiceInputSchema,
  InvoiceStatusEnum,
  LineItemInputSchema,
} from '@/features/invoices/schema'
import { describe, expect, it } from 'vitest'

describe('LineItemInputSchema', () => {
  it('requires non-empty description', () => {
    const r = LineItemInputSchema.safeParse({
      description: '',
      quantity: 1,
      unitPriceCents: 1000n,
      vatRate: 25,
    })
    expect(r.success).toBe(false)
  })
  it('requires positive quantity', () => {
    const r = LineItemInputSchema.safeParse({
      description: 'Hour',
      quantity: 0,
      unitPriceCents: 1000n,
      vatRate: 25,
    })
    expect(r.success).toBe(false)
  })
  it('rejects negative unit price', () => {
    const r = LineItemInputSchema.safeParse({
      description: 'Hour',
      quantity: 1,
      unitPriceCents: -1n,
      vatRate: 25,
    })
    expect(r.success).toBe(false)
  })
  it('only allows Swedish VAT rates 0/6/12/25', () => {
    for (const rate of [0, 6, 12, 25] as const) {
      expect(
        LineItemInputSchema.safeParse({
          description: 'x',
          quantity: 1,
          unitPriceCents: 100n,
          vatRate: rate,
        }).success,
      ).toBe(true)
    }
    expect(
      LineItemInputSchema.safeParse({
        description: 'x',
        quantity: 1,
        unitPriceCents: 100n,
        vatRate: 20,
      }).success,
    ).toBe(false)
  })
})

describe('InvoiceInputSchema', () => {
  const baseLine = {
    description: 'Consulting',
    quantity: 1,
    unitPriceCents: 100000n,
    vatRate: 25 as const,
  }

  const VALID_UUID = '11111111-1111-4111-8111-111111111111'

  it('accepts a valid input', () => {
    const r = InvoiceInputSchema.safeParse({
      clientId: VALID_UUID,
      dueAt: '2026-06-30',
      currency: 'SEK',
      lineItems: [baseLine],
    })
    expect(r.success).toBe(true)
  })
  it('requires at least one line item', () => {
    const r = InvoiceInputSchema.safeParse({
      clientId: VALID_UUID,
      dueAt: '2026-06-30',
      lineItems: [],
    })
    expect(r.success).toBe(false)
  })
  it('rejects non-uuid clientId', () => {
    const r = InvoiceInputSchema.safeParse({
      clientId: 'not-a-uuid',
      dueAt: '2026-06-30',
      lineItems: [baseLine],
    })
    expect(r.success).toBe(false)
  })
  it('rejects malformed date', () => {
    const r = InvoiceInputSchema.safeParse({
      clientId: VALID_UUID,
      dueAt: '30-06-2026',
      lineItems: [baseLine],
    })
    expect(r.success).toBe(false)
  })
  it('rejects non-alphabetic currency codes', () => {
    const base = {
      clientId: VALID_UUID,
      dueAt: '2026-06-30',
      lineItems: [baseLine],
    }
    expect(InvoiceInputSchema.safeParse({ ...base, currency: 'US1' }).success).toBe(false)
    expect(InvoiceInputSchema.safeParse({ ...base, currency: 'sek' }).success).toBe(false)
    expect(InvoiceInputSchema.safeParse({ ...base, currency: 'SEK' }).success).toBe(true)
  })
})

describe('InvoiceStatusEnum', () => {
  it('lists exactly the spec statuses', () => {
    expect(InvoiceStatusEnum.options).toEqual(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  })
})
