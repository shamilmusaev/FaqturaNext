'use client'

import { ChevronLeft, HistoryIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  type EditInvoiceInitial,
  type EditorClient,
  type FormDraft,
  type PreviewOrganization,
  buildPreviewData,
  initialToFormDraft,
} from '../preview-data'
import { InvoiceForm } from './invoice-form'
import { InvoiceVersionsPanel } from './invoice-versions-panel'

// @react-pdf's usePDF is a web-only API that throws during SSR, so the preview
// must render client-side only.
const InvoicePreview = dynamic(() => import('./invoice-preview').then((m) => m.InvoicePreview), {
  ssr: false,
})

interface Props {
  clients: EditorClient[]
  org: PreviewOrganization
  cancelHref: Route
  /** 'edit' loads an existing draft; defaults to 'create'. */
  mode?: 'create' | 'edit'
  /** Serializable snapshot of the existing invoice (edit mode). */
  initial?: EditInvoiceInitial
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const DEFAULT_LINE_COUNT = 5

function emptyDraftLine() {
  return {
    description: '',
    quantity: 1,
    unit: '',
    unitPriceCents: 0n,
    vatRate: 25 as const,
    discountPercent: 0,
  }
}

// Read-only preview of the auto-generated invoice number from the org template.
function previewNumber(tpl?: string | null): string {
  const year = new Date().getFullYear()
  return (tpl || 'INV-{YYYY}-{NNNN}')
    .replace(/\{YYYY\}/g, String(year))
    .replace(/\{YY\}/g, String(year).slice(-2))
    .replace(/\{N+\}/g, 'XXXX')
}

type MobileTab = 'form' | 'preview'

export function InvoiceEditor({ clients, org, cancelHref, mode = 'create', initial }: Props) {
  const tTabs = useTranslations('invoices.tabs')
  const tActions = useTranslations('invoices.actions')
  // Revive the serializable snapshot into the form's bigint shape (client-side,
  // since bigint can't cross the RSC boundary).
  const seeded = useMemo(() => (initial ? initialToFormDraft(initial) : null), [initial])
  const invoiceId = initial?.invoiceId
  const [templateId, setTemplateId] = useState<TemplateId>(
    seeded?.templateId ?? DEFAULT_TEMPLATE_ID,
  )
  const [tab, setTab] = useState<MobileTab>('form')
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [split, setSplit] = useState(50)
  const [versionsOpen, setVersionsOpen] = useState(false)
  // Track the live invoice id from the form's first autosave so the history
  // button becomes available as soon as a draft exists.
  const [liveInvoiceId, setLiveInvoiceId] = useState<string | null>(null)
  const effectiveInvoiceId = invoiceId ?? liveInvoiceId

  // Seed with the form's initial state so the preview renders immediately; the
  // form's onDraftChange syncs it on mount and on every edit thereafter.
  const [draft, setDraft] = useState<FormDraft>(
    () =>
      seeded?.draft ?? {
        clientId: clients[0]?.id ?? '',
        issuedAt: todayPlusDays(0),
        dueAt: todayPlusDays(30),
        deliveryAt: '',
        currency: org.currency_default ?? 'SEK',
        notes: '',
        number: '',
        lines: Array.from({ length: DEFAULT_LINE_COUNT }, emptyDraftLine),
        hideOcr: true,
        reverseVat: false,
        rotRutType: null,
        rotRutCents: 0n,
        ourReference: '',
        theirReference: '',
        orderNumber: '',
      },
  )

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === draft.clientId) ?? null,
    [clients, draft.clientId],
  )

  const previewData = useMemo(
    () => buildPreviewData(draft, org, selectedClient, '—'),
    [draft, org, selectedClient],
  )

  const clientOptions = useMemo(() => clients.map((c) => ({ id: c.id, name: c.name })), [clients])
  const numberPreview = useMemo(() => previewNumber(org.invoice_number_template), [org])
  const gridColumns = previewCollapsed
    ? 'minmax(0,1fr) 0 3rem'
    : `minmax(24rem,${split}fr) 0.75rem minmax(24rem,${100 - split}fr)`
  const startResize = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const grid = event.currentTarget.parentElement
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const onMove = (moveEvent: PointerEvent) => {
      const next = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setSplit(Math.min(64, Math.max(36, next)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }, [])

  return (
    <div className="relative flex flex-col gap-4 lg:h-[calc(100vh-7rem)] lg:min-h-0">
      {/* Mobile tab switch: form and preview don't fit side-by-side on phones. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-paper-2 p-1 lg:hidden">
          {(['form', 'preview'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === key ? 'bg-card text-ink shadow-soft' : 'text-ink/55',
              )}
            >
              {tTabs(key)}
            </button>
          ))}
        </div>
        {effectiveInvoiceId && (
          <button
            type="button"
            onClick={() => setVersionsOpen(true)}
            aria-label={tActions('history')}
            title={tActions('history')}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line-1 bg-card px-3.5 text-sm font-medium hover:bg-paper transition-colors"
          >
            <HistoryIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{tActions('history')}</span>
          </button>
        )}
      </div>

      <div
        className={cn(
          'grid gap-4 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:h-full lg:min-h-0 lg:grid-cols-[var(--invoice-editor-cols)] lg:items-start',
        )}
        style={{ '--invoice-editor-cols': gridColumns } as CSSProperties}
      >
        <div
          className={cn(
            tab !== 'form' && 'hidden',
            'lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:pb-6 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden',
          )}
        >
          <InvoiceForm
            clients={clientOptions}
            cancelHref={cancelHref}
            defaultCurrency={org.currency_default ?? 'SEK'}
            templateId={templateId}
            numberPreview={numberPreview}
            onDraftChange={setDraft}
            onInvoiceIdChange={setLiveInvoiceId}
            mode={mode}
            invoiceId={invoiceId}
            initial={seeded?.draft}
          />
        </div>

        <button
          type="button"
          aria-label="Resize preview"
          onPointerDown={startResize}
          className={cn(
            'hidden h-full cursor-col-resize rounded-full bg-card/70 transition-colors hover:bg-line-2 active:bg-brand/35 lg:block',
            previewCollapsed && 'pointer-events-none opacity-0',
          )}
        />

        <div
          className={cn(
            tab !== 'preview' && 'hidden',
            'lg:sticky lg:top-24 lg:block lg:h-full lg:min-h-0 lg:overflow-hidden',
          )}
        >
          <div className="relative lg:h-full lg:min-h-0 lg:overflow-hidden">
            {/* Reopen control: sits at the top of the thin rail (sticky, always
                in view), fades in once the panel is collapsed. */}
            <button
              type="button"
              onClick={() => setPreviewCollapsed(false)}
              aria-label={tActions('showPreview')}
              title={tActions('showPreview')}
              className={cn(
                'absolute left-1/2 top-0 z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-paper-2 text-ink/60 shadow-soft transition-opacity duration-300 ease-out hover:bg-card hover:text-ink lg:flex',
                previewCollapsed ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Content fades out fast (250ms) so the width close (500ms) never
                shows the PDF reflowing — the fade masks it. */}
            <div
              className={cn(
                'transition-opacity duration-[250ms] ease-out',
                previewCollapsed && 'pointer-events-none opacity-0',
              )}
            >
              <InvoicePreview
                data={previewData}
                templateId={templateId}
                onTemplateChange={setTemplateId}
                onToggleCollapsed={() => setPreviewCollapsed(true)}
                className="lg:h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {effectiveInvoiceId && (
        <InvoiceVersionsPanel
          invoiceId={effectiveInvoiceId}
          open={versionsOpen}
          onClose={() => setVersionsOpen(false)}
        />
      )}
    </div>
  )
}
