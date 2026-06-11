import { generateOcrReference } from '@/features/invoices/ocr'
import { describe, expect, it } from 'vitest'

describe('generateOcrReference', () => {
  it('matches the SQL faqtura_ocr output', () => {
    // Cross-checked against the live faqtura_ocr() function in 0033.
    expect(generateOcrReference('INV-2026-0042')).toBe('202600425')
    expect(generateOcrReference('1')).toBe('000000018')
    expect(generateOcrReference('INV-2026-0001')).toBe('202600011')
  })
  it('strips non-digits and left-pads to 8 before the check digit', () => {
    expect(generateOcrReference('INV-2026-0042')).toHaveLength(9)
  })
  it('returns null when there are no digits', () => {
    expect(generateOcrReference('—')).toBeNull()
    expect(generateOcrReference('')).toBeNull()
  })
})
