import { initialBankSelection, isKnownBank } from '@/features/settings/banks'
import { describe, expect, it } from 'vitest'

describe('initialBankSelection', () => {
  it('selects nothing for an empty / nullish value', () => {
    expect(initialBankSelection(null)).toEqual({ isOther: false, selected: '', custom: '' })
    expect(initialBankSelection('')).toEqual({ isOther: false, selected: '', custom: '' })
    expect(initialBankSelection('   ')).toEqual({ isOther: false, selected: '', custom: '' })
  })

  it('selects the matching option for a known bank', () => {
    expect(initialBankSelection('Swedbank')).toEqual({
      isOther: false,
      selected: 'Swedbank',
      custom: '',
    })
  })

  it('falls back to Other + custom text for an unknown bank', () => {
    expect(initialBankSelection('Min Lokala Bank')).toEqual({
      isOther: true,
      selected: '__other__',
      custom: 'Min Lokala Bank',
    })
  })
})

describe('isKnownBank', () => {
  it('recognises listed banks and rejects others', () => {
    expect(isKnownBank('Nordea')).toBe(true)
    expect(isKnownBank('Totally Made Up Bank')).toBe(false)
  })
})
