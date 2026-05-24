'use client'

import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/overview', key: 'overview' as const },
  { href: '/invoices', key: 'invoices' as const },
  { href: '/clients', key: 'clients' as const },
  { href: '/settings', key: 'settings' as const },
]

export function HorizontalNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <nav className="hidden md:flex items-center gap-1 bg-paper rounded-full p-1 border border-line-1">
      {tabs.map(({ href, key }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'px-4 h-9 inline-flex items-center rounded-full text-sm font-medium transition-colors',
              active ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink',
            )}
          >
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
