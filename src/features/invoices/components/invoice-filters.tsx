'use client'

import { SearchIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue'] as const
type StatusKey = (typeof STATUSES)[number]

export function InvoiceFilters() {
  const t = useTranslations('invoices')
  const tFilters = useTranslations('invoices.filters')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, start] = useTransition()
  const current = (params.get('status') as StatusKey) || 'all'

  const setStatus = (s: StatusKey) => {
    const next = new URLSearchParams(params)
    if (s === 'all') next.delete('status')
    else next.set('status', s)
    start(() => {
      router.replace(`${pathname}?${next.toString()}` as Route)
    })
  }

  const setSearch = (v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set('q', v)
    else next.delete('q')
    start(() => {
      router.replace(`${pathname}?${next.toString()}` as Route)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="relative">
        <span className="sr-only">{t('search')}</span>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
        <Input
          aria-label={t('search')}
          placeholder={t('search')}
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'h-9 px-3 rounded-full text-sm border transition-colors min-h-9',
              current === s
                ? 'bg-ink text-white border-ink'
                : 'bg-card text-ink border-line-1 hover:bg-paper',
            )}
          >
            {tFilters(s)}
          </button>
        ))}
      </div>
    </div>
  )
}
