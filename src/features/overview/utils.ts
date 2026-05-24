export function greetingKey(
  date: Date = new Date(),
): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const h = date.getHours()
  if (h < 12) return 'goodMorning'
  if (h < 18) return 'goodAfternoon'
  return 'goodEvening'
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const guess =
    local
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(' ')[0] ?? ''
  if (!guess) return ''
  return guess.charAt(0).toUpperCase() + guess.slice(1)
}

export function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
