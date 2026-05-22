import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })
  it('merges tailwind conflicts (later wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
