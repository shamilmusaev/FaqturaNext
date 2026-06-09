'use client'

import { ChevronLeft, ChevronRight } from '@/components/ui/icons'
import { useTransition } from 'react'
import { setTaskStatusAction } from '../actions'
import type { TaskStatus } from '../schema'

const ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

export function TaskStatusControls({ id, status }: { id: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition()
  const index = ORDER.indexOf(status)
  const prev = ORDER[index - 1]
  const next = ORDER[index + 1]

  function move(to: TaskStatus | undefined) {
    if (!to) return
    startTransition(async () => {
      await setTaskStatusAction(id, to)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => move(prev)}
        disabled={pending || !prev}
        aria-label="Move left"
        className="h-7 w-7 inline-flex items-center justify-center rounded-full text-ink/50 hover:text-ink hover:bg-paper-2 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => move(next)}
        disabled={pending || !next}
        aria-label="Move right"
        className="h-7 w-7 inline-flex items-center justify-center rounded-full text-ink/50 hover:text-ink hover:bg-paper-2 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
