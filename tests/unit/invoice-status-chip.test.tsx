import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => {
    const messages = (await import('@/i18n/messages/en.json')).default as Record<
      string,
      Record<string, string>
    >
    return (key: string) => messages[ns]?.[key] ?? key
  },
}))

import { InvoiceStatusChip } from '@/features/invoices/components/invoice-status-chip'

async function renderChip(
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
) {
  const element = await InvoiceStatusChip({ status })
  render(element)
}

describe('InvoiceStatusChip', () => {
  it('renders Swedish-brand text for draft', async () => {
    await renderChip('draft')
    expect(screen.getByText('Utkast')).toBeInTheDocument()
  })
  it('renders sent', async () => {
    await renderChip('sent')
    expect(screen.getByText('Faktura skickad')).toBeInTheDocument()
  })
  it('renders paid', async () => {
    await renderChip('paid')
    expect(screen.getByText('Betald')).toBeInTheDocument()
  })
  it('renders overdue', async () => {
    await renderChip('overdue')
    expect(screen.getByText('Förfallen')).toBeInTheDocument()
  })
  it('renders cancelled', async () => {
    await renderChip('cancelled')
    expect(screen.getByText('Avbruten')).toBeInTheDocument()
  })
})
