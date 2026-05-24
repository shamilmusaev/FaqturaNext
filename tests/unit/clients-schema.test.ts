import { describe, expect, it } from 'vitest'
import { ClientInputSchema } from '@/features/clients/schema'

describe('ClientInputSchema', () => {
  it('requires name', () => {
    expect(ClientInputSchema.safeParse({ name: '' }).success).toBe(false)
    expect(ClientInputSchema.safeParse({ name: 'Acme AB' }).success).toBe(true)
  })
  it('email is optional but must be valid when present', () => {
    expect(ClientInputSchema.safeParse({ name: 'A', email: '' }).success).toBe(true)
    expect(ClientInputSchema.safeParse({ name: 'A', email: 'not-an-email' }).success).toBe(false)
    expect(ClientInputSchema.safeParse({ name: 'A', email: 'a@b.se' }).success).toBe(true)
  })
  it('accepts nested address with optional parts', () => {
    expect(
      ClientInputSchema.safeParse({
        name: 'Acme AB',
        address: { street: 'Storgatan 1', city: 'Stockholm' },
      }).success,
    ).toBe(true)
  })
  it('caps name length', () => {
    expect(ClientInputSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false)
  })
})
