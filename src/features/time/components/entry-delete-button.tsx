'use client'

import { CloseIcon } from '@/components/ui/icons'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { deleteTimeEntryAction } from '../actions'

export function EntryDeleteButton({ id }: { id: string }) {
  const t = useTranslations('time')
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await deleteTimeEntryAction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={t('log.delete')}
      title={t('log.delete')}
      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-ink/40 hover:text-neg hover:bg-paper-2 disabled:opacity-50"
    >
      <CloseIcon className="h-4 w-4" />
    </button>
  )
}
