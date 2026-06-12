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

export function InvoiceFilters({ view: viewProp }: { view?: 'list' | 'cards' }) {
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

  // Cards is the default; the server resolves the effective view (param → cookie
  // → cards) and passes it in. The toggle persists the choice in a cookie.
  const view = viewProp ?? (params.get('view') === 'list' ? 'list' : 'cards')
  const setView = (v: 'list' | 'cards') => {
    document.cookie = `invoiceView=${v}; path=/; max-age=31536000; samesite=lax`
    const next = new URLSearchParams(params)
    if (v === 'list') next.set('view', 'list')
    else next.delete('view')
    const qs = next.toString()
    start(() => {
      router.replace((qs ? `${pathname}?${qs}` : pathname) as Route)
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
          className="h-12 rounded-[14px] pl-9 text-sm"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'min-h-10 rounded-full border px-4 text-sm transition-colors',
              current === s
                ? 'bg-ink text-white border-ink'
                : 'bg-card text-ink border-line-1 hover:bg-paper',
            )}
          >
            {tFilters(s)}
          </button>
        ))}
        <div className="ml-auto flex gap-1 rounded-full border border-line-1 bg-card p-1">
          <ViewButton
            active={view === 'list'}
            onClick={() => setView('list')}
            label={t('view.list')}
          >
            <ListIcon />
          </ViewButton>
          <ViewButton
            active={view === 'cards'}
            onClick={() => setView('cards')}
            label={t('view.cards')}
          >
            <CardsIcon />
          </ViewButton>
        </div>
      </div>
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
        active ? 'bg-ink text-white' : 'text-ink/55 hover:text-ink hover:bg-paper',
      )}
    >
      {children}
    </button>
  )
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function CardsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
