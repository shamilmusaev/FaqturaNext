'use client'

import { ClientsIcon, HomeIcon, InvoiceIcon, SettingsIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/overview', icon: HomeIcon, key: 'overview' as const },
  { href: '/invoices', icon: InvoiceIcon, key: 'invoices' as const },
  { href: '/clients', icon: ClientsIcon, key: 'clients' as const },
  { href: '/settings', icon: SettingsIcon, key: 'settings' as const },
]

export function BottomTabs() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-line-1 bg-card flex">
      {tabs.map(({ href, icon: Icon, key }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs',
              active ? 'text-ink' : 'text-ink/50',
            )}
          >
            <Icon className="h-5 w-5" />
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
