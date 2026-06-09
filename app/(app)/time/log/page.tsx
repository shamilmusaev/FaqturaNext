import { EntryList } from '@/features/time/components/entry-list'
import { LogFilters } from '@/features/time/components/log-filters'
import { TimeTabs } from '@/features/time/components/time-tabs'
import {
  currentMonth,
  listEntries,
  listProjectOptions,
  monthOptions,
} from '@/features/time/queries'
import { getLocale, getTranslations } from 'next-intl/server'

interface PageProps {
  searchParams: Promise<{ projectId?: string; month?: string }>
}

export default async function TimeLogPage({ searchParams }: PageProps) {
  const { projectId, month: monthParam } = await searchParams
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? '') ? monthParam : undefined

  const [t, locale, entries, projects] = await Promise.all([
    getTranslations('time'),
    getLocale(),
    listEntries({ projectId, month, limit: 300 }),
    listProjectOptions(),
  ])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('log.title')}</h1>
        <TimeTabs />
      </header>
      <LogFilters
        projects={projects}
        months={monthOptions(month ?? currentMonth(), locale)}
        selectedProject={projectId ?? ''}
        selectedMonth={month ?? ''}
        allProjectsLabel={t('log.allProjects')}
        allMonthsLabel={t('log.allMonths')}
      />
      <EntryList entries={entries} />
    </div>
  )
}
