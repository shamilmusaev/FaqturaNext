'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { deleteProjectAction } from '../actions'

interface Props {
  id: string
}

export function ProjectDeleteButton({ id }: Props) {
  const t = useTranslations('time')
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!window.confirm(t('project.deleteConfirm'))) return
    startTransition(async () => {
      await deleteProjectAction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-ink/50 hover:text-neg disabled:opacity-50"
    >
      {t('project.delete')}
    </button>
  )
}
