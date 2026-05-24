import type { Locale } from '@/i18n/config'
import { getLocale } from 'next-intl/server'
import { LocaleSwitcher } from './locale-switcher'
import { LogoutButton } from './logout-button'

export async function TopBar({ userEmail }: { userEmail: string }) {
  const locale = (await getLocale()) as Locale
  return (
    <header className="h-16 border-b border-line-1 bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden font-semibold">Faqtura</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <LocaleSwitcher current={locale} />
        <span className="text-sm text-ink/60 hidden sm:inline">{userEmail}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
