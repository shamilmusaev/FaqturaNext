import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { ByProjectBreakdown } from '@/features/time/components/by-project-breakdown'
import { MiniKanban } from '@/features/time/components/mini-kanban'
import { MonthSelector } from '@/features/time/components/month-selector'
import { QuickAddEntry } from '@/features/time/components/quick-add-entry'
import { RecentEntries } from '@/features/time/components/recent-entries'
import { TimeStatCard } from '@/features/time/components/time-stat-card'
import { TimeTabs } from '@/features/time/components/time-tabs'
import { formatHM } from '@/features/time/duration'
import {
  currentMonth,
  getTimeDashboard,
  listCategoryOptions,
  listDashboardTasks,
  listProjectOptions,
  localToday,
  monthOptions,
} from '@/features/time/queries'
import type { Route } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function TimeDashboardPage({ searchParams }: PageProps) {
  const { month: monthParam } = await searchParams
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? '') ? (monthParam as string) : currentMonth()

  const [t, locale, data, projectOptions, categoryOptions, boardTasks] = await Promise.all([
    getTranslations('time'),
    getLocale(),
    getTimeDashboard({ month }),
    listProjectOptions(),
    listCategoryOptions(),
    listDashboardTasks(),
  ])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-ink/60">{t('subtitle')}</p>
          </div>
          <TimeTabs />
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector value={month} months={monthOptions(month, locale)} />
          <Link href={'/time/projects/new' as Route}>
            <Button>
              <PlusIcon className="h-4 w-4" /> {t('newProject')}
            </Button>
          </Link>
        </div>
      </header>

      <QuickAddEntry projects={projectOptions} categories={categoryOptions} today={localToday()} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TimeStatCard hero label={t('kpi.totalMonth')} value={formatHM(data.totalMonthMinutes)} />
        <TimeStatCard label={t('kpi.totalWeek')} value={formatHM(data.totalWeekMinutes)} />
        <TimeStatCard label={t('kpi.activeProjects')} value={String(data.activeProjectCount)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <ByProjectBreakdown
          title={t('sections.byCategory')}
          emptyLabel={t('sections.byCategoryEmpty')}
          items={data.byCategory}
        />
        <ByProjectBreakdown
          title={t('sections.byProject')}
          emptyLabel={t('sections.byProjectEmpty')}
          items={data.byProject}
        />
      </div>

      <MiniKanban
        title={t('board.miniTitle')}
        emptyLabel={t('board.miniEmpty')}
        tasks={boardTasks}
      />

      <RecentEntries
        title={t('sections.recent')}
        emptyLabel={t('sections.recentEmpty')}
        entries={data.recent}
      />
    </div>
  )
}
