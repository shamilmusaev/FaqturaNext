import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { formatHM, formatRange } from '../duration'
import type { TaskRow } from '../queries'
import type { TaskStatus } from '../schema'
import { TaskDeleteButton } from './task-delete-button'
import { TaskStatusControls } from './task-status-controls'

interface Props {
  projectId: string
  tasks: TaskRow[]
}

const COLUMNS: { status: TaskStatus; key: 'todo' | 'inProgress' | 'done' }[] = [
  { status: 'todo', key: 'todo' },
  { status: 'in_progress', key: 'inProgress' },
  { status: 'done', key: 'done' },
]

export async function TaskBoard({ projectId, tasks }: Props) {
  const t = await getTranslations('time.board')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map(({ status, key }) => {
        const items = tasks.filter((task) => task.status === status)
        return (
          <div key={status} className="flex flex-col gap-3 rounded-[20px] bg-paper-2/60 p-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{t(key)}</span>
              <span className="tnum text-xs text-ink/40">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-ink/35">{t('emptyColumn')}</p>
            ) : (
              items.map((task) => (
                <TaskCard key={task.id} projectId={projectId} task={task} editLabel={t('edit')} />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({
  projectId,
  task,
  editLabel,
}: {
  projectId: string
  task: TaskRow
  editLabel: string
}) {
  const range = formatRange(task.est_min_minutes, task.est_max_minutes)
  const done = task.status === 'done'
  return (
    <div className="rounded-[16px] border border-line-1 bg-card p-3 flex flex-col gap-2">
      <span className={cn('text-sm font-medium', done && 'text-ink/50 line-through')}>
        {task.name}
      </span>
      <div className="flex items-center gap-2 text-xs text-ink/55">
        {range && <span className="tnum rounded-full bg-paper-2 px-2 py-0.5">{range}</span>}
        {task.actual_minutes != null && (
          <span className="tnum text-pos">{formatHM(task.actual_minutes)}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <TaskStatusControls id={task.id} status={task.status as TaskStatus} />
        <div className="flex items-center gap-1">
          <Link
            href={`/time/projects/${projectId}/tasks/${task.id}/edit` as Route}
            className="text-xs text-ink/50 hover:text-ink px-1"
          >
            {editLabel}
          </Link>
          <TaskDeleteButton id={task.id} />
        </div>
      </div>
    </div>
  )
}
