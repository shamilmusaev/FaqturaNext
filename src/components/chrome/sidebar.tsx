'use client'

import { ClientsIcon, HomeIcon, InvoiceIcon, SettingsIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggleStub } from './theme-toggle-stub'

const nav = [
  { href: '/overview', icon: HomeIcon, key: 'overview' as const },
  { href: '/invoices', icon: InvoiceIcon, key: 'invoices' as const },
  { href: '/clients', icon: ClientsIcon, key: 'clients' as const },
  { href: '/settings', icon: SettingsIcon, key: 'settings' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <aside className="hidden md:flex md:flex-col md:items-center md:w-16 md:shrink-0 border-r border-line-1 bg-card h-screen sticky top-0 py-4">
      <ThemeToggleStub />
      <nav className="flex flex-col items-center gap-1 px-2 flex-1">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href as Route}
              aria-label={t(key)}
              title={t(key)}
              className={cn(
                'h-11 w-11 inline-flex items-center justify-center rounded-[12px] transition-colors',
                active ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink hover:bg-line-1/40',
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
