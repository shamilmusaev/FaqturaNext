'use client'

import { useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  return (
    <select
      value={current}
      aria-label="Language"
      className="h-9 bg-card border border-line-1 rounded-[12px] px-2 text-sm"
      onChange={e => {
        document.cookie = `locale=${e.target.value}; path=/; max-age=31536000`
        router.refresh()
      }}
    >
      {locales.map(l => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  )
}
