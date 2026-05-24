'use client'

import { setLocaleAction } from '@/i18n/actions'
import { type Locale, locales } from '@/i18n/config'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  const [, start] = useTransition()
  return (
    <select
      value={current}
      aria-label="Language"
      className="h-9 bg-card border border-line-1 rounded-[12px] px-2 text-sm"
      onChange={(e) => {
        const next = e.target.value
        start(async () => {
          await setLocaleAction(next)
          router.refresh()
        })
      }}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
