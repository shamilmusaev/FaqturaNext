'use client'

import { cn } from '@/lib/cn'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export type CashflowPeriod = '6mo' | '12mo' | 'ytd'

const PERIODS: CashflowPeriod[] = ['6mo', '12mo', 'ytd']

export function CashflowPeriodSelector({
  current,
  labels,
}: {
  current: CashflowPeriod
  labels: Record<CashflowPeriod, string>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function select(period: CashflowPeriod) {
    const params = new URLSearchParams(searchParams.toString())
    if (period === '6mo') params.delete('cashflowPeriod')
    else params.set('cashflowPeriod', period)
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `?${qs}` : '?', { scroll: false })
    })
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 bg-paper-2 rounded-full p-1 text-xs',
        isPending && 'opacity-70',
      )}
      role="tablist"
      aria-label="Cashflow period"
    >
      {PERIODS.map((p) => {
        const active = p === current
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(p)}
            className={cn(
              'h-7 px-3 rounded-full font-medium transition-colors',
              active ? 'bg-card text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {labels[p]}
          </button>
        )
      })}
    </div>
  )
}
