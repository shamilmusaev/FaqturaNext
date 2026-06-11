'use client'

import { DownloadIcon, EyeIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import {
  FONT_OPTIONS,
  type FontId,
  INVOICE_TEMPLATES,
  type InvoicePdfData,
  type TemplateId,
  getTemplate,
} from '@/lib/pdf/templates'
import { usePDF } from '@react-pdf/renderer'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [font, setFont] = useState<FontId>('sans')
  const { Component } = getTemplate(templateId)

  // The document element only changes when the data, template or font actually
  // changes — NOT on every render. This is what keeps the preview from
  // re-rendering in a loop (usePDF's `update` identity is unstable).
  const doc = useMemo(() => <Component invoice={{ ...data, font }} />, [Component, data, font])
  const [instance, update] = usePDF({ document: doc })
  const isFirst = useRef(true)

  // `update` is intentionally excluded from deps: its identity changes every
  // render, and including it would re-fire this effect in a loop.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see note above
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const id = setTimeout(() => update(doc), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [doc])

  // Double-buffer the iframe to avoid the white flash on every re-render: keep
  // the last two blob URLs mounted and only reveal the new one once it has
  // finished loading, so the visible frame never blanks out.
  const [stack, setStack] = useState<string[]>([])
  const [loaded, setLoaded] = useState<string[]>([])
  useEffect(() => {
    const u = instance.url
    if (!u || instance.error) return
    setStack((prev) => (prev[prev.length - 1] === u ? prev : [...prev, u].slice(-2)))
  }, [instance.url, instance.error])

  const top = stack[stack.length - 1]
  const visible = top && loaded.includes(top) ? top : (stack[0] ?? top)

  const safeNumber = data.number.replace(/[^\w-]/g, '').trim()
  const fileName = safeNumber ? `Faktura-${safeNumber}.pdf` : 'faktura.pdf'
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

      {/* Toolbar (same pill style as templates): font + view + download */}
      <div className="flex items-center gap-1 self-center rounded-full bg-paper-2 p-1">
        {FONT_OPTIONS.map((f) => {
          const active = f.id === font
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFont(f.id)}
              aria-pressed={active}
              title={`${t('font')}: ${f.name}`}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-card text-ink shadow-soft'
                  : 'text-ink/55 hover:text-ink hover:bg-card/60',
              )}
            >
              {f.name}
            </button>
          )
        })}
        <span className="mx-1 h-4 w-px bg-line-2/60" />
        <a
          href={instance.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!instance.url || !!instance.error}
          title={t('view')}
          aria-label={t('view')}
          className={toolBtn}
        >
          <EyeIcon className="h-4 w-4" />
        </a>
        <a
          href={instance.url ?? undefined}
          download={fileName}
          aria-disabled={!instance.url || !!instance.error}
          title={t('download')}
          aria-label={t('download')}
          className={toolBtn}
        >
          <DownloadIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="relative flex-1 min-h-[420px] overflow-hidden rounded-[16px] border border-line-1 bg-paper-2">
        {stack.length === 0 && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink/45">
            {instance.error ? t('error') : t('empty')}
          </div>
        )}

        {stack.map((u) => (
          <iframe
            key={u}
            title={t('title')}
            src={`${u}#toolbar=0&navpanes=0&view=FitH`}
            onLoad={() => setLoaded((prev) => (prev.includes(u) ? prev : [...prev, u]))}
            className="absolute inset-0 h-full w-full transition-opacity duration-200"
            style={{ opacity: u === visible ? 1 : 0 }}
          />
        ))}

        {instance.loading && (
          <div className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-white">
            {t('updating')}
          </div>
        )}
      </div>
    </div>
  )
}
