'use client'

import { Avatar } from '@/components/ui/avatar'
import { ChevronDown, LogOut, OrgIcon, SettingsIcon, UserIcon } from '@/components/ui/icons'
import { logoutAction } from '@/features/auth/actions'
import { AnimatePresence, motion } from 'motion/react'
import type { Route } from 'next'
import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type UserMenuLabels = {
  account: string
  company: string
  settings: string
  signOut: string
}

export function UserMenu({
  name,
  email,
  labels,
}: {
  name: string
  email: string
  labels: UserMenuLabels
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const items: Array<{
    href: Route
    label: string
    icon: typeof UserIcon
  }> = [
    { href: '/settings/account' as Route, label: labels.account, icon: UserIcon },
    { href: '/settings/company' as Route, label: labels.company, icon: OrgIcon },
    // Skip the /settings redirect — link to the default subpage directly.
    { href: '/settings/account' as Route, label: labels.settings, icon: SettingsIcon },
  ]

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="h-12 flex items-center gap-2.5 rounded-full bg-card border border-line-1 py-1 pl-1 pr-4 hover:bg-paper-2 transition-colors"
      >
        <Avatar name={name} className="h-9 w-9 text-sm" />
        <div className="leading-tight text-left">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-[11px] text-ink/50">{email}</div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink/40 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-[18px] border border-line-1 bg-card p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
          >
            <div className="px-3 py-2.5">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-[11px] text-ink/50 truncate">{email}</div>
            </div>
            <div className="h-px bg-line-1 mx-1" />
            <ul className="py-1">
              {items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    role="menuitem"
                    href={href}
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm text-ink hover:bg-paper-2 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-ink/60" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="h-px bg-line-1 mx-1" />
            <form action={logoutAction} className="py-1">
              <button
                role="menuitem"
                type="submit"
                className="w-full flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm text-ink hover:bg-paper-2 transition-colors"
              >
                <LogOut className="h-4 w-4 text-ink/60" />
                {labels.signOut}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
