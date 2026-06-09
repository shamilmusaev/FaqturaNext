/**
 * Durations live as whole minutes (integers) end-to-end — DB columns are
 * `integer`, the UI shows H:MM. No decimals, ever (e.g. 2h30m = 150, shown as
 * "2:30"). Mirrors the bigint-cents discipline of `src/lib/money.ts`.
 */

/**
 * Parse a duration the user typed. Accepts "H:MM" (2:30 → 150), bare hours
 * ("2" → 120), or bare ":MM" (":45" → 45). Throws on anything malformed.
 */
export function parseHM(input: string): number {
  const raw = input.trim()
  if (!raw) throw new Error('Empty duration')

  if (raw.includes(':')) {
    const [h, m] = raw.split(':')
    const hours = h === '' ? 0 : Number(h)
    const mins = m === '' ? 0 : Number(m)
    if (!Number.isInteger(hours) || !Number.isInteger(mins) || hours < 0 || mins < 0 || mins > 59) {
      throw new Error(`Cannot parse duration: ${input}`)
    }
    return hours * 60 + mins
  }

  const hours = Number(raw)
  if (!Number.isInteger(hours) || hours < 0) {
    throw new Error(`Cannot parse duration: ${input}`)
  }
  return hours * 60
}

/**
 * Format minutes compactly: "2h 30m", "34h" (no ":00" when there are no
 * minutes), "50m". Hours can exceed 24. Empty is "0h".
 */
export function formatHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0 && m === 0) return '0h'
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  return parts.join(' ')
}

/** Earned value in cents = minutes / 60 × rate_cents, rounded half-up. */
export function earnedCents(minutes: number, rateCents: number): number {
  return Math.round((minutes * rateCents) / 60)
}

/**
 * Format an estimate range: "20-25h", or "5h" when min == max. Uses an ASCII
 * hyphen (no em dash). Returns "" when there's nothing to show.
 */
export function formatRange(min: number | null, max: number | null): string {
  const lo = min ?? max
  const hi = max ?? min
  if (lo == null || hi == null) return ''
  if (lo === hi) return formatHM(lo)
  return `${formatHM(lo)}-${formatHM(hi)}`
}

// Formats a YYYY-MM-DD entry date as "5 Jun". Parsed as UTC so the day never
// shifts across timezones.
export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(
    new Date(`${iso}T00:00:00Z`),
  )
}
