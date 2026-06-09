'use client'

import { BellIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type AlertItem = {
  id: string
  name: string
  message: string
  over: boolean
}

export function NotificationsBell({
  items,
  title,
  emptyLabel,
  bellLabel,
}: {
  items: AlertItem[]
  title: string
  emptyLabel: string
  bellLabel: string
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

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={bellLabel}
        className="h-9 w-9 inline-flex items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-paper-2 relative"
      >
        <BellIcon className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-neg" />
        )}
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
            className="absolute right-0 top-[calc(100%+10px)] z-20 w-72 rounded-[18px] border border-line-1 bg-card p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
          >
            <div className="px-3 py-2.5 text-sm font-medium">{title}</div>
            <div className="h-px bg-line-1 mx-1" />
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink/50">{emptyLabel}</p>
            ) : (
              <ul className="py-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-[12px] px-3 py-2 text-sm"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        item.over ? 'bg-neg' : 'bg-warn',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{item.name}</span>
                      <span className={cn('block text-xs', item.over ? 'text-neg' : 'text-warn')}>
                        {item.message}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
