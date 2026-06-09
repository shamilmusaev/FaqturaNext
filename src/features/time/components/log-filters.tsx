'use client'

import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ProjectOption } from '../queries'

interface Props {
  projects: ProjectOption[]
  months: { value: string; label: string }[]
  selectedProject: string
  selectedMonth: string
  allProjectsLabel: string
  allMonthsLabel: string
}

const SELECT_CLASS =
  'h-10 appearance-none rounded-full border border-line-1 bg-card pl-4 pr-9 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand'

export function LogFilters({
  projects,
  months,
  selectedProject,
  selectedMonth,
  allProjectsLabel,
  allMonthsLabel,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}` as Route)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={selectedProject}
        onChange={(event) => setParam('projectId', event.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">{allProjectsLabel}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={selectedMonth}
        onChange={(event) => setParam('month', event.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">{allMonthsLabel}</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  )
}
