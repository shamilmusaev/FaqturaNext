import { BudgetAlerts } from '@/features/time/components/budget-alerts'
import { GaugeProgress } from '@/features/time/components/gauge-progress'
import { ProjectProgressList } from '@/features/time/components/project-progress-list'
import { TimeStatCard } from '@/features/time/components/time-stat-card'
import { TimeTabs } from '@/features/time/components/time-tabs'
import { formatHM } from '@/features/time/duration'
import { listProjects } from '@/features/time/queries'
import { getTranslations } from 'next-intl/server'

export default async function BudgetsPage() {
  const [t, projects] = await Promise.all([
    getTranslations('time'),
    listProjects({ status: 'all' }),
  ])

  const budgeted = projects.filter((p) => p.estimateMinutes != null && p.status === 'active')
  const totalBudget = budgeted.reduce((s, p) => s + (p.estimateMinutes ?? 0), 0)
  const totalUsed = budgeted.reduce((s, p) => s + p.usedMinutes, 0)
  const totalLeft = budgeted.reduce(
    (s, p) => s + Math.max(0, (p.estimateMinutes ?? 0) - p.usedMinutes),
    0,
  )
  const overBudgetCount = budgeted.filter((p) => p.usedMinutes > (p.estimateMinutes ?? 0)).length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('budgets.title')}</h1>
          <p className="mt-1 text-sm text-ink/60">{t('budgets.subtitle')}</p>
        </div>
        <TimeTabs />
      </header>

      <BudgetAlerts
        projects={projects}
        overLabel={t('overall.over').toLowerCase()}
        nearLabel={t('overall.used').toLowerCase()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimeStatCard hero label={t('budgets.kpiBudgeted')} value={String(budgeted.length)} />
        <TimeStatCard label={t('budgets.kpiTotal')} value={formatHM(totalBudget)} />
        <TimeStatCard label={t('budgets.kpiUsed')} value={formatHM(totalUsed)} />
        <TimeStatCard
          label={t('budgets.kpiLeft')}
          value={formatHM(totalLeft)}
          hint={overBudgetCount > 0 ? t('budgets.overHint', { count: overBudgetCount }) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 items-start">
        <GaugeProgress
          title={t('overall.title')}
          caption={t('overall.caption')}
          emptyLabel={t('overall.empty')}
          usedLabel={t('overall.used')}
          leftLabel={t('overall.left')}
          overLabel={t('overall.over')}
          usedMinutes={totalUsed}
          estimateMinutes={totalBudget}
        />
        <ProjectProgressList
          title={t('sections.budget')}
          emptyLabel={t('sections.budgetEmpty')}
          overLabel={t('overall.over').toLowerCase()}
          leftLabel={t('overall.left').toLowerCase()}
          noEstimateLabel={t('sections.noEstimate')}
          projects={budgeted}
          showEarned={projects.some((p) => p.rateCents != null)}
        />
      </div>
    </div>
  )
}
