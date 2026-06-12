'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown, HelpCircleIcon, SpinnerIcon, WandIcon } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import type { DraftLine } from '@/features/invoices/preview-data'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/money'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { z } from 'zod'
import { MAX_APPLIED_LINES, aiLineToDraftLine, parsePartialLines } from '../convert'
import { AiLineSchema } from '../schema'

const ResponseSchema = z.array(AiLineSchema)

interface Props {
  currency: string
  /** Selected client, so price memory can prefer rates invoiced to them. */
  clientId?: string
  onApply: (lines: DraftLine[]) => void
}

/**
 * Inline, collapsible Magic Fill section. Unlike a modal it stays mounted, so
 * the pasted notes and generated lines survive collapsing — they are cleared
 * only when the user hits "Clear".
 */
export function MagicFillPanel({ currency, clientId, onApply }: Props) {
  const t = useTranslations('ai.magicFill')
  const locale = useLocale()
  const language = locale === 'en' ? 'en' : 'sv'
  const [open, setOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [notes, setNotes] = useState('')

  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: '/api/ai/magic-fill',
    schema: ResponseSchema,
  })

  const lines = parsePartialLines(object).slice(0, MAX_APPLIED_LINES)
  const hasResult = lines.length > 0
  const showEmpty = !isLoading && !error && object !== undefined && !hasResult
  const hasState = notes.trim().length > 0 || object !== undefined

  const generate = () => {
    if (!notes.trim()) return
    submit({ notes: notes.trim(), language, currency, clientId: clientId || undefined })
  }

  const apply = () => {
    if (!hasResult) return
    onApply(lines.map(aiLineToDraftLine))
    toast.success(t('applied', { count: lines.length }))
    // Keep the notes and results so reopening shows them again; collapse only.
    setOpen(false)
  }

  const clearAll = () => {
    setNotes('')
    clear()
  }

  return (
    <div className="rounded-[24px] border border-line-1 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <WandIcon className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold">{t('title')}</span>
        {hasState && !open && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
            {hasResult ? t('apply', { count: lines.length }) : t('draftBadge')}
          </span>
        )}
        <ChevronDown
          className={cn('ml-auto h-4 w-4 text-ink/40 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-ink/60">{t('description')}</p>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-expanded={showHelp}
              aria-label={t('help.toggle')}
              title={t('help.toggle')}
              className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-ink/40 transition-colors hover:text-accent hover:bg-line-1/40"
            >
              <HelpCircleIcon className="h-4 w-4" />
            </button>
          </div>

          {showHelp && (
            <div className="rounded-[16px] border border-line-1 bg-paper p-4 flex flex-col gap-3 text-sm">
              <p className="text-ink/80">{t('help.intro')}</p>
              <ul className="flex flex-col gap-1.5 text-ink/70">
                {['tipTime', 'tipPrice', 'tipGroup', 'tipVat', 'tipLang'].map((key) => (
                  <li key={key} className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>{t(`help.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-ink/40">
                  {t('help.exampleTitle')}
                </span>
                <pre className="whitespace-pre-wrap rounded-[12px] border border-line-1 bg-card px-3 py-2 font-mono text-[13px] text-ink/80">
                  {t('help.example')}
                </pre>
              </div>
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            maxLength={8000}
            placeholder={t('placeholder')}
            className="w-full rounded-[12px] border border-line-1 bg-paper px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          />

          {error && <p className="text-sm text-neg">{t('error')}</p>}
          {showEmpty && <p className="text-sm text-ink/60">{t('empty')}</p>}

          {(hasResult || isLoading) && (
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
              {lines.map((line, idx) => {
                const draft = aiLineToDraftLine(line)
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: streamed list, index is stable per render.
                    key={idx}
                    className="grid grid-cols-[1fr_auto] gap-2 items-center rounded-[12px] border border-line-1 bg-paper px-3 py-2 text-sm"
                  >
                    <span className="truncate">{draft.description}</span>
                    <span className="tnum font-mono text-ink/70 whitespace-nowrap">
                      {draft.quantity}
                      {draft.unit ? ` ${draft.unit}` : ''} ×{' '}
                      {formatMoney(draft.unitPriceCents, currency as 'SEK')}
                    </span>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-ink/50 px-3 py-2">
                  <SpinnerIcon className="h-4 w-4 animate-spin" /> {t('generating')}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {hasState && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="mr-auto"
              >
                {t('clear')}
              </Button>
            )}
            {isLoading ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => stop()}>
                {t('stop')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={generate}
                disabled={!notes.trim()}
              >
                <WandIcon className="h-4 w-4" />
                {hasResult ? t('regenerate') : t('generate')}
              </Button>
            )}
            <Button type="button" size="sm" onClick={apply} disabled={!hasResult || isLoading}>
              {t('apply', { count: lines.length })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
