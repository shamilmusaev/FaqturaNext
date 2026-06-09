'use client'

import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV, SETTINGS_NAV, isNavActive } from './nav-config'

const PILL =
  'px-[18px] h-10 inline-flex items-center rounded-full text-sm font-medium transition-colors'

// Settings has its own sub-nav, so it is excluded from the primary app tabs.
const appTabs = APP_NAV.filter((item) => item.key !== 'settings')

export function HorizontalNav() {
  const pathname = usePathname()
  const inSettings = pathname.startsWith('/settings')
  return inSettings ? <SettingsNav pathname={pathname} /> : <AppNav pathname={pathname} />
}

function AppNav({ pathname }: { pathname: string }) {
  const t = useTranslations('nav')
  return (
    <nav className="hidden md:flex items-center gap-0.5 bg-card rounded-full p-1 border border-line-1">
      {appTabs.map(({ href, key, match }) => {
        const active = isNavActive(pathname, href, match)
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              PILL,
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
      {SETTINGS_NAV.map(({ href, key }) => {
        const active = isNavActive(pathname, href)
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              PILL,
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
