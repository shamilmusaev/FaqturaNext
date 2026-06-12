import { beforeEach, describe, expect, it, vi } from 'vitest'

// The settings actions reach Supabase + auth (both `server-only`). Mock those
// boundaries so we can assert the exact payload sent to the `update_organization`
// RPC for a given form submission.

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn().mockResolvedValue({ error: null }) }))

vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ organizationId: 'org-1', role: 'owner' }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({ rpc }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateCompanyAction, updatePaymentAction } from '@/features/settings/actions'

function form(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

beforeEach(() => rpc.mockClear())

// The second arg of the last rpc(...) call is the RPC payload. Typed loosely so
// tests can read p_* keys without a non-null assertion.
function lastPayload(): Record<string, unknown> {
  return (rpc.mock.lastCall?.[1] ?? {}) as Record<string, unknown>
}

describe('updatePaymentAction — clearing a field', () => {
  it('sends an empty string (not null) so coalesce(p_iban, iban) actually clears it', async () => {
    const result = await updatePaymentAction(
      {},
      form({ bank_name: '', iban: '', bankgiro: '', plusgiro: '', swish_number: '' }),
    )

    expect(result).toEqual({ ok: true })
    expect(rpc).toHaveBeenCalledTimes(1)
    const payload = lastPayload()
    // The RPC coalesces nulls (null = "keep old value"), so a cleared field must
    // be sent as '' to actually wipe it.
    expect(payload.p_bank_name).toBe('')
    expect(payload.p_iban).toBe('')
    expect(payload.p_bankgiro).toBe('')
    expect(payload.p_plusgiro).toBe('')
    expect(payload.p_swish_number).toBe('')
  })

  it('still persists entered values verbatim', async () => {
    await updatePaymentAction(
      {},
      form({ bank_name: 'Swedbank', iban: 'SE35 5000', bankgiro: '5050-1055' }),
    )
    const payload = lastPayload()
    expect(payload.p_bank_name).toBe('Swedbank')
    expect(payload.p_iban).toBe('SE35 5000')
    expect(payload.p_bankgiro).toBe('5050-1055')
  })
})

describe('updateCompanyAction — clearing optional fields', () => {
  it('sends empty strings for cleared org_number / vat_number', async () => {
    await updateCompanyAction({}, form({ name: 'Acme AB', org_number: '', vat_number: '' }))
    const payload = lastPayload()
    expect(payload.p_name).toBe('Acme AB')
    expect(payload.p_org_number).toBe('')
    expect(payload.p_vat_number).toBe('')
  })
})
