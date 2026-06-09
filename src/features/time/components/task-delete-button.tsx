'use client'

import { CloseIcon } from '@/components/ui/icons'
import { useTransition } from 'react'
import { deleteTaskAction } from '../actions'

export function TaskDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => void (await deleteTaskAction(id)))}
      disabled={pending}
      aria-label="Delete task"
      className="h-7 w-7 inline-flex items-center justify-center rounded-full text-ink/40 hover:text-neg hover:bg-paper-2 disabled:opacity-50"
    >
      <CloseIcon className="h-3.5 w-3.5" />
    </button>
  )
}
