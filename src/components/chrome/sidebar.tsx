'use client'

import {
  ClientsIcon,
  ExpensesIcon,
  HelpCircleIcon,
  InvoiceIcon,
  OverviewIcon,
  ReportsIcon,
  SettingsIcon,
} from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SidebarLogoutButton } from './sidebar-logout-button'
import { ThemeToggleStub } from './theme-toggle-stub'

const nav = [
  { href: '/overview', icon: OverviewIcon, key: 'overview' as const },
  { href: '/invoices', icon: InvoiceIcon, key: 'invoices' as const },
  { href: '/clients', icon: ClientsIcon, key: 'clients' as const },
  { href: '/expenses', icon: ExpensesIcon, key: 'expenses' as const },
  { href: '/reports', icon: ReportsIcon, key: 'reports' as const },
  { href: '/settings', icon: SettingsIcon, key: 'settings' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <aside className="hidden md:flex md:flex-col md:items-center md:w-[72px] md:shrink-0 bg-paper h-screen sticky top-0 py-6">
      <ThemeToggleStub />
      <nav className="flex flex-col items-center gap-1 rounded-[28px] border border-line-1 bg-card p-1.5">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href as Route}
              aria-label={t(key)}
              title={t(key)}
              className={cn(
                'h-11 w-11 inline-flex items-center justify-center rounded-full transition-colors',
                active ? 'bg-ink text-brand' : 'text-ink-3 hover:text-ink hover:bg-paper-2',
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 px-2 pb-2">
        <button
          type="button"
          aria-label="Help"
          title="Help"
          className="h-11 w-11 inline-flex items-center justify-center rounded-[14px] text-ink-3 hover:text-ink hover:bg-paper-2"
        >
          <HelpCircleIcon className="h-5 w-5" />
        </button>
        <SidebarLogoutButton />
      </div>
    </aside>
  )
}
