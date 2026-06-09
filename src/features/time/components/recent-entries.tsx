import { formatHM } from '../duration'
import type { DashboardEntry } from '../queries'

interface Props {
  title: string
  emptyLabel: string
  entries: DashboardEntry[]
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(
    new Date(`${iso}T00:00:00Z`),
  )
}

export function RecentEntries({ title, emptyLabel, entries }: Props) {
  return (
    <div className="bg-card border border-line-1 rounded-[24px] p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/50">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-1">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="tnum w-14 shrink-0 text-sm text-ink/50">
                {shortDate(e.entryDate)}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{e.projectName}</span>
                {e.category && (
                  <span className="text-xs text-ink/40 ml-2 rounded-full bg-paper-2 px-2 py-0.5">
                    {e.category}
                  </span>
                )}
                {e.description && (
                  <span className="text-sm text-ink/50 ml-2 truncate">{e.description}</span>
                )}
              </div>
              <span className="tnum shrink-0 text-sm text-ink/70">{formatHM(e.minutes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
