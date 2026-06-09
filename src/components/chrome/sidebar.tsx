'use client'

import {
  ClientsIcon,
  ExpensesIcon,
  HelpCircleIcon,
  InvoiceIcon,
  OverviewIcon,
  ReportsIcon,
  SettingsIcon,
  TimeIcon,
} from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV, type NavKey, isNavActive } from './nav-config'
import { SidebarLogoutButton } from './sidebar-logout-button'
import { ThemeToggleStub } from './theme-toggle-stub'

const ICONS: Record<NavKey, typeof OverviewIcon> = {
  overview: OverviewIcon,
  invoices: InvoiceIcon,
  clients: ClientsIcon,
  time: TimeIcon,
  expenses: ExpensesIcon,
  reports: ReportsIcon,
  settings: SettingsIcon,
}

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <aside className="hidden md:flex md:flex-col md:items-center md:w-[72px] md:shrink-0 bg-paper h-screen sticky top-0 py-6">
      <ThemeToggleStub />
      <nav className="flex flex-col items-center gap-1 rounded-[28px] border border-line-1 bg-card p-1.5">
        {APP_NAV.map(({ href, key, match }) => {
          const Icon = ICONS[key]
          const active = isNavActive(pathname, href, match)
          return (
            <Link
              key={key}
              href={href}
              aria-label={t(key)}
              title={t(key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative h-11 w-11 inline-flex items-center justify-center rounded-full transition-colors',
                active ? 'text-ink' : 'text-ink-3 hover:text-ink hover:bg-paper-2',
              )}
            >
              {active && (
                <span className="absolute -left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand" />
              )}
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 px-2 pb-2">
        <button
          type="button"
          aria-label={t('help')}
          title={t('help')}
          className="h-11 w-11 inline-flex items-center justify-center rounded-[14px] text-ink-3 hover:text-ink hover:bg-paper-2"
        >
          <HelpCircleIcon className="h-5 w-5" />
        </button>
        <SidebarLogoutButton />
      </div>
    </aside>
  )
}
