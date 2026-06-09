import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { ProjectFilter } from '@/features/time/components/project-filter'
import { ProjectList } from '@/features/time/components/project-list'
import { TimeTabs } from '@/features/time/components/time-tabs'
import { listProjects } from '@/features/time/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const { status: statusParam } = await searchParams
  const status = statusParam === 'closed' || statusParam === 'all' ? statusParam : 'active'

  const [t, projects] = await Promise.all([getTranslations('time'), listProjects({ status })])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{t('projects.title')}</h1>
          <TimeTabs />
        </div>
        <Link href={'/time/projects/new' as Route}>
          <Button>
            <PlusIcon className="h-4 w-4" /> {t('newProject')}
          </Button>
        </Link>
      </header>
      <ProjectFilter
        value={status}
        labels={{
          active: t('projects.filterActive'),
          closed: t('projects.filterClosed'),
          all: t('projects.filterAll'),
        }}
      />
      <ProjectList projects={projects} />
    </div>
  )
}
