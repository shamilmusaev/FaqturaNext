import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => {
    const messages = (await import('@/i18n/messages/en.json')).default as Record<string, unknown>
    return (key: string) => {
      const path = `${ns}.${key}`.split('.')
      let acc: unknown = messages
      for (const part of path) {
        if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
          acc = (acc as Record<string, unknown>)[part]
        } else {
          return key
        }
      }
      return typeof acc === 'string' ? acc : key
    }
  },
}))

import { ClientList } from '@/features/clients/components/client-list'
import type { ClientRow } from '@/features/clients/queries'

function makeClient(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: 'c1',
    organization_id: 'org1',
    name: 'Acme AB',
    email: null,
    org_number: null,
    vat_number: null,
    address: null,
    notes: null,
    archived_at: null,
    created_at: '2026-05-24T00:00:00Z',
    updated_at: '2026-05-24T00:00:00Z',
    ...overrides,
  }
}

describe('ClientList', () => {
  it('renders client names', async () => {
    const element = await ClientList({
      clients: [makeClient({ name: 'Acme AB' }), makeClient({ id: 'c2', name: 'Visby Bakery' })],
    })
    render(element)
    expect(screen.getAllByText('Acme AB').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Visby Bakery').length).toBeGreaterThan(0)
  })
  it('shows email when present', async () => {
    const element = await ClientList({
      clients: [makeClient({ name: 'Acme', email: 'hello@acme.se' })],
    })
    render(element)
    expect(screen.getAllByText('hello@acme.se').length).toBeGreaterThan(0)
  })
  it('shows Archived chip for archived clients', async () => {
    const element = await ClientList({
      clients: [makeClient({ name: 'Old Co', archived_at: '2026-01-01T00:00:00Z' })],
    })
    render(element)
    expect(screen.getAllByText('Archived').length).toBeGreaterThan(0)
  })
})
