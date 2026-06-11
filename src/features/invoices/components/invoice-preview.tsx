'use client'

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

// Re-rendering a PDF on every keystroke is expensive, so we coalesce changes
// into one render per quiet window.
const DEBOUNCE_MS = 300

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

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        {showTemplatePicker ? (
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
        ) : (
          <span />
        )}

        {instance.url && !instance.error && (
          <a
            href={instance.url}
            download={fileName}
            className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-medium text-white hover:bg-ink/90 transition-colors"
          >
            {t('download')}
          </a>
        )}
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
