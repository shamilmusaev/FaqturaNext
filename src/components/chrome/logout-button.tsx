'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from '@/components/ui/icons'
import { logoutAction } from '@/features/auth/actions'
import { useTranslations } from 'next-intl'

export function LogoutButton() {
  const t = useTranslations('common')
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" aria-label={t('signOut')}>
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  )
}
