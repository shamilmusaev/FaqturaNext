'use client'

import { LogOut } from '@/components/ui/icons'
import { logoutAction } from '@/features/auth/actions'

export function SidebarLogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Sign out"
        title="Sign out"
        className="h-11 w-11 inline-flex items-center justify-center rounded-[12px] text-ink-3 hover:text-ink hover:bg-paper-2"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </form>
  )
}
