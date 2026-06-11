'use client'

import { cn } from '@/lib/cn'
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
  const negative = big < 0n
  const abs = negative ? -big : big
  const whole = abs / 100n
  const fraction = (abs % 100n).toString().padStart(2, '0')
  const sep = (1.1).toLocaleString(locale).charAt(1)
  return `${negative ? '-' : ''}${Number(whole).toLocaleString(locale)}${sep}${fraction}`
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ defaultValueCents, onValueChange, locale = 'sv-SE', className, ...props }, ref) => {
    const [text, setText] = useState(defaultText(defaultValueCents, locale))
    return (
      <Input
        ref={ref}
        inputMode="decimal"
        className={cn('tnum text-right font-mono', className)}
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
