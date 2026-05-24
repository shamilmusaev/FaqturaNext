import { describe, expect, it } from 'vitest'
import { greetingKey, nameFromEmail } from '@/features/overview/utils'

describe('greetingKey', () => {
  it('morning before noon', () => {
    expect(greetingKey(new Date('2026-05-24T09:00:00'))).toBe('goodMorning')
  })
  it('afternoon between 12 and 18', () => {
    expect(greetingKey(new Date('2026-05-24T14:00:00'))).toBe('goodAfternoon')
  })
  it('evening after 18', () => {
    expect(greetingKey(new Date('2026-05-24T20:00:00'))).toBe('goodEvening')
  })
})

describe('nameFromEmail', () => {
  it('takes the local part before @', () => {
    expect(nameFromEmail('shamil@example.com')).toBe('Shamil')
  })
  it('replaces dot/underscore/hyphen with space and capitalises the first token', () => {
    expect(nameFromEmail('shamil.musaev@x.io')).toBe('Shamil')
    expect(nameFromEmail('shamil_lorsan@x.io')).toBe('Shamil')
    expect(nameFromEmail('elin-karlsson@x.io')).toBe('Elin')
  })
  it('falls back to empty string on bad input', () => {
    expect(nameFromEmail('@x.com')).toBe('')
  })
})
