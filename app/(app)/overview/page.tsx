import { AnimatedMoney, AnimatedNumber } from '@/components/ui/animated-number'
import { Button } from '@/components/ui/button'
import { DownloadIcon } from '@/components/ui/icons'
import { listActiveClientOptions } from '@/features/clients/queries'
import { CashflowChart } from '@/features/overview/components/cashflow-chart'
import { DueThisWeek } from '@/features/overview/components/due-this-week'
import { NewInvoiceDialogButton } from '@/features/invoices/components/new-invoice-dialog'
import { InvoiceCountBadge } from '@/features/overview/components/invoice-count-badge'
import { QuickSend } from '@/features/overview/components/quick-send'
import { RecentActivity } from '@/features/overview/components/recent-activity'
import { StatCard } from '@/features/overview/components/stat-card'
import { getOverviewData } from '@/features/overview/queries'
import { greetingKey, nameFromEmail } from '@/features/overview/utils'
import { requireUser } from '@/lib/auth'
import { formatMoney } from '@/lib/money'
import { getTranslations } from 'next-intl/server'

type CashflowPeriod = '6mo' | '12mo' | 'ytd'

function periodToMonths(period: CashflowPeriod): number {
  if (period === '12mo') return 12
  if (period === 'ytd') return new Date().getUTCMonth() + 1
  return 6
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ cashflowPeriod?: CashflowPeriod }>
}) {
  const t = await getTranslations('overview')
  const tMetrics = await getTranslations('overview.metrics')

  const sp = await searchParams
  const period: CashflowPeriod =
    sp.cashflowPeriod === '12mo' || sp.cashflowPeriod === 'ytd' ? sp.cashflowPeriod : '6mo'
  const months = periodToMonths(period)

  const { email, displayName } = await requireUser()
  const [{ metrics, cashflow, due, activity }, clientOptions] = await Promise.all([
    getOverviewData(months, 8),
    listActiveClientOptions(),
  ])

  const currency = 'SEK' as const
  // Prefer the user's display_name (first word for the greeting), fall back to email-derived
  const greeted = displayName?.trim().split(/\s+/)[0] || nameFromEmail(email)
  const greeting = `${t(greetingKey())}${greeted ? `, ${greeted}` : ''}`

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between flex-wrap gap-4 px-2 pt-2 pb-5">
        <h1 className="text-4xl md:text-[56px] font-semibold leading-[1.05] tracking-[-0.03em]">
          {greeting}
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" type="button">
            <DownloadIcon className="h-4 w-4" /> {t('export')}
          </Button>
          <NewInvoiceDialogButton clients={clientOptions} label={t('newInvoice')} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-4">
        <StatCard
          variant="hero"
          label={tMetrics('outstanding')}
          value={<AnimatedMoney cents={Number(metrics.outstanding.totalCents)} currency={currency} />}
          hint={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0">
                {metrics.outstanding.overdueCount > 0 ? (
                  <>
                    {metrics.outstanding.overdueCount} {tMetrics('overdueShort')} ·{' '}
                    {formatMoney(metrics.outstanding.overdueCents, currency)}
                  </>
                ) : null}
              </span>
              {metrics.outstanding.overdueCount > 0 ? (
                <button
                  type="button"
                  className="shrink-0 h-9 px-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 hover:bg-white/25 text-sm font-medium text-white transition-colors"
                >
                  {tMetrics('sendReminders')} →
                </button>
              ) : null}
            </div>
          }
          trailing={<InvoiceCountBadge count={metrics.outstanding.count} />}
          className="lg:col-span-1"
        />
        <StatCard
          label={tMetrics('paidThisMonth')}
          value={
            <AnimatedMoney
              cents={Number(metrics.paidThisMonth.totalCents)}
              currency={currency}
              delay={0.1}
            />
          }
          hint={
            metrics.paidThisMonth.deltaVsLastMonthPct != null ? (
              <span>
                {metrics.paidThisMonth.deltaVsLastMonthPct >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(metrics.paidThisMonth.deltaVsLastMonthPct).toFixed(1)}%{' '}
                <span className="text-ink/40">{tMetrics('vsLastMonth')}</span>
              </span>
            ) : null
          }
        />
        <StatCard
          label={tMetrics('avgDaysToPay')}
          value={
            metrics.avgDaysToPay.days != null ? (
              <>
                <AnimatedNumber value={metrics.avgDaysToPay.days} decimals={1} delay={0.2} />
                <span className="text-2xl text-ink/60 ml-1">{tMetrics('days')}</span>
              </>
            ) : (
              'N/A'
            )
          }
        />
        <StatCard
          label={tMetrics('sentThisWeek')}
          value={<AnimatedNumber value={metrics.sentThisWeek.count} delay={0.3} />}
          hint={
            metrics.sentThisWeek.invoicedCents > 0n ? (
              <span>
                ↑ {formatMoney(metrics.sentThisWeek.invoicedCents, currency)}{' '}
                <span className="text-ink/40">{tMetrics('invoiced')}</span>
              </span>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div>
          <CashflowChart buckets={cashflow} currency={currency} period={period} />
        </div>
        <DueThisWeek summary={due} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div>
          <RecentActivity items={activity} />
        </div>
        <QuickSend />
      </div>
    </div>
  )
}
