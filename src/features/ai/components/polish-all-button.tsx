'use client'

import { Button } from '@/components/ui/button'
import { PenLineIcon, SpinnerIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { polishAllLinesAction } from '../actions'

export interface PolishAllItem {
  idx: number
  description: string
}

interface Props {
  /** Non-empty line descriptions with their row index in the form. */
  items: PolishAllItem[]
  onApply: (results: { idx: number; text: string }[]) => void
}

/** Rewrites every line description in one batch for a consistent voice, with undo. */
export function PolishAllButton({ items, onApply }: Props) {
  const t = useTranslations('ai.polish')
  const locale = useLocale()
  const language = locale === 'en' ? 'en' : 'sv'
  const [pending, start] = useTransition()

  const disabled = pending || items.length === 0

  const polishAll = () => {
    const targets = items
    start(async () => {
      const res = await polishAllLinesAction({
        lines: targets.map((i) => i.description),
        language,
      })
      if ('error' in res) {
        toast.error(
          res.error === 'notConfigured'
            ? t('notConfigured')
            : res.error === 'rateLimited'
              ? t('rateLimited')
              : t('error'),
        )
        return
      }
      const previous = targets.map((i) => ({ idx: i.idx, text: i.description }))
      onApply(targets.map((i, n) => ({ idx: i.idx, text: res.lines[n] ?? i.description })))
      toast.success(t('polishedAll', { count: targets.length }), {
        action: { label: t('undo'), onClick: () => onApply(previous) },
      })
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={polishAll}
      disabled={disabled}
      title={t('polishAll')}
    >
      {pending ? (
        <SpinnerIcon className="h-4 w-4 animate-spin" />
      ) : (
        <PenLineIcon className="h-4 w-4" />
      )}
      {t('polishAll')}
    </Button>
  )
}
