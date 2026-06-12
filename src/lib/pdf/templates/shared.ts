import type { InvoicePdfData } from './types'

// Faqtura design tokens mirrored from src/styles/tokens.css. @react-pdf cannot
// read CSS variables, so the document palette is duplicated here as plain hex.
export const COLOR = {
  ink: '#14110D',
  ink2: '#5A554C',
  paper: '#EFEDE7',
  paper2: '#E5E2DA',
  card: '#FFFFFF',
  brand: '#EC5A2A',
  brandInk: '#FFFFFF',
  line: '#E2DED4',
  line2: '#CFCAC0',
  muted: '#666661',
}

/**
 * Money is bigint öre end-to-end. Format with space thousands + comma decimal
 * (Swedish locale) without relying on Intl, which @react-pdf's server runtime
 * formats inconsistently across environments.
 */
export function formatMoney(value: bigint | number, currency: string): string {
  const cents = typeof value === 'bigint' ? value : BigInt(Math.round(value))
  const sign = cents < 0n ? '-' : ''
  const abs = cents < 0n ? -cents : cents
  const whole = abs / 100n
  const frac = (abs % 100n).toString().padStart(2, '0')
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}${wholeStr},${frac} ${currency}`
}

export function addressLines(addr: InvoicePdfData['organization']['address']): string[] {
  if (!addr) return []
  return [addr.street, [addr.postal, addr.city].filter(Boolean).join(' '), addr.country].filter(
    (l): l is string => Boolean(l && l.length > 0),
  )
}

/** Whole days between two ISO date strings; null if either is unparseable. */
export function daysBetween(a: string, b: string): number | null {
  const d1 = new Date(a)
  const d2 = new Date(b)
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000)
}
