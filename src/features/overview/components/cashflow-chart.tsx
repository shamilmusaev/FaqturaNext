import { AnimatedMoney } from '@/components/ui/animated-number'
import { formatMoney } from '@/lib/money'
import { getLocale, getTranslations } from 'next-intl/server'
import type { CashflowBucket } from '../queries'
import { type CashflowPeriod, CashflowPeriodSelector } from './cashflow-period-selector'

const SYMBOL: Record<'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK', string> = {
  SEK: 'kr',
  EUR: '€',
  USD: '$',
  NOK: 'kr',
  DKK: 'kr',
}

function formatShortK(value: number, currency: 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'): string {
  const k = Math.round(value / 1000)
  const sym = SYMBOL[currency]
  if (currency === 'EUR' || currency === 'USD') return `${sym} ${k}k`
  return `${k}k ${sym}`
}

export async function CashflowChart({
  buckets,
  currency,
  period,
}: {
  buckets: CashflowBucket[]
  currency: 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'
  period: CashflowPeriod
}) {
  const t = await getTranslations('overview.cashflow')
  const tPeriods = await getTranslations('overview.cashflow.periods')
  const locale = await getLocale()

  const total = buckets.reduce((s, b) => s + b.paidCents, 0n)
  const max = buckets.reduce((m, b) => {
    const v = b.paidCents > b.outstandingCents ? b.paidCents : b.outstandingCents
    return v > m ? v : m
  }, 0n)
  const maxN = max === 0n ? 1 : Number(max)
  const months = buckets.length

  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone: 'UTC',
  })

  // Gridline values (from top → bottom): 100/75/50/25/0% of max.
  // max is in cents; convert to major units for label.
  const maxMajor = maxN / 100
  const gridLevels = [1, 0.75, 0.5, 0.25, 0]

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex min-h-[320px] flex-col gap-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[13px] font-medium text-ink-2">{t('title')}</h2>
          <div className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.1] tnum mt-1">
            <AnimatedMoney cents={Number(total)} currency={currency} delay={0.15} />
            <span className="ml-2 text-base text-ink-3 font-normal tracking-normal">
              {t('subtitle', { months })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
              {t('paid')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-ink" />
              {t('outstanding')}
            </span>
          </div>
          <CashflowPeriodSelector
            current={period}
            labels={{
              '6mo': tPeriods('6mo'),
              '12mo': tPeriods('12mo'),
              ytd: tPeriods('ytd'),
            }}
          />
        </div>
      </header>

      <div className="relative mt-2 h-[200px] pr-10">
        {/* Gridlines */}
        <div className="absolute inset-0 pr-10 pointer-events-none">
          {gridLevels.map((lvl) => (
            <div
              key={lvl}
              className="absolute left-0 right-10 border-t border-dashed border-line-1"
              style={{ top: `${(1 - lvl) * 100}%` }}
            />
          ))}
        </div>
        {/* Value labels on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none">
          {gridLevels.map((lvl) => (
            <span
              key={lvl}
              className="absolute right-0 text-[10px] text-ink-3 tnum -translate-y-1/2"
              style={{ top: `${(1 - lvl) * 100}%` }}
            >
              {lvl === 0 ? '0' : formatShortK(maxMajor * lvl, currency)}
            </span>
          ))}
        </div>

        <div className="relative flex items-end gap-2 h-full px-1">
          {buckets.map((b) => {
            const paidH = Math.round((Number(b.paidCents) / maxN) * 100)
            const outH = Math.round((Number(b.outstandingCents) / maxN) * 100)
            const monthLabel = monthFormatter.format(new Date(`${b.month}-01T00:00:00Z`))
            return (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div
                    className="w-4 max-w-4 bg-brand rounded-t-md transition-all"
                    style={{ height: `${paidH}%` }}
                    title={`${t('paid')}: ${formatMoney(b.paidCents, currency)}`}
                  />
                  <div
                    className="w-4 max-w-4 bg-ink rounded-t-md transition-all"
                    style={{ height: `${outH}%` }}
                    title={`${t('outstanding')}: ${formatMoney(b.outstandingCents, currency)}`}
                  />
                </div>
                <span className="text-xs text-ink/50">{monthLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
