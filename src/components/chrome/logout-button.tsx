'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from '@/components/ui/icons'
import { logoutAction } from '@/features/auth/actions'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  )
}
