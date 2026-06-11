import {
  type InvoiceDraft,
  type PreviewClient,
  type PreviewOrganization,
  buildPreviewData,
} from '@/features/invoices/preview-data'
import { describe, expect, it } from 'vitest'

const org: PreviewOrganization = { name: 'Acme AB', currency_default: 'SEK' }
const client: PreviewClient = { name: 'Client AB', address: { city: 'Stockholm' } }

function draft(lines: InvoiceDraft['lines']): InvoiceDraft {
  return { issuedAt: '2026-06-01', dueAt: '2026-07-01', currency: 'SEK', notes: '', lines }
}

describe('buildPreviewData', () => {
  it('computes totals from renderable lines', () => {
    const data = buildPreviewData(
      draft([{ description: 'Work', quantity: 2, unit: 'h', unitPriceCents: 10000n, vatRate: 25 }]),
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

  it('drops empty lines (no description and zero price)', () => {
    const data = buildPreviewData(
      draft([
        { description: 'Real', quantity: 1, unit: '', unitPriceCents: 5000n, vatRate: 25 },
        { description: '', quantity: 1, unit: '', unitPriceCents: 0n, vatRate: 25 },
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
      draft([{ description: '', quantity: 1, unit: '', unitPriceCents: 1000n, vatRate: 25 }]),
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

  it('passes the number label and notes through', () => {
    const d = draft([{ description: 'X', quantity: 1, unit: '', unitPriceCents: 100n, vatRate: 0 }])
    d.notes = '  thanks  '
    const data = buildPreviewData(d, org, client, 'INV-2026-0001')
    expect(data.number).toBe('INV-2026-0001')
    expect(data.notes).toBe('thanks')
  })
})
