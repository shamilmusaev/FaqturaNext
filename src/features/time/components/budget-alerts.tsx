import { cn } from '@/lib/cn'
import { formatHM } from '../duration'
import type { ProjectStats } from '../queries'

interface Props {
  projects: ProjectStats[]
  overLabel: string
  nearLabel: string
}

const NEAR_THRESHOLD = 0.8

/**
 * Compact strip shown on the dashboard only when a budgeted project is over or
 * near its estimate. Keeps budget detail off the dashboard but still warns.
 */
export function BudgetAlerts({ projects, overLabel, nearLabel }: Props) {
  const alerts = projects
    .filter((p) => p.estimateMinutes != null)
    .map((p) => {
      const est = p.estimateMinutes ?? 0
      const ratio = est > 0 ? p.usedMinutes / est : 0
      return { p, ratio, est }
    })
    .filter((a) => a.ratio >= NEAR_THRESHOLD)
    .sort((a, b) => b.ratio - a.ratio)

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map(({ p, ratio, est }) => {
        const over = p.usedMinutes > est
        return (
          <span
            key={p.id}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
              over ? 'bg-neg-bg text-neg' : 'bg-warn-bg text-warn',
            )}
          >
            <span className="font-medium">{p.name}</span>
            {over
              ? `${formatHM(p.usedMinutes - est)} ${overLabel}`
              : `${Math.round(ratio * 100)}% ${nearLabel}`}
          </span>
        )
      })}
    </div>
  )
}
