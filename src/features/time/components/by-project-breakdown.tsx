import { formatHM } from '../duration'

interface Props {
  title: string
  emptyLabel: string
  items: { id: string; name: string; clientName: string; minutes: number }[]
}

export function ByProjectBreakdown({ title, emptyLabel, items }: Props) {
  const max = items.reduce((m, i) => Math.max(m, i.minutes), 0)

  return (
    <div className="bg-card border border-line-1 rounded-[24px] p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink/50">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm font-medium">{i.name}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-[image:var(--grad-brand)]"
                  style={{ width: `${max > 0 ? Math.max((i.minutes / max) * 100, 4) : 0}%` }}
                />
              </div>
              <span className="tnum w-14 shrink-0 text-right text-sm text-ink/70">
                {formatHM(i.minutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
