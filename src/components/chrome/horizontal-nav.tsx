'use client'

import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const appTabs = [
  { href: '/overview', key: 'overview' as const },
  { href: '/invoices', key: 'invoices' as const },
  { href: '/clients', key: 'clients' as const },
  { href: '/time', key: 'time' as const },
  { href: '/expenses', key: 'expenses' as const },
  { href: '/reports', key: 'reports' as const },
]

const settingsTabs = [
  { href: '/settings/account', key: 'account' as const },
  { href: '/settings/company', key: 'company' as const },
  { href: '/settings/payment', key: 'payment' as const },
  { href: '/settings/invoicing', key: 'invoicing' as const },
  { href: '/settings/localization', key: 'localization' as const },
]

export function HorizontalNav() {
  const pathname = usePathname()
  const inSettings = pathname.startsWith('/settings')
  return inSettings ? <SettingsNav pathname={pathname} /> : <AppNav pathname={pathname} />
}

function AppNav({ pathname }: { pathname: string }) {
  const t = useTranslations('nav')
  return (
    <nav className="hidden md:flex items-center gap-0.5 bg-card rounded-full p-1 border border-line-1">
      {appTabs.map(({ href, key }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'px-[18px] h-10 inline-flex items-center rounded-full text-sm font-medium transition-colors',
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

function SettingsNav({ pathname }: { pathname: string }) {
  const t = useTranslations('settings.nav')
  return (
    <nav className="hidden md:flex items-center gap-0.5 bg-card rounded-full p-1 border border-line-1">
      {settingsTabs.map(({ href, key }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'px-[18px] h-10 inline-flex items-center rounded-full text-sm font-medium transition-colors',
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
