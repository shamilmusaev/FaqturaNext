import { addCents, formatMoney, parseMoney } from '@/lib/money'
import { describe, expect, it } from 'vitest'

describe('formatMoney', () => {
  it('formats SEK with non-breaking thousand separator and comma decimal', () => {
    expect(formatMoney(123450n, 'SEK', 'sv-SE')).toMatch(/1\s234,50/)
    expect(formatMoney(123450n, 'SEK', 'sv-SE')).toContain('kr')
  })
  it('formats zero', () => {
    expect(formatMoney(0n, 'SEK', 'sv-SE')).toMatch(/0,00/)
  })
  it('formats EUR with EN locale', () => {
    expect(formatMoney(123450n, 'EUR', 'en-GB')).toContain('€')
    expect(formatMoney(123450n, 'EUR', 'en-GB')).toContain('1,234.50')
  })
  it('still accepts integer number for ergonomic call sites', () => {
    expect(formatMoney(123450, 'SEK', 'sv-SE')).toContain('kr')
  })
  it('rejects non-integer number', () => {
    expect(() => formatMoney(1.5, 'SEK')).toThrow()
  })
})

describe('parseMoney', () => {
  it('parses sv-SE format into bigint cents', () => {
    expect(parseMoney('1 234,50', 'sv-SE')).toBe(123450n)
    expect(parseMoney('0,00', 'sv-SE')).toBe(0n)
  })
  it('rejects garbage', () => {
    expect(() => parseMoney('abc', 'sv-SE')).toThrow()
  })
})

describe('addCents', () => {
  it('sums an array of bigints', () => {
    expect(addCents([100n, 200n, 50n])).toBe(350n)
  })
  it('accepts mixed bigint and integer number inputs', () => {
    expect(addCents([100n, 200, 50n])).toBe(350n)
  })
  it('handles sums larger than Number.MAX_SAFE_INTEGER exactly', () => {
    const huge = 9_007_199_254_740_993n
    expect(addCents([huge, huge])).toBe(huge + huge)
  })
})
