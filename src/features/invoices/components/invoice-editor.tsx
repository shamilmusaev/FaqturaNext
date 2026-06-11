'use client'

import { cn } from '@/lib/cn'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  type EditorClient,
  type FormDraft,
  type PreviewOrganization,
  buildPreviewData,
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
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

type MobileTab = 'form' | 'preview'

export function InvoiceEditor({ clients, org, cancelHref }: Props) {
  const tTabs = useTranslations('invoices.tabs')
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE_ID)
  const [tab, setTab] = useState<MobileTab>('form')

  // Seed with the form's initial state so the preview renders immediately; the
  // form's onDraftChange syncs it on mount and on every edit thereafter.
  const [draft, setDraft] = useState<FormDraft>(() => ({
    clientId: clients[0]?.id ?? '',
    issuedAt: todayPlusDays(0),
    dueAt: todayPlusDays(30),
    currency: org.currency_default ?? 'SEK',
    notes: '',
    lines: [{ description: '', quantity: 1, unit: '', unitPriceCents: 0n, vatRate: 25 }],
  }))

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === draft.clientId) ?? null,
    [clients, draft.clientId],
  )

  const previewData = useMemo(
    () => buildPreviewData(draft, org, selectedClient, '—'),
    [draft, org, selectedClient],
  )

  const clientOptions = useMemo(() => clients.map((c) => ({ id: c.id, name: c.name })), [clients])

  return (
    <div className="flex flex-col gap-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(tab !== 'form' && 'hidden', 'lg:block')}>
          <InvoiceForm
            clients={clientOptions}
            cancelHref={cancelHref}
            defaultCurrency={org.currency_default ?? 'SEK'}
            templateId={templateId}
            onDraftChange={setDraft}
          />
        </div>

        <div className={cn(tab !== 'preview' && 'hidden', 'lg:block')}>
          <div className="lg:sticky lg:top-6">
            <InvoicePreview
              data={previewData}
              templateId={templateId}
              onTemplateChange={setTemplateId}
              className="lg:h-[calc(100vh-7rem)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
