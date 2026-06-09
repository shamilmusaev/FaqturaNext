'use client'

import { LogOut } from '@/components/ui/icons'
import { logoutAction } from '@/features/auth/actions'
import { useTranslations } from 'next-intl'

export function SidebarLogoutButton() {
  const t = useTranslations('common')
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label={t('signOut')}
        title={t('signOut')}
        className="h-11 w-11 inline-flex items-center justify-center rounded-[12px] text-ink-3 hover:text-ink hover:bg-paper-2"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </form>
  )
}
