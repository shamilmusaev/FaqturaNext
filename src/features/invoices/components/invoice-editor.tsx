'use client'

import { ChevronLeft } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  type EditInvoiceInitial,
  type EditorClient,
  type FormDraft,
  type PreviewOrganization,
  buildPreviewData,
  initialToFormDraft,
} from '../preview-data'
import { InvoiceForm } from './invoice-form'

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
        hideOcr: false,
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

  return (
    <div className="relative flex flex-col gap-4">
      {/* Mobile tab switch: form and preview don't fit side-by-side on phones. */}
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

      <div
        className={cn(
          'grid gap-6 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          previewCollapsed
            ? 'lg:grid-cols-[minmax(0,1fr)_3rem]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
        )}
      >
        <div className={cn(tab !== 'form' && 'hidden', 'lg:block')}>
          <InvoiceForm
            clients={clientOptions}
            cancelHref={cancelHref}
            defaultCurrency={org.currency_default ?? 'SEK'}
            templateId={templateId}
            numberPreview={numberPreview}
            onDraftChange={setDraft}
            mode={mode}
            invoiceId={invoiceId}
            initial={seeded?.draft}
          />
        </div>

        <div className={cn(tab !== 'preview' && 'hidden', 'lg:block')}>
          <div className="relative lg:sticky lg:top-6 lg:overflow-hidden">
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
                className="lg:h-[calc(100vh-7rem)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
