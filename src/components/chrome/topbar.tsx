import { InfoIcon, SearchIcon } from '@/components/ui/icons'
import { formatHM } from '@/features/time/duration'
import { getBudgetAlerts } from '@/features/time/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { HorizontalNav } from './horizontal-nav'
import { NotificationsBell } from './notifications-bell'
import { UserMenu } from './user-menu'

function emailToDisplayName(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return email
  return cleaned
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export async function TopBar({
  userEmail,
  userName,
}: {
  userEmail: string
  userName?: string | null
}) {
  const [t, tMenu, tTime, alerts] = await Promise.all([
    getTranslations('chrome'),
    getTranslations('chrome.userMenu'),
    getTranslations('time'),
    getBudgetAlerts(),
  ])
  const name = userName?.trim() || emailToDisplayName(userEmail)
  const menuLabels = {
    account: tMenu('account'),
    company: tMenu('company'),
    settings: tMenu('settings'),
    signOut: tMenu('signOut'),
  }
  const alertItems = alerts.map((p) => {
    const est = p.estimateMinutes ?? 0
    const over = p.usedMinutes > est
    return {
      id: p.id,
      name: p.name,
      over,
      message: over
        ? `${formatHM(p.usedMinutes - est)} ${tTime('overall.over').toLowerCase()}`
        : `${Math.round((p.usedMinutes / (est || 1)) * 100)}% ${tTime('overall.used').toLowerCase()}`,
    }
  })
  return (
    <header className="h-20 bg-paper px-4 md:px-8 sticky top-0 z-10">
      <div className="mx-auto flex h-full w-full max-w-[1568px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={'/overview' as Route} className="flex items-center gap-2.5 shrink-0 pr-4">
            <Image
              src="/logo.svg"
              alt="Faqtura"
              width={40}
              height={40}
              className="h-10 w-10 rounded-[10px]"
              priority
            />
            <span className="hidden text-[19px] font-semibold tracking-[-0.02em] sm:inline">
              faqtura
            </span>
          </Link>

          <HorizontalNav />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:inline-flex items-center gap-0.5 bg-card border border-line-1 rounded-full p-1.5">
            <button
              type="button"
              aria-label={t('search')}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-paper-2"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            <NotificationsBell
              items={alertItems}
              title={tTime('notifications.title')}
              emptyLabel={tTime('notifications.empty')}
              bellLabel={t('notifications')}
            />
            <button
              type="button"
              aria-label={t('info')}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-paper-2"
            >
              <InfoIcon className="h-4 w-4" />
            </button>
          </div>
          <UserMenu name={name} email={userEmail} labels={menuLabels} />
        </div>
      </div>
    </header>
  )
}
