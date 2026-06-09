'use client'

import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'

type Status = 'active' | 'closed' | 'all'

interface Props {
  value: Status
  labels: { active: string; closed: string; all: string }
}

export function ProjectFilter({ value, labels }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const options: Status[] = ['active', 'closed', 'all']

  function select(status: Status) {
    const query = status === 'active' ? '' : `?status=${status}`
    router.push(`${pathname}${query}` as Route)
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-line-1 bg-card p-1 w-fit">
      {options.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => select(status)}
          className={cn(
            'px-4 h-9 inline-flex items-center rounded-full text-sm font-medium transition-colors',
            value === status ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink hover:bg-paper-2',
          )}
        >
          {labels[status]}
        </button>
      ))}
    </div>
  )
}
