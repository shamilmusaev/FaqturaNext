import { describe, it, expect } from 'vitest'
import { formatMoney, parseMoney, addCents } from '@/lib/money'

describe('formatMoney', () => {
  it('formats SEK with non-breaking thousand separator and comma decimal', () => {
    expect(formatMoney(123450, 'SEK', 'sv-SE')).toMatch(/1\s234,50/)
    expect(formatMoney(123450, 'SEK', 'sv-SE')).toContain('kr')
  })
  it('formats zero', () => {
    expect(formatMoney(0, 'SEK', 'sv-SE')).toMatch(/0,00/)
  })
  it('formats EUR with EN locale', () => {
    expect(formatMoney(123450, 'EUR', 'en-GB')).toContain('€')
    expect(formatMoney(123450, 'EUR', 'en-GB')).toContain('1,234.50')
  })
})

describe('parseMoney', () => {
  it('parses sv-SE format', () => {
    expect(parseMoney('1 234,50', 'sv-SE')).toBe(123450)
    expect(parseMoney('0,00', 'sv-SE')).toBe(0)
  })
  it('rejects garbage', () => {
    expect(() => parseMoney('abc', 'sv-SE')).toThrow()
  })
})

describe('addCents', () => {
  it('sums an array', () => {
    expect(addCents([100, 200, 50])).toBe(350)
  })
})
