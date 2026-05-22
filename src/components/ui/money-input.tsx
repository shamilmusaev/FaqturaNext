'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { parseMoney } from '@/lib/money'
import { Input } from './input'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  defaultValueCents?: number
  onValueChange?: (cents: number) => void
  locale?: string
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ defaultValueCents, onValueChange, locale = 'sv-SE', ...props }, ref) => {
    const [text, setText] = useState(
      defaultValueCents != null ? (defaultValueCents / 100).toLocaleString(locale, { minimumFractionDigits: 2 }) : '',
    )
    return (
      <Input
        ref={ref}
        inputMode="decimal"
        className="tnum text-right font-mono"
        value={text}
        onChange={e => {
          const v = e.target.value
          setText(v)
          if (!v) return onValueChange?.(0)
          try { onValueChange?.(parseMoney(v, locale)) } catch { /* ignore until valid */ }
        }}
        {...props}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
