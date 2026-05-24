'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cancelInvoiceAction, markInvoicePaidAction, sendInvoiceAction } from '../actions'
import type { InvoiceStatus } from '../schema'

export function InvoiceActions({ id, status }: { id: string; status: InvoiceStatus }) {
  const t = useTranslations('invoices')
  const tActions = useTranslations('invoices.actions')
  const router = useRouter()
  const [pending, start] = useTransition()

  const run = async (
    confirmKey: 'confirmSend' | 'confirmPaid' | 'confirmCancel',
    action: () => Promise<{ error?: string }>,
    successMessage: string,
  ) => {
    if (!confirm(tActions(confirmKey))) return
    start(async () => {
      const res = await action()
      if (res.error) toast.error(res.error)
      else toast.success(successMessage)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'draft' && (
        <Button
          type="button"
          disabled={pending}
          onClick={() => run('confirmSend', () => sendInvoiceAction(id), t('send'))}
        >
          {t('send')}
        </Button>
      )}
      {(status === 'sent' || status === 'overdue') && (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run('confirmPaid', () => markInvoicePaidAction(id), t('markPaid'))}
        >
          {t('markPaid')}
        </Button>
      )}
      {status !== 'cancelled' && status !== 'paid' && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => run('confirmCancel', () => cancelInvoiceAction(id), t('cancel'))}
        >
          {t('cancel')}
        </Button>
      )}
    </div>
  )
}
