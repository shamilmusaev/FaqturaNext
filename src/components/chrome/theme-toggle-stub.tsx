'use client'

import { MoonIcon, SunIcon } from '@/components/ui/icons'
import { useEffect, useState } from 'react'

const COOKIE_NAME = 'theme-preference'

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match?.split('=')[1]
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return
  // 1 year
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export function ThemeToggleStub() {
  const [pref, setPref] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = readCookie(COOKIE_NAME)
    if (stored === 'light' || stored === 'dark') setPref(stored)
  }, [])

  function select(next: 'light' | 'dark') {
    setPref(next)
    writeCookie(COOKIE_NAME, next)
  }

  return (
    <div className="mb-3 flex flex-col gap-0.5 rounded-full border border-line-1 bg-card p-1">
      <button
        type="button"
        aria-label="Light theme"
        aria-pressed={pref === 'light'}
        onClick={() => select('light')}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-ink text-brand"
      >
        <SunIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        disabled
        title="Dark theme coming soon"
        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-ink-3 opacity-40 cursor-not-allowed"
      >
        <MoonIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
