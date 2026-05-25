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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="flex-1 relative">
        <span className="sr-only">{t('search')}</span>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
        <Input
          aria-label={t('search')}
          placeholder={t('search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 rounded-[14px] pl-9 text-sm"
        />
      </label>
      <label className="flex min-h-12 w-fit items-center gap-2 rounded-full border border-line-1 bg-card px-4 text-sm text-ink/70 transition-colors hover:bg-paper">
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
