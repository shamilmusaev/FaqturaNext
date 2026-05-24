import { formatMoney } from '@/lib/money'
import { getTranslations } from 'next-intl/server'
import type { CashflowBucket } from '../queries'

export async function CashflowChart({
  buckets,
  currency,
}: {
  buckets: CashflowBucket[]
  currency: 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'
}) {
  const t = await getTranslations('overview.cashflow')

  const total = buckets.reduce((s, b) => s + b.paidCents, 0n)
  const max = buckets.reduce((m, b) => {
    const v = b.paidCents > b.outstandingCents ? b.paidCents : b.outstandingCents
    return v > m ? v : m
  }, 0n)
  const maxN = max === 0n ? 1 : Number(max)
  const months = buckets.length

  return (
    <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <div className="text-2xl font-semibold tracking-tight tnum mt-1">
            {formatMoney(total, currency)}
            <span className="ml-2 text-sm text-ink/60 font-normal">{t('subtitle', { months })}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            {t('paid')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            {t('outstanding')}
          </span>
        </div>
      </header>

      <div className="flex items-end gap-3 h-44 px-1">
        {buckets.map((b) => {
          const paidH = Math.round((Number(b.paidCents) / maxN) * 100)
          const outH = Math.round((Number(b.outstandingCents) / maxN) * 100)
          const monthLabel = new Date(`${b.month}-01T00:00:00Z`).toLocaleString('en-US', {
            month: 'short',
            timeZone: 'UTC',
          })
          return (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="flex-1 w-full flex items-end gap-1">
                <div
                  className="flex-1 bg-brand rounded-t-sm transition-all"
                  style={{ height: `${paidH}%` }}
                  title={`${t('paid')}: ${formatMoney(b.paidCents, currency)}`}
                />
                <div
                  className="flex-1 bg-ink rounded-t-sm transition-all"
                  style={{ height: `${outH}%` }}
                  title={`${t('outstanding')}: ${formatMoney(b.outstandingCents, currency)}`}
                />
              </div>
              <span className="text-xs text-ink/50">{monthLabel}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
