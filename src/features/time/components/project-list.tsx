import { BoardIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { formatHM, formatRange } from '../duration'
import type { ProjectStats } from '../queries'
import { ProgressBar } from './progress-bar'
import { ProjectDeleteButton } from './project-delete-button'
import { ProjectStatusButton } from './project-status-button'

interface Props {
  projects: ProjectStats[]
}

export async function ProjectList({ projects }: Props) {
  const t = await getTranslations('time')

  if (projects.length === 0) {
    return (
      <div className="bg-card border border-line-1 rounded-[24px] p-10 text-center text-ink/50">
        {t('projects.empty')}
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((p) => {
        const closed = p.status === 'closed'
        return (
          <li
            key={p.id}
            className={cn(
              'bg-card border border-line-1 rounded-[20px] p-5 flex flex-col gap-3',
              closed && 'opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/time/projects/${p.id}` as Route}
                    className="font-semibold truncate hover:text-brand"
                  >
                    {p.name}
                  </Link>
                  {closed && (
                    <span className="text-xs rounded-full bg-paper-2 px-2 py-0.5 text-ink/50">
                      {t('project.statusClosed')}
                    </span>
                  )}
                </div>
                {p.clientName && <span className="text-sm text-ink/50">{p.clientName}</span>}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href={`/time/projects/${p.id}` as Route}
                  aria-label={t('project.board')}
                  title={t('project.board')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90"
                >
                  <BoardIcon className="h-4 w-4" />
                </Link>
                <ProjectStatusButton id={p.id} status={p.status} />
                <Link
                  href={`/time/projects/${p.id}/edit` as Route}
                  className="text-sm text-ink/60 hover:text-ink"
                >
                  {t('project.edit')}
                </Link>
                <ProjectDeleteButton id={p.id} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="tnum text-ink/70">
                {formatHM(p.usedMinutes)}
                {p.estimateMinutes != null && (
                  <span className="text-ink/40">
                    {' / '}
                    {formatRange(p.estimateMinMinutes, p.estimateMaxMinutes)}
                  </span>
                )}
              </span>
              <span className="tnum text-ink/50">
                {p.rateCents != null ? formatMoney(p.rateCents, 'SEK') : ''}
                {p.rateCents != null ? t('project.perHour') : ''}
              </span>
            </div>
            <ProgressBar value={p.usedMinutes} max={p.estimateMinutes} />
          </li>
        )
      })}
    </ul>
  )
}
