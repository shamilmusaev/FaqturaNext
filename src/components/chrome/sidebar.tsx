'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'
import { HomeIcon, InvoiceIcon, ClientsIcon, SettingsIcon } from '@/components/ui/icons'

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
    <aside className="hidden md:flex md:flex-col md:w-[240px] md:shrink-0 border-r border-line-1 bg-card h-screen sticky top-0">
      <div className="px-6 py-6 text-xl font-semibold">Faqtura</div>
      <nav className="px-3 flex flex-col gap-1">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href as Route}
              className={cn(
                'flex items-center gap-3 px-3 h-11 rounded-[12px] text-[15px]',
                active ? 'bg-ink text-white' : 'text-ink hover:bg-line-1/40',
              )}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
