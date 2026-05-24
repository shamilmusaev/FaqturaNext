'use client'

import { parseMoney } from '@/lib/money'
import { type InputHTMLAttributes, forwardRef, useState } from 'react'
import { Input } from './input'

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  defaultValueCents?: bigint | number
  onValueChange?: (cents: bigint) => void
  locale?: string
}

function defaultText(value: bigint | number | undefined, locale: string): string {
  if (value == null) return ''
  const big = typeof value === 'bigint' ? value : BigInt(value)
  const whole = big / 100n
  const fraction = (big < 0n ? -big % 100n : big % 100n).toString().padStart(2, '0')
  return `${Number(whole).toLocaleString(locale)}${(1.1).toLocaleString(locale).charAt(1)}${fraction}`
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ defaultValueCents, onValueChange, locale = 'sv-SE', ...props }, ref) => {
    const [text, setText] = useState(defaultText(defaultValueCents, locale))
    return (
      <Input
        ref={ref}
        inputMode="decimal"
        className="tnum text-right font-mono"
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setText(v)
          if (!v) return onValueChange?.(0n)
          try {
            onValueChange?.(parseMoney(v, locale))
          } catch {
            /* ignore until valid */
          }
        }}
        {...props}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
