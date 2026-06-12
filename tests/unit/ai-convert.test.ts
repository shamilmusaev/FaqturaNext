import { aiLineToDraftLine, parsePartialLines } from '@/features/ai/convert'
import type { AiLine } from '@/features/ai/schema'
import { describe, expect, it } from 'vitest'

const base: AiLine = {
  description: 'Konsultation',
  quantity: 2,
  unit: 'h',
  unitPrice: 950,
  vatRate: 25,
  discountPercent: 0,
}

describe('aiLineToDraftLine', () => {
  it('converts kronor to bigint öre', () => {
    expect(aiLineToDraftLine(base).unitPriceCents).toBe(95000n)
  })

  it('rounds fractional öre without float drift', () => {
    expect(aiLineToDraftLine({ ...base, unitPrice: 950.5 }).unitPriceCents).toBe(95050n)
    expect(aiLineToDraftLine({ ...base, unitPrice: 0.1 }).unitPriceCents).toBe(10n)
  })

  it('keeps a zero price as 0n', () => {
    expect(aiLineToDraftLine({ ...base, unitPrice: 0 }).unitPriceCents).toBe(0n)
  })

  it('narrows unit to the form vocabulary', () => {
    expect(aiLineToDraftLine({ ...base, unit: 'h' }).unit).toBe('h')
    expect(aiLineToDraftLine({ ...base, unit: 'st' }).unit).toBe('st')
    expect(aiLineToDraftLine({ ...base, unit: 'hours' }).unit).toBe('')
  })

  it('trims the description', () => {
    expect(aiLineToDraftLine({ ...base, description: '  Måleri  ' }).description).toBe('Måleri')
  })
})

describe('parsePartialLines', () => {
  it('returns [] for non-arrays', () => {
    expect(parsePartialLines(undefined)).toEqual([])
    expect(parsePartialLines(null)).toEqual([])
    expect(parsePartialLines({})).toEqual([])
  })

  it('keeps valid elements and skips partial/invalid ones', () => {
    const raw = [base, { description: 'half typed' }, { ...base, vatRate: 99 }]
    const parsed = parsePartialLines(raw)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.description).toBe('Konsultation')
  })
})
