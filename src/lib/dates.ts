export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start)
  let added = 0
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

export function isOverdue(dueAt: string, today = new Date()): boolean {
  const due = new Date(dueAt)
  const t = new Date(today.toISOString().slice(0, 10))
  return due.getTime() < t.getTime()
}

export function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatDateLong(d: Date, locale = 'sv-SE'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    d,
  )
}
