import { formatMoney } from '@/lib/money'
import { formatHM, formatRange } from '../duration'
import type { ProjectStats } from '../queries'
import { ProgressBar } from './progress-bar'

interface Props {
  title: string
  emptyLabel: string
  projects: ProjectStats[]
  showEarned: boolean
}

export function ProjectProgressList({ title, emptyLabel, projects, showEarned }: Props) {
  return (
    <div className="bg-card border border-line-1 rounded-[24px] p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-ink/50">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((p) => {
            const over = p.estimateMinutes != null && p.usedMinutes > p.estimateMinutes
            const left = p.estimateMinutes != null ? p.estimateMinutes - p.usedMinutes : null
            return (
              <li key={p.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-medium truncate">{p.name}</span>
                    {p.clientName && (
                      <span className="text-ink/40 text-sm ml-2">{p.clientName}</span>
                    )}
                  </div>
                  <div className="tnum shrink-0 text-sm text-ink/70">
                    {formatHM(p.usedMinutes)}
                    {p.estimateMinutes != null && (
                      <span className="text-ink/40">
                        {' / '}
                        {formatRange(p.estimateMinMinutes, p.estimateMaxMinutes)}
                      </span>
                    )}
                  </div>
                </div>
                <ProgressBar value={p.usedMinutes} max={p.estimateMinutes} />
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className={over ? 'text-neg font-medium' : 'text-ink/50'}>
                    {left != null
                      ? over
                        ? `${formatHM(-left)} over`
                        : `${formatHM(left)} left`
                      : 'No estimate'}
                  </span>
                  {showEarned && p.earnedCents != null && (
                    <span className="tnum text-ink/50">{formatMoney(p.earnedCents, 'SEK')}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
