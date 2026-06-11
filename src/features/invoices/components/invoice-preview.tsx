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
import { registerInvoiceFonts } from '@/lib/pdf/templates/register-fonts'
import { pdf } from '@react-pdf/renderer'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Bundled fonts are client-only; this module only loads in the browser.
registerInvoiceFonts()

const FONT_SELECT_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238b8579' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  backgroundSize: '12px',
}

interface Props {
  data: InvoicePdfData
  templateId: TemplateId
  onTemplateChange?: (id: TemplateId) => void
  showTemplatePicker?: boolean
  className?: string
}

interface PreviewFrame {
  url: string
  pages: string[]
}

const REVOKE_DELAY_MS = 800
const QUICK_PREVIEW_SCALE = 1.25
const SHARP_PREVIEW_SCALE = 1.75
const QUICK_MAX_DEVICE_SCALE = 1.25
const SHARP_MAX_DEVICE_SCALE = 2
const SHARP_RENDER_DELAY_MS = 450

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

  const doc = useMemo(() => <Component invoice={{ ...data, font }} />, [Component, data, font])
  const renderId = useRef(0)
  const sharpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revokeTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const framesRef = useRef<PreviewFrame[]>([])
  const [frames, setFrames] = useState<PreviewFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    renderId.current += 1
    const id = renderId.current
    setLoading(true)
    setError(null)
    if (sharpTimer.current) clearTimeout(sharpTimer.current)

    pdf(doc)
      .toBlob()
      .then(async (blob) => {
        const pages = await renderPdfPages(blob, {
          scale: QUICK_PREVIEW_SCALE,
          maxDeviceScale: QUICK_MAX_DEVICE_SCALE,
        })
        const url = URL.createObjectURL(blob)
        if (id !== renderId.current) {
          URL.revokeObjectURL(url)
          return
        }
        setFrames((prev) => {
          scheduleRevoke(prev.map((frame) => frame.url))
          return [{ url, pages }]
        })
        sharpTimer.current = setTimeout(() => {
          renderPdfPages(blob, {
            scale: SHARP_PREVIEW_SCALE,
            maxDeviceScale: SHARP_MAX_DEVICE_SCALE,
          })
            .then((sharpPages) => {
              if (id !== renderId.current) return
              setFrames((prev) =>
                prev.map((frame) => (frame.url === url ? { ...frame, pages: sharpPages } : frame)),
              )
            })
            .catch((err: unknown) => {
              if (id === renderId.current) setError(err)
            })
        }, SHARP_RENDER_DELAY_MS)
      })
      .catch((err: unknown) => {
        if (id === renderId.current) setError(err)
      })
      .finally(() => {
        if (id === renderId.current) setLoading(false)
      })
  }, [doc])

  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  useEffect(() => {
    return () => {
      if (sharpTimer.current) clearTimeout(sharpTimer.current)
      for (const timer of revokeTimers.current) clearTimeout(timer)
      for (const frame of framesRef.current) URL.revokeObjectURL(frame.url)
    }
  }, [])

  const scheduleRevoke = useCallback((urls: string[]) => {
    if (urls.length === 0) return
    const timer = setTimeout(() => {
      for (const url of urls) URL.revokeObjectURL(url)
      revokeTimers.current = revokeTimers.current.filter((t) => t !== timer)
    }, REVOKE_DELAY_MS)
    revokeTimers.current.push(timer)
  }, [])

  const visibleFrame = frames.at(-1)
  const currentUrl = visibleFrame?.url

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
        <select
          value={font}
          onChange={(e) => setFont(e.target.value as FontId)}
          aria-label={t('font')}
          title={t('font')}
          className="h-8 cursor-pointer appearance-none rounded-full bg-card pl-3 pr-7 text-xs font-medium text-ink shadow-soft outline-none"
          style={FONT_SELECT_STYLE}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <span className="mx-1 h-4 w-px bg-line-2/60" />
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!currentUrl || !!error}
          title={t('view')}
          aria-label={t('view')}
          className={toolBtn}
        >
          <EyeIcon className="h-4 w-4" />
        </a>
        <a
          href={currentUrl}
          download={fileName}
          aria-disabled={!currentUrl || !!error}
          title={t('download')}
          aria-label={t('download')}
          className={toolBtn}
        >
          <DownloadIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="relative flex-1 min-h-[420px] overflow-auto rounded-[16px] bg-transparent p-2">
        {frames.length === 0 && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink/45">
            {error ? t('error') : t('empty')}
          </div>
        )}

        {visibleFrame && (
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            {visibleFrame.pages.map((src, idx) => (
              <img
                key={`${visibleFrame.url}-${idx}`}
                src={src}
                alt={`${t('title')} ${idx + 1}`}
                className="h-auto w-full bg-white shadow-soft"
                draggable={false}
              />
            ))}
          </div>
        )}

        {loading && frames.length > 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-white">
            {t('updating')}
          </div>
        )}
      </div>
    </div>
  )
}

async function renderPdfPages(
  blob: Blob,
  options: { scale: number; maxDeviceScale: number },
): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString()

  const bytes = new Uint8Array(await blob.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data: bytes })
  const document = await loadingTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: options.scale })
    const outputScale = Math.min(window.devicePixelRatio || 1, options.maxDeviceScale)
    const canvas = window.document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) continue

    canvas.width = Math.ceil(viewport.width * outputScale)
    canvas.height = Math.ceil(viewport.height * outputScale)
    canvas.style.width = `${Math.ceil(viewport.width)}px`
    canvas.style.height = `${Math.ceil(viewport.height)}px`

    context.setTransform(outputScale, 0, 0, outputScale, 0, 0)
    await page.render({ canvasContext: context, viewport }).promise
    pages.push(canvas.toDataURL('image/png'))
    page.cleanup()
  }

  await loadingTask.destroy()
  return pages
}
