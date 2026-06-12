import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the auth + supabase boundaries so we can assert the delete query is
// scoped to drafts only.
const { query, storageRemove } = vi.hoisted(() => {
  const q = {
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    select: vi.fn(),
  }
  q.delete.mockReturnValue(q)
  q.eq.mockReturnValue(q)
  q.in.mockReturnValue(q)
  q.select.mockResolvedValue({ data: [{ id: 'inv-1' }], error: null })
  const storageRemove = vi.fn().mockResolvedValue({ data: [], error: null })
  return { query: q, storageRemove }
})

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ organizationId: 'org-1', userId: 'u1' }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => query),
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: storageRemove,
      })),
    },
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { deleteInvoiceAction } from '@/features/invoices/actions'

beforeEach(() => {
  query.eq.mockClear()
  query.select.mockClear()
})

describe('deleteInvoiceAction', () => {
  it('scopes the delete to drafts in the org', async () => {
    const res = await deleteInvoiceAction('inv-1')
    expect(res).toEqual({})
    expect(query.delete).toHaveBeenCalled()
    expect(query.eq).toHaveBeenCalledWith('id', 'inv-1')
    expect(query.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(query.eq).toHaveBeenCalledWith('status', 'draft')
  })

  it('returns an error when nothing was deleted (non-draft)', async () => {
    query.select.mockResolvedValueOnce({ data: [], error: null })
    const res = await deleteInvoiceAction('inv-1')
    expect(res.error).toBeTruthy()
  })
})
