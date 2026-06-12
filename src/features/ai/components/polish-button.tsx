'use client'

import { PenLineIcon, SpinnerIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { polishTextAction } from '../actions'

interface Props {
  value: string
  context: 'line' | 'notes'
  onReplace: (text: string) => void
  /** Other line descriptions on the invoice, so the rewrite matches their style. */
  siblings?: string[]
  className?: string
}

/** Pen button that rewrites the adjacent field professionally, with undo. */
export function PolishButton({ value, context, onReplace, siblings, className }: Props) {
  const t = useTranslations('ai.polish')
  const locale = useLocale()
  const language = locale === 'en' ? 'en' : 'sv'
  const [pending, start] = useTransition()

  const disabled = pending || value.trim().length < 3

  const polish = () => {
    const previous = value
    start(async () => {
      const res = await polishTextAction({
        text: previous,
        context,
        language,
        siblings: siblings?.filter((s) => s.trim() && s.trim() !== previous.trim()).slice(0, 20),
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
      onReplace(res.text)
      toast.success(t('polished'), {
        action: { label: t('undo'), onClick: () => onReplace(previous) },
      })
    })
  }

  return (
    <button
      type="button"
      onClick={polish}
      disabled={disabled}
      aria-label={t('button')}
      title={t('button')}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1 text-ink/40 transition-colors hover:text-accent hover:bg-line-1/40 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {pending ? (
        <SpinnerIcon className="h-4 w-4 animate-spin" />
      ) : (
        <PenLineIcon className="h-4 w-4" />
      )}
    </button>
  )
}
