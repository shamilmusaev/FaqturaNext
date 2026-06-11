/**
 * Swedish OCR payment reference: the digits of the invoice number, left-padded
 * to 8, with a Luhn (mod-10) check digit appended. Mirrors the SQL faqtura_ocr
 * function in supabase/migrations/0033 so the preview matches the persisted OCR.
 *
 * Returns null when the number has no digits (e.g. a placeholder draft number).
 */
export function generateOcrReference(invoiceNumber: string): string | null {
  const base = invoiceNumber.replace(/\D/g, '')
  if (base.length === 0) return null
  const padded = base.padStart(8, '0')
  let sum = 0
  let alternate = true
  for (let i = padded.length - 1; i >= 0; i--) {
    let n = Number(padded[i])
    if (alternate) {
      n *= 2
      if (n > 9) n = (n % 10) + 1
    }
    sum += n
    alternate = !alternate
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return `${padded}${checkDigit}`
}
