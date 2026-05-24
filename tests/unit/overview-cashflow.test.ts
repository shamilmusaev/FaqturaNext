import { describe, expect, it } from 'vitest'
import { addMonthsUTC, monthKey, startOfMonthUTC } from '@/features/overview/utils'

describe('startOfMonthUTC', () => {
  it('returns UTC 1st of the same month', () => {
    expect(startOfMonthUTC(new Date('2026-05-24T18:30:00Z'))).toEqual(
      new Date('2026-05-01T00:00:00Z'),
    )
  })
})

describe('addMonthsUTC', () => {
  it('subtracts months correctly across year boundary', () => {
    expect(addMonthsUTC(new Date('2026-01-01T00:00:00Z'), -2)).toEqual(
      new Date('2025-11-01T00:00:00Z'),
    )
  })
  it('adds months correctly across year boundary', () => {
    expect(addMonthsUTC(new Date('2025-11-01T00:00:00Z'), 3)).toEqual(
      new Date('2026-02-01T00:00:00Z'),
    )
  })
})

describe('monthKey', () => {
  it('formats as YYYY-MM with leading zero', () => {
    expect(monthKey(new Date('2026-03-01T00:00:00Z'))).toBe('2026-03')
    expect(monthKey(new Date('2026-12-01T00:00:00Z'))).toBe('2026-12')
  })
})
