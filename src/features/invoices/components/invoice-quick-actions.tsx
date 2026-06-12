'use client'

import {
  BanIcon,
  BellIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  PenLineIcon,
  SendIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { type ReactNode, useTransition } from 'react'
import {
  cancelInvoiceAction,
  deleteInvoiceAction,
  duplicateInvoiceAction,
  markInvoicePaidAction,
  sendInvoiceAction,
  sendReminderAction,
} from '../actions'
import type { InvoiceStatus } from '../schema'

export interface InvoiceLite {
  id: string
  status: InvoiceStatus
  number: string
}

interface Item {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  danger?: boolean
}

/**
 * Status-aware row of quick-action icon buttons for an invoice, shared by the
 * card footer, the detail dialog header and the list rows. `onView` overrides
 * the View action (e.g. open the dialog instead of navigating); `onDone` fires
 * after a successful mutation (e.g. to close the dialog).
 */
export function InvoiceQuickActions({
  invoice,
  onView,
  onDone,
  showView = true,
  className,
}: {
  invoice: InvoiceLite
  onView?: () => void
  onDone?: () => void
  /** Hide the View action (e.g. inside the detail dialog). */
  showView?: boolean
  className?: string
}) {
  const t = useTranslations('invoices')
  const tActions = useTranslations('invoices.actions')
  const tToast = useTranslations('invoices.toast')
  const router = useRouter()
  const [pending, start] = useTransition()
  const { id, status } = invoice

  const mutate = (
    action: () => Promise<{ error?: string }>,
    success: string,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    start(async () => {
      const res = await action()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(success)
        router.refresh()
        onDone?.()
      }
    })
  }

  const items: Item[] = []
  if (showView) {
    items.push({
      key: 'view',
      label: tActions('view'),
      icon: <EyeIcon className="h-4 w-4" />,
      onClick: () => (onView ? onView() : router.push(`/invoices/${id}` as Route)),
    })
  }

  if (status === 'draft') {
    items.push(
      {
        key: 'edit',
        label: t('edit'),
        icon: <PenLineIcon className="h-4 w-4" />,
        onClick: () => router.push(`/invoices/${id}/edit` as Route),
      },
      {
        key: 'send',
        label: t('send'),
        icon: <SendIcon className="h-4 w-4" />,
        onClick: () => mutate(() => sendInvoiceAction(id), t('send'), tActions('confirmSend')),
      },
      {
        key: 'delete',
        label: tActions('delete'),
        icon: <TrashIcon className="h-4 w-4" />,
        danger: true,
        onClick: () =>
          mutate(() => deleteInvoiceAction(id), tToast('deleted'), tActions('confirmDelete')),
      },
    )
  } else if (status === 'sent' || status === 'overdue') {
    items.push(
      {
        key: 'paid',
        label: t('markPaid'),
        icon: <CheckIcon className="h-4 w-4" />,
        onClick: () =>
          mutate(() => markInvoicePaidAction(id), t('markPaid'), tActions('confirmPaid')),
      },
      {
        key: 'reminder',
        label: tActions('reminder'),
        icon: <BellIcon className="h-4 w-4" />,
        onClick: () => mutate(() => sendReminderAction(id), tToast('reminderSent')),
      },
      {
        key: 'cancel',
        label: t('cancel'),
        icon: <BanIcon className="h-4 w-4" />,
        danger: true,
        onClick: () =>
          mutate(() => cancelInvoiceAction(id), t('cancel'), tActions('confirmCancel')),
      },
    )
  } else {
    items.push({
      key: 'duplicate',
      label: tActions('duplicate'),
      icon: <CopyIcon className="h-4 w-4" />,
      onClick: () => mutate(() => duplicateInvoiceAction(id), tToast('duplicated')),
    })
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          disabled={pending}
          aria-label={it.label}
          title={it.label}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            it.onClick()
          }}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40',
            it.danger
              ? 'text-ink/55 hover:bg-neg/10 hover:text-neg'
              : 'text-ink/55 hover:bg-paper-2 hover:text-ink',
          )}
        >
          {it.icon}
        </button>
      ))}
    </div>
  )
}
