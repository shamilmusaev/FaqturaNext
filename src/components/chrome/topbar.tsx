import { Avatar } from '@/components/ui/avatar'
import { ChevronDown } from '@/components/ui/icons'
import type { Locale } from '@/i18n/config'
import type { Route } from 'next'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { HorizontalNav } from './horizontal-nav'
import { LocaleSwitcher } from './locale-switcher'
import { LogoutButton } from './logout-button'

function displayName(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return email
  return cleaned
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export async function TopBar({ userEmail }: { userEmail: string }) {
  const locale = (await getLocale()) as Locale
  const name = displayName(userEmail)
  return (
    <header className="h-16 border-b border-line-1 bg-paper flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-10">
      <Link href={'/overview' as Route} className="flex items-center gap-2 shrink-0">
        <span className="h-8 w-8 inline-flex items-center justify-center rounded-[10px] bg-brand text-white font-semibold">
          f
        </span>
        <span className="font-semibold tracking-tight hidden sm:inline">faqtura</span>
      </Link>

      <HorizontalNav />

      <div className="flex items-center gap-3 shrink-0">
        <LocaleSwitcher current={locale} />
        <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 h-10 rounded-full bg-card border border-line-1">
          <Avatar name={name} className="h-7 w-7 text-xs" />
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-[11px] text-ink/50">{userEmail}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ink/40" />
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
