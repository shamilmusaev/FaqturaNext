'use client'

import { DownloadIcon, EyeIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import {
  INVOICE_TEMPLATES,
  type InvoicePdfData,
  type TemplateId,
  getTemplate,
} from '@/lib/pdf/templates'
import { usePDF } from '@react-pdf/renderer'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

interface Props {
  data: InvoicePdfData
  templateId: TemplateId
  onTemplateChange?: (id: TemplateId) => void
  showTemplatePicker?: boolean
  className?: string
}

// Re-rendering a PDF reloads the iframe (a brief flash), so coalesce edits into
// one render per quiet window. Longer window = calmer preview while typing.
const DEBOUNCE_MS = 800

export function InvoicePreview({
  data,
  templateId,
  onTemplateChange,
  showTemplatePicker = true,
  className,
}: Props) {
  const t = useTranslations('invoices.preview')
  const { Component } = getTemplate(templateId)
  const [instance, update] = usePDF({ document: <Component invoice={data} /> })
  const isFirst = useRef(true)

  useEffect(() => {
    // The first render already rendered via usePDF's initial document; only
    // debounce subsequent edits and template switches.
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const id = setTimeout(() => update(<Component invoice={data} />), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [data, Component, update])

  const safeNumber = data.number.replace(/[^\w-]/g, '').trim()
  const fileName = safeNumber ? `Faktura-${safeNumber}.pdf` : 'faktura.pdf'

  const ready = Boolean(instance.url && !instance.error)
  const toolBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/55 transition-colors hover:bg-card hover:text-ink aria-disabled:opacity-40 aria-disabled:pointer-events-none'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {showTemplatePicker && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/50 mr-1">{t('template')}</span>
          <div className="flex flex-wrap gap-1 rounded-full bg-paper-2 p-1">
            {INVOICE_TEMPLATES.map((tpl) => {
              const active = tpl.id === templateId
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onTemplateChange?.(tpl.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-card text-ink shadow-soft'
                      : 'text-ink/55 hover:text-ink hover:bg-card/60',
                  )}
                >
                  {tpl.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Toolbar (same pill style as templates): view + download */}
      <div className="flex items-center gap-1 self-start rounded-full bg-paper-2 p-1">
        <a
          href={instance.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!ready}
          title={t('view')}
          aria-label={t('view')}
          className={toolBtn}
        >
          <EyeIcon className="h-4 w-4" />
        </a>
        <a
          href={instance.url ?? undefined}
          download={fileName}
          aria-disabled={!ready}
          title={t('download')}
          aria-label={t('download')}
          className={toolBtn}
        >
          <DownloadIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="relative flex-1 min-h-[420px] overflow-hidden rounded-[16px] border border-line-1 bg-paper-2">
        {instance.url && !instance.error ? (
          <iframe
            title={t('title')}
            src={`${instance.url}#toolbar=0&navpanes=0&view=FitH`}
            className="h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink/45">
            {instance.error ? t('error') : t('empty')}
          </div>
        )}

        {instance.loading && (
          <div className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-white">
            {t('updating')}
          </div>
        )}
      </div>
    </div>
  )
}
