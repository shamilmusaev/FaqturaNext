import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { DashboardTask } from '../queries'

interface Props {
  title: string
  emptyLabel: string
  tasks: DashboardTask[]
}

const COLUMNS = [
  { status: 'todo', key: 'todo' },
  { status: 'in_progress', key: 'inProgress' },
  { status: 'done', key: 'done' },
] as const

const PER_COLUMN = 4

export async function MiniKanban({ title, emptyLabel, tasks }: Props) {
  const t = await getTranslations('time.board')

  return (
    <div className="bg-card border border-line-1 rounded-[24px] p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-ink/50">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          {COLUMNS.map(({ status, key }) => {
            const items = tasks.filter((task) => task.status === status)
            const shown = items.slice(0, PER_COLUMN)
            const more = items.length - shown.length
            return (
              <div key={status} className="flex flex-col gap-2 rounded-[16px] bg-paper-2/60 p-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {t(key)}
                  </span>
                  <span className="tnum text-xs text-ink/40">{items.length}</span>
                </div>
                {shown.map((task) => (
                  <Link
                    key={task.id}
                    href={`/time/projects/${task.projectId}` as Route}
                    className="block rounded-[12px] border border-line-1 bg-card px-3 py-2 hover:border-brand"
                  >
                    <span
                      className={cn(
                        'block text-sm font-medium truncate',
                        status === 'done' && 'text-ink/50 line-through',
                      )}
                    >
                      {task.name}
                    </span>
                    <span className="block text-xs text-ink/40 truncate">{task.projectName}</span>
                  </Link>
                ))}
                {more > 0 && <span className="px-1 text-xs text-ink/40">+{more}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
