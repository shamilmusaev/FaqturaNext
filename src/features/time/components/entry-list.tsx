import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { formatHM, shortDate } from '../duration'
import type { DashboardEntry } from '../queries'
import { EntryDeleteButton } from './entry-delete-button'

interface Props {
  entries: DashboardEntry[]
}

export async function EntryList({ entries }: Props) {
  const t = await getTranslations('time')

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-line-1 rounded-[24px] p-10 text-center text-ink/50">
        {t('log.empty')}
      </div>
    )
  }

  return (
    <div className="bg-card border border-line-1 rounded-[24px] overflow-hidden">
      <ul className="divide-y divide-line-1">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-5 py-3">
            <span className="tnum w-14 shrink-0 text-sm text-ink/50">{shortDate(e.entryDate)}</span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">{e.projectName}</span>
              {e.category && (
                <span className="text-xs text-ink/40 ml-2 rounded-full bg-paper-2 px-2 py-0.5">
                  {e.category}
                </span>
              )}
              {e.description && <div className="text-sm text-ink/50 truncate">{e.description}</div>}
            </div>
            <span className="tnum shrink-0 text-sm text-ink/70">{formatHM(e.minutes)}</span>
            <Link
              href={`/time/log/${e.id}/edit` as Route}
              className="shrink-0 text-sm text-ink/50 hover:text-ink"
            >
              {t('log.edit')}
            </Link>
            <EntryDeleteButton id={e.id} />
          </li>
        ))}
      </ul>
    </div>
  )
}
