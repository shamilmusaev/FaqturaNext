'use client'

import { ChevronDown } from '@/components/ui/icons'
import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Props {
  value: string
  /** Month options computed on the server to avoid hydration mismatches. */
  months: { value: string; label: string }[]
}

export function MonthSelector({ value, months }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', event.target.value)
    router.push(`${pathname}?${params.toString()}` as Route)
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={handleChange}
        className="h-11 appearance-none rounded-full border border-line-1 bg-card pl-5 pr-10 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-ink/50" />
    </div>
  )
}
