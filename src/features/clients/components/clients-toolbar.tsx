'use client'

import { SearchIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'

export function ClientsToolbar() {
  const t = useTranslations('clients')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [, startTransition] = useTransition()

  const push = useCallback(
    (next: URLSearchParams) => {
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}` as Route)
      })
    },
    [pathname, router],
  )

  const onSearchChange = (v: string) => {
    setSearch(v)
    const next = new URLSearchParams(params)
    if (v) next.set('q', v)
    else next.delete('q')
    push(next)
  }

  const onArchivedToggle = (checked: boolean) => {
    const next = new URLSearchParams(params)
    if (checked) next.set('archived', '1')
    else next.delete('archived')
    push(next)
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <label className="flex-1 relative">
        <span className="sr-only">{t('search')}</span>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
        <Input
          aria-label={t('search')}
          placeholder={t('search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={params.get('archived') === '1'}
          onChange={(e) => onArchivedToggle(e.target.checked)}
          className="accent-brand"
        />
        {t('showArchived')}
      </label>
    </div>
  )
}
