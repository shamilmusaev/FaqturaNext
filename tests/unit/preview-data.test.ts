import {
  type DraftLine,
  type InvoiceDraft,
  type PreviewClient,
  type PreviewOrganization,
  buildPreviewData,
} from '@/features/invoices/preview-data'
import { describe, expect, it } from 'vitest'

const org: PreviewOrganization = { name: 'Acme AB', currency_default: 'SEK' }
const client: PreviewClient = { name: 'Client AB', address: { city: 'Stockholm' } }

function line(partial: Partial<DraftLine>): DraftLine {
  return {
    description: '',
    quantity: 1,
    unit: '',
    unitPriceCents: 0n,
    vatRate: 25,
    discountPercent: 0,
    ...partial,
  }
}

function draft(lines: DraftLine[], overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    issuedAt: '2026-06-01',
    dueAt: '2026-07-01',
    deliveryAt: '',
    currency: 'SEK',
    notes: '',
    hideOcr: false,
    number: '',
    lines,
    reverseVat: false,
    rotRutType: null,
    rotRutCents: 0n,
    ourReference: '',
    theirReference: '',
    orderNumber: '',
    ...overrides,
  }
}

describe('buildPreviewData', () => {
  it('computes totals from renderable lines', () => {
    const data = buildPreviewData(
      draft([line({ description: 'Work', quantity: 2, unit: 'h', unitPriceCents: 10000n })]),
      org,
      client,
      '—',
    )
    expect(data.subtotalCents).toBe(20000n)
    expect(data.vatCents).toBe(5000n)
    expect(data.totalCents).toBe(25000n)
    expect(data.lineItems).toHaveLength(1)
    expect(data.lineItems[0]?.amountCents).toBe(20000n)
  })

  it('passes a set delivery date through and nulls a blank one', () => {
    const withDate = buildPreviewData(
      draft([line({ description: 'Work', unitPriceCents: 5000n })], { deliveryAt: '2026-06-15' }),
      org,
      client,
      '—',
    )
    expect(withDate.deliveryAt).toBe('2026-06-15')

    const blank = buildPreviewData(
      draft([line({ description: 'Work', unitPriceCents: 5000n })], { deliveryAt: '  ' }),
      org,
      client,
      '—',
    )
    expect(blank.deliveryAt).toBeNull()
  })

  it('omits the OCR reference when hideOcr is set', () => {
    const shown = buildPreviewData(
      draft([line({ description: 'Work', unitPriceCents: 5000n })]),
      org,
      client,
      'INV-2026-0001',
    )
    expect(shown.ocrReference).toBeTruthy()

    const hidden = buildPreviewData(
      draft([line({ description: 'Work', unitPriceCents: 5000n })], { hideOcr: true }),
      org,
      client,
      'INV-2026-0001',
    )
    expect(hidden.ocrReference).toBeNull()
  })

  it('drops empty lines (no description and zero price)', () => {
    const data = buildPreviewData(
      draft([
        line({ description: 'Real', unitPriceCents: 5000n }),
        line({ description: '', unitPriceCents: 0n }),
      ]),
      org,
      client,
      '—',
    )
    expect(data.lineItems).toHaveLength(1)
    expect(data.lineItems[0]?.description).toBe('Real')
  })

  it('keeps a priced line even without a description', () => {
    const data = buildPreviewData(
      draft([line({ description: '', unitPriceCents: 1000n })]),
      org,
      client,
      '—',
    )
    expect(data.lineItems).toHaveLength(1)
    expect(data.lineItems[0]?.description).toBe('—')
  })

  it('falls back to a placeholder client name when none selected', () => {
    const data = buildPreviewData(draft([]), org, null, '—')
    expect(data.client.name).toBe('—')
    expect(data.lineItems).toHaveLength(0)
  })

  it('passes the number label and notes through, and derives OCR', () => {
    const data = buildPreviewData(
      draft([line({ description: 'X', unitPriceCents: 100n, vatRate: 0 })], {
        notes: '  thanks  ',
      }),
      org,
      client,
      'INV-2026-0001',
    )
    expect(data.number).toBe('INV-2026-0001')
    expect(data.notes).toBe('thanks')
    expect(data.ocrReference).toBe('202600011')
  })

  it('reflects reverse VAT and ROT/RUT in totals and metadata', () => {
    const lines = [
      line({ description: 'A', quantity: 2, unitPriceCents: 10000n }),
      line({ description: 'B', unitPriceCents: 10000n, discountPercent: 10 }),
    ]
    const reverse = buildPreviewData(draft(lines, { reverseVat: true }), org, client, '—')
    expect([reverse.subtotalCents, reverse.vatCents, reverse.totalCents]).toEqual([
      29000n,
      0n,
      29000n,
    ])
    expect(reverse.reverseVat).toBe(true)

    const rot = buildPreviewData(
      draft(lines, { rotRutType: 'ROT', rotRutCents: 5000n }),
      org,
      client,
      '—',
    )
    expect(rot.totalCents).toBe(31250n)
    expect(rot.rotRut).toEqual({ type: 'ROT', cents: 5000n })
  })
})
