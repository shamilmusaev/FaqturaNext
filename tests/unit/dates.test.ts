import { describe, it, expect } from 'vitest'
import { addBusinessDays, isOverdue, formatDateISO, formatDateLong } from '@/lib/dates'

describe('addBusinessDays', () => {
  it('skips weekends', () => {
    expect(addBusinessDays(new Date('2026-05-22'), 1)).toEqual(new Date('2026-05-25'))
  })
  it('adds zero days', () => {
    expect(addBusinessDays(new Date('2026-05-22'), 0)).toEqual(new Date('2026-05-22'))
  })
})

describe('isOverdue', () => {
  it('returns true when due_at is before today', () => {
    expect(isOverdue('2020-01-01', new Date('2026-05-22'))).toBe(true)
  })
  it('returns false on the due date itself', () => {
    expect(isOverdue('2026-05-22', new Date('2026-05-22'))).toBe(false)
  })
})

describe('formatDateISO', () => {
  it('returns YYYY-MM-DD', () => {
    expect(formatDateISO(new Date('2026-05-22'))).toBe('2026-05-22')
  })
})

describe('formatDateLong', () => {
  it('formats sv-SE', () => {
    expect(formatDateLong(new Date('2026-05-22'), 'sv-SE')).toMatch(/22 maj 2026/)
  })
})
