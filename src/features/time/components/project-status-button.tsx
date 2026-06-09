'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { setProjectStatusAction } from '../actions'

interface Props {
  id: string
  status: 'active' | 'closed'
}

export function ProjectStatusButton({ id, status }: Props) {
  const t = useTranslations('time')
  const [pending, startTransition] = useTransition()
  const next = status === 'active' ? 'closed' : 'active'

  const handleClick = () => {
    startTransition(async () => {
      await setProjectStatusAction(id, next)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-ink/60 hover:text-ink disabled:opacity-50"
    >
      {status === 'active' ? t('project.close') : t('project.reopen')}
    </button>
  )
}
