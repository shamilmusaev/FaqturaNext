// @vitest-environment node
import { INVOICE_TEMPLATES, type InvoicePdfData, getTemplate } from '@/lib/pdf/templates'
import { renderToBuffer } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'

const sample: InvoicePdfData = {
  number: 'INV-2026-0001',
  issuedAt: '2026-06-01',
  dueAt: '2026-07-01',
  currency: 'SEK',
  subtotalCents: 20000n,
  vatCents: 5000n,
  totalCents: 25000n,
  notes: 'Tack för ditt förtroende',
  organization: {
    name: 'Acme AB',
    org_number: '556677-8899',
    vat_number: 'SE556677889901',
    address: { street: 'Storgatan 1', postal: '111 22', city: 'Stockholm', country: 'Sverige' },
    iban: 'SE35 5000 0000 0549 1000 0003',
    bankgiro: '123-4567',
    plusgiro: '12 34 56-7',
    swish_number: '1231231231',
  },
  client: {
    name: 'Client AB',
    org_number: '551122-3344',
    address: { street: 'Kungsgatan 2', postal: '222 33', city: 'Göteborg' },
  },
  lineItems: [
    {
      description: 'Consulting',
      quantity: 2,
      unit: 'h',
      unitPriceCents: 10000n,
      vatRate: 25,
      amountCents: 20000n,
    },
  ],
}

describe('invoice templates', () => {
  it('every registered template renders to a non-empty PDF', async () => {
    for (const tpl of INVOICE_TEMPLATES) {
      const buffer = await renderToBuffer(tpl.Component({ invoice: sample }))
      expect(buffer.length).toBeGreaterThan(0)
      // PDF files start with the "%PDF" magic bytes.
      expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF')
    }
  })

  it('getTemplate falls back to the default for unknown ids', () => {
    expect(getTemplate('does-not-exist').id).toBe('modern')
    expect(getTemplate(null).id).toBe('modern')
    expect(getTemplate('classic').id).toBe('classic')
  })
})
