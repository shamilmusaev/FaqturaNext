export type Currency = 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'

/**
 * Money lives as `bigint` cents (öre for SEK) end-to-end: DB columns are
 * `bigint`, server actions accept `bigint`, totals accumulate as `bigint`.
 * Helpers below accept `bigint | number` for ergonomic call sites but always
 * coerce to `bigint` for arithmetic to avoid float drift on large sums.
 */

function toBigIntCents(value: bigint | number): bigint {
  if (typeof value === 'bigint') return value
  if (!Number.isInteger(value)) {
    throw new TypeError(`money cents must be an integer, got ${value}`)
  }
  return BigInt(value)
}

export function formatMoney(
  cents: bigint | number,
  currency: Currency = 'SEK',
  locale = 'sv-SE',
): string {
  const big = toBigIntCents(cents)
  const whole = big / 100n
  const fraction = big < 0n ? -big % 100n : big % 100n
  // Intl.NumberFormat takes Number; convert via decimal string to keep precision
  // up to Number.MAX_SAFE_INTEGER / 100. For larger values, scale via parts.
  const decimal = `${whole.toString()}.${fraction.toString().padStart(2, '0')}`
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(decimal))
}

export function parseMoney(input: string, locale = 'sv-SE'): bigint {
  const decimalSep = (1.1).toLocaleString(locale).charAt(1)
  const cleaned = input.replace(/\s/g, '').replace(decimalSep === ',' ? /\./g : /,/g, '')
  const normalised = decimalSep === ',' ? cleaned.replace(',', '.') : cleaned
  if (!/^-?\d+(\.\d+)?$/.test(normalised)) {
    throw new Error(`Cannot parse money: ${input}`)
  }
  const [whole, fraction = ''] = normalised.split('.')
  if (fraction.length > 2) {
    throw new Error(`Cannot parse money: too many decimal places in "${input}"`)
  }
  const padded = `${fraction}00`.slice(0, 2)
  const sign = whole?.startsWith('-') ? -1n : 1n
  const wholeDigits = whole?.replace('-', '') ?? '0'
  return sign * (BigInt(wholeDigits) * 100n + BigInt(padded))
}

export function addCents(values: Array<bigint | number>): bigint {
  return values.reduce<bigint>((sum, v) => sum + toBigIntCents(v), 0n)
}
