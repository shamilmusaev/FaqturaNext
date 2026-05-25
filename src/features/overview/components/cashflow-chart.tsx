import { formatMoney } from '@/lib/money'
import { getLocale, getTranslations } from 'next-intl/server'
import type { CashflowBucket } from '../queries'
import { type CashflowPeriod, CashflowPeriodSelector } from './cashflow-period-selector'

function formatShortK(value: number): string {
  const k = Math.round(value / 1000)
  return `${k}k`
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
  // max is in cents — convert to major units for label.
  const maxMajor = maxN / 100
  const gridLevels = [1, 0.75, 0.5, 0.25, 0]

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <div className="text-2xl font-semibold tracking-tight tnum mt-1">
            {formatMoney(total, currency)}
            <span className="ml-2 text-sm text-ink/60 font-normal">
              {t('subtitle', { months })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs text-ink/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              {t('paid')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink" />
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

      <div className="relative h-48 pr-10">
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
              {lvl === 0 ? '0' : formatShortK(maxMajor * lvl)}
            </span>
          ))}
        </div>

        <div className="relative flex items-end gap-3 h-full px-1">
          {buckets.map((b) => {
            const paidH = Math.round((Number(b.paidCents) / maxN) * 100)
            const outH = Math.round((Number(b.outstandingCents) / maxN) * 100)
            const monthLabel = monthFormatter.format(new Date(`${b.month}-01T00:00:00Z`))
            return (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div
                    className="w-2.5 max-w-[12px] bg-brand rounded-t-md transition-all"
                    style={{ height: `${paidH}%` }}
                    title={`${t('paid')}: ${formatMoney(b.paidCents, currency)}`}
                  />
                  <div
                    className="w-2.5 max-w-[12px] bg-ink rounded-t-md transition-all"
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
