import { Button } from '@/components/ui/button'
import { QuickAddTask } from '@/features/time/components/quick-add-task'
import { TaskBoard } from '@/features/time/components/task-board'
import { TimeTabs } from '@/features/time/components/time-tabs'
import { formatHM, formatRange } from '@/features/time/duration'
import { getProjectBoard } from '@/features/time/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectBoardPage({ params }: PageProps) {
  const { id } = await params
  const [t, board] = await Promise.all([getTranslations('time'), getProjectBoard(id)])
  if (!board) notFound()

  const { project, tasks } = board
  const estMin = tasks.reduce((s, x) => s + (x.est_min_minutes ?? x.est_max_minutes ?? 0), 0)
  const estMax = tasks.reduce((s, x) => s + (x.est_max_minutes ?? x.est_min_minutes ?? 0), 0)
  const range =
    tasks.length > 0
      ? formatRange(estMin, estMax)
      : formatRange(project.estimate_minutes, project.estimate_minutes)
  const done = tasks.filter((x) => x.status === 'done').length
  const actual = tasks.reduce((s, x) => s + (x.actual_minutes ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Link href={'/time/projects' as Route} className="text-sm text-ink/50 hover:text-ink">
          ← {t('projects.title')}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-1 text-sm text-ink/60">
              {project.clientName}
              {range && ` · ${t('board.estimate')} ${range}`}
              {tasks.length > 0 && ` · ${t('board.tasksDone', { done, total: tasks.length })}`}
              {actual > 0 && ` · ${t('board.actual')} ${formatHM(actual)}`}
            </p>
          </div>
          <Link href={`/time/projects/${id}/edit` as Route}>
            <Button variant="secondary">{t('project.edit')}</Button>
          </Link>
        </div>
        <TimeTabs />
      </header>

      <QuickAddTask projectId={id} />
      <TaskBoard projectId={id} tasks={tasks} />
    </div>
  )
}
