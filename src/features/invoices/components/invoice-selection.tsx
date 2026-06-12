'use client'

import { BanIcon, CloseIcon, TrashIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { type ReactNode, createContext, useContext, useState, useTransition } from 'react'
import { cancelInvoicesAction, deleteDraftsAction } from '../actions'

interface SelectionCtx {
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
}

const SelectionContext = createContext<SelectionCtx | null>(null)

/** Returns the selection API, or null when rendered outside the provider. */
export function useInvoiceSelection(): SelectionCtx | null {
  return useContext(SelectionContext)
}

/**
 * Bulk-selection provider: tracks the selected invoice ids and renders a
 * floating action bar (delete drafts / cancel) while any are selected. Wraps
 * whichever view (cards or list) is shown.
 */
export function InvoiceSelection({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [pending, start] = useTransition()
  const t = useTranslations('invoices')
  const tActions = useTranslations('invoices.actions')

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const clear = () => setSelected(new Set())
  const isSelected = (id: string) => selected.has(id)
  const ids = [...selected]

  const runDelete = () => {
    if (!confirm(tActions('confirmDeleteBulk', { count: ids.length }))) return
    start(async () => {
      const res = await deleteDraftsAction(ids)
      if (res.error) toast.error(res.error)
      else toast.success(t('bulk.deleted', { deleted: res.deleted, skipped: res.skipped }))
      clear()
      router.refresh()
    })
  }

  const runCancel = () => {
    if (!confirm(tActions('confirmCancelBulk', { count: ids.length }))) return
    start(async () => {
      const res = await cancelInvoicesAction(ids)
      if (res.error) toast.error(res.error)
      else toast.success(t('bulk.cancelled', { cancelled: res.cancelled, skipped: res.skipped }))
      clear()
      router.refresh()
    })
  }

  return (
    <SelectionContext.Provider value={{ isSelected, toggle }}>
      {children}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line-1 bg-card px-2 py-1.5 shadow-2xl">
          <span className="px-2 text-sm font-medium">
            {t('bulk.selected', { count: selected.size })}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={runDelete}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink/70 transition-colors hover:bg-neg/10 hover:text-neg disabled:opacity-40"
          >
            <TrashIcon className="h-4 w-4" />
            {tActions('delete')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={runCancel}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink/70 transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-40"
          >
            <BanIcon className="h-4 w-4" />
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={clear}
            aria-label={tActions('clearSelection')}
            title={tActions('clearSelection')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/55 transition-colors hover:bg-paper-2 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </SelectionContext.Provider>
  )
}
