'use client'

import { SendIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { sendReminderAction } from '../actions'

export function SendReminderButton({ id }: { id: string }) {
  const t = useTranslations('invoices')
  const tToast = useTranslations('invoices.toast')
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await sendReminderAction(id)
          if (res.error) toast.error(res.error)
          else toast.success(tToast('reminderSent'))
          router.refresh()
        })
      }
      className="inline-flex items-center gap-2 rounded-full bg-brand text-white h-10 px-5 text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <SendIcon className="h-4 w-4" />
      {t('sendReminder')}
    </button>
  )
}
