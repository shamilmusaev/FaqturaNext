import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { CashflowChart } from '@/features/overview/components/cashflow-chart'
import { DueThisWeek } from '@/features/overview/components/due-this-week'
import { QuickSend } from '@/features/overview/components/quick-send'
import { RecentActivity } from '@/features/overview/components/recent-activity'
import { StatCard } from '@/features/overview/components/stat-card'
import {
  getCashflow,
  getDueThisWeek,
  getOverviewMetrics,
  getRecentActivity,
} from '@/features/overview/queries'
import { requireUser } from '@/lib/auth'
import { formatMoney } from '@/lib/money'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

function greetingKey(date = new Date()): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const h = date.getHours()
  if (h < 12) return 'goodMorning'
  if (h < 18) return 'goodAfternoon'
  return 'goodEvening'
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const guess = local.replace(/[._-]+/g, ' ').trim().split(' ')[0] ?? ''
  if (!guess) return ''
  return guess.charAt(0).toUpperCase() + guess.slice(1)
}

export default async function OverviewPage() {
  const t = await getTranslations('overview')
  const tMetrics = await getTranslations('overview.metrics')

  const { email } = await requireUser()
  const [metrics, cashflow, due, activity] = await Promise.all([
    getOverviewMetrics(),
    getCashflow(6),
    getDueThisWeek(),
    getRecentActivity(8),
  ])

  const currency: 'SEK' = 'SEK'
  const greeted = nameFromEmail(email)
  const greeting = `${t(greetingKey())}${greeted ? `, ${greeted}` : ''}`

  const subtitleKey =
    metrics.outstanding.count === 0
      ? 'subtitleNoUnpaid'
      : metrics.outstanding.count === 1
        ? 'subtitleUnpaid'
        : 'subtitleUnpaidPlural'

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-2 text-ink/60">
            {t(subtitleKey, {
              count: metrics.outstanding.count,
              amount: formatMoney(metrics.outstanding.totalCents, currency),
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={'/invoices/new' as Route}>
            <Button>
              <PlusIcon className="h-4 w-4" /> {t('newInvoice')}
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="hero"
          label={tMetrics('outstanding')}
          value={formatMoney(metrics.outstanding.totalCents, currency)}
          hint={
            metrics.outstanding.overdueCount > 0 ? (
              <>
                {metrics.outstanding.overdueCount} {tMetrics('overdueShort')} ·{' '}
                {formatMoney(metrics.outstanding.overdueCents, currency)}
              </>
            ) : null
          }
          trailing={
            <span className="text-[10px] font-medium uppercase tracking-wider bg-ink/30 px-2 py-0.5 rounded-full">
              {tMetrics('live')}
            </span>
          }
          className="lg:col-span-1"
        />
        <StatCard
          label={tMetrics('paidThisMonth')}
          value={formatMoney(metrics.paidThisMonth.totalCents, currency)}
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
                {metrics.avgDaysToPay.days}
                <span className="text-2xl text-ink/60 ml-1">{tMetrics('days')}</span>
              </>
            ) : (
              '—'
            )
          }
        />
        <StatCard
          label={tMetrics('sentThisWeek')}
          value={metrics.sentThisWeek.count}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CashflowChart buckets={cashflow} currency={currency} />
        </div>
        <DueThisWeek items={due} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivity items={activity} />
        </div>
        <QuickSend />
      </div>
    </div>
  )
}
