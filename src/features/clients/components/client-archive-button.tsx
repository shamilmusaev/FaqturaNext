'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { archiveClientAction, unarchiveClientAction } from '../actions'

export function ClientArchiveButton({
  id,
  archived,
}: {
  id: string
  archived: boolean
}) {
  const t = useTranslations('clients')
  const [pending, start] = useTransition()
  const confirmKey = archived ? 'actions.confirmUnarchive' : 'actions.confirmArchive'
  const labelKey = archived ? 'unarchive' : 'archive'

  return (
    <Button
      type="button"
      variant={archived ? 'secondary' : 'danger'}
      disabled={pending}
      onClick={() => {
        if (!confirm(t(confirmKey))) return
        start(async () => {
          await (archived ? unarchiveClientAction(id) : archiveClientAction(id))
        })
      }}
    >
      {t(labelKey)}
    </Button>
  )
}
