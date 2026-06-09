'use client'

import { ClientsIcon, HomeIcon, InvoiceIcon, SettingsIcon, TimeIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV, MOBILE_NAV_KEYS, type NavKey, isNavActive } from './nav-config'

const ICONS: Partial<Record<NavKey, typeof HomeIcon>> = {
  overview: HomeIcon,
  invoices: InvoiceIcon,
  clients: ClientsIcon,
  time: TimeIcon,
  settings: SettingsIcon,
}

const tabs = APP_NAV.filter((item) => MOBILE_NAV_KEYS.has(item.key))

export function BottomTabs() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-line-1 bg-card flex">
      {tabs.map(({ href, key, match }) => {
        const Icon = ICONS[key] ?? HomeIcon
        const active = isNavActive(pathname, href, match)
        return (
          <Link
            key={key}
            href={href}
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
