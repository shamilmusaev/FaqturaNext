'use client'

import { CopyIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { duplicateInvoiceAction } from '../actions'

export function DuplicateInvoiceButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const tActions = useTranslations('invoices.actions')
  const tToast = useTranslations('invoices.toast')
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={tActions('duplicate')}
      title={tActions('duplicate')}
      onClick={() =>
        start(async () => {
          const res = await duplicateInvoiceAction(id)
          if (res.error) {
            toast.error(res.error)
            return
          }
          if (res.invoiceId) {
            toast.success(tToast('duplicated'))
            router.push(`/invoices/${res.invoiceId}` as Route)
          }
        })
      }
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card text-ink/70 hover:text-ink hover:bg-paper-2 disabled:opacity-50"
    >
      <CopyIcon className="h-4 w-4" />
    </button>
  )
}
