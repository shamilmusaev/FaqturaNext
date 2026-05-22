export type Currency = 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'

export function formatMoney(cents: number, currency: Currency = 'SEK', locale = 'sv-SE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseMoney(input: string, locale = 'sv-SE'): number {
  const decimalSep = (1.1).toLocaleString(locale).charAt(1)
  const cleaned = input.replace(/\s/g, '').replace(decimalSep === ',' ? /\./g : /,/g, '')
  const normalised = decimalSep === ',' ? cleaned.replace(',', '.') : cleaned
  const n = Number(normalised)
  if (!Number.isFinite(n)) throw new Error(`Cannot parse money: ${input}`)
  return Math.round(n * 100)
}

export function addCents(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0)
}
