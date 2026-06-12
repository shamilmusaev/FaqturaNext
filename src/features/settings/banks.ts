// Swedish banks offered as a dropdown for the organization's payment details.
// The selection is only an input convenience — the chosen name (or free text via
// "Other") is stored verbatim in organizations.bank_name.
export const SWEDISH_BANKS = [
  'Swedbank',
  'Handelsbanken',
  'SEB',
  'Nordea',
  'Länsförsäkringar Bank',
  'Danske Bank',
  'ICA Banken',
  'SBAB',
  'Skandiabanken',
  'Avanza Bank',
  'Nordnet Bank',
  'Marginalen Bank',
  'Resurs Bank',
  'Forex Bank',
  'Ålandsbanken',
  'Sparbanken Syd',
] as const

export type SwedishBank = (typeof SWEDISH_BANKS)[number]

export function isKnownBank(value: string): value is SwedishBank {
  return (SWEDISH_BANKS as readonly string[]).includes(value)
}

/**
 * Decide the initial dropdown state for a stored bank name.
 * - empty       → nothing selected, no custom text
 * - known bank  → that option selected, no custom text
 * - anything else → "Other" selected with the value as custom text
 */
export function initialBankSelection(stored: string | null | undefined): {
  isOther: boolean
  selected: string
  custom: string
} {
  const value = (stored ?? '').trim()
  if (!value) return { isOther: false, selected: '', custom: '' }
  if (isKnownBank(value)) return { isOther: false, selected: value, custom: '' }
  return { isOther: true, selected: '__other__', custom: value }
}
