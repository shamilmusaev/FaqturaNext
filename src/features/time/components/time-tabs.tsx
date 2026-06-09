'use client'

import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/time', key: 'dashboard' as const },
  { href: '/time/budgets', key: 'budgets' as const },
  { href: '/time/projects', key: 'projects' as const },
  { href: '/time/log', key: 'log' as const },
]

export function TimeTabs() {
  const pathname = usePathname()
  const t = useTranslations('time.tabs')

  return (
    <nav className="flex items-center gap-0.5 bg-card rounded-full p-1 border border-line-1 w-fit">
      {tabs.map(({ href, key }) => {
        const active = href === '/time' ? pathname === '/time' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'px-4 h-9 inline-flex items-center rounded-full text-sm font-medium transition-colors',
              active ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink hover:bg-paper-2',
            )}
          >
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
