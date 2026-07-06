'use client'

import { Chip } from '@/components/ui/chip'
import { CloseIcon } from '@/components/ui/icons'
import {
  type InvoicePreviewPayload,
  fetchInvoiceForDialog,
  fetchInvoicePreviewData,
  setInvoiceTemplateAction,
} from '@/features/invoices/actions'
import type { InvoiceDetail } from '@/features/invoices/queries'
import type { InvoiceStatus } from '@/features/invoices/schema'
import { formatMoney, formatQty } from '@/lib/money'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useLocale, useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useState } from 'react'
import { InvoiceQuickActions } from './invoice-quick-actions'

// Lazy-loaded so @react-pdf is only fetched when the user opens the preview,
// keeping it out of the invoice list bundle.
const InvoicePreview = dynamic(() => import('./invoice-preview').then((m) => m.InvoicePreview), {
  ssr: false,
})

const STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'pos' | 'warn' | 'neg' | 'brand'> = {
  draft: 'neutral',
  sent: 'brand',
  paid: 'pos',
  overdue: 'neg',
  cancelled: 'neutral',
}

const EVENT_DOT: Record<string, string> = {
  created: 'bg-ink-3',
  sent: 'bg-brand',
  viewed: 'bg-info',
  reminder_sent: 'bg-warn',
  marked_paid: 'bg-pos',
  cancelled: 'bg-neg',
  note_added: 'bg-ink-3',
}

interface Props {
  invoiceId: string
  /** Trigger element (uncontrolled mode). Omit when controlling via `open`. */
  children?: ReactNode
  /** Controlled open state (e.g. opened by a card's View action). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Invoice detail in a client-side dialog. Opens over the current page (no URL
 * change), so sidebar context is preserved. Read-only content plus a row of
 * status-aware quick actions in the header.
 */
export function InvoiceDetailDialog({
  invoiceId,
  children,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'detail' | 'preview'>('detail')
  const [preview, setPreview] = useState<InvoicePreviewPayload | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE_ID)
  const t = useTranslations('invoices')
  const tPreview = useTranslations('invoices.preview')
  const tFields = useTranslations('invoices.fields')
  const tStatus = useTranslations('invoiceStatus')
  const tTimeline = useTranslations('invoices.timeline')
  const locale = useLocale()

  useEffect(() => {
    if (!open || invoice || loading) return
    setLoading(true)
    fetchInvoiceForDialog(invoiceId)
      .then((res) => setInvoice(res))
      .finally(() => setLoading(false))
  }, [open, invoiceId, invoice, loading])

  const openPreview = () => {
    setMode('preview')
    if (preview || previewLoading) return
    setPreviewLoading(true)
    fetchInvoicePreviewData(invoiceId)
      .then((res) => {
        if (res) {
          setPreview(res)
          setPreviewTemplate(res.template)
        }
      })
      .finally(() => setPreviewLoading(false))
  }

  const onTemplateChange = (id: TemplateId) => {
    setPreviewTemplate(id)
    setPreview((prev) => (prev ? { ...prev, template: id } : prev))
    // Persist the choice so the downloaded PDF matches; ignore failures (the
    // preview already reflects the new template locally).
    void setInvoiceTemplateAction(invoiceId, id)
  }

  const currency = (invoice?.currency || 'SEK') as 'SEK'
  const dateTimeFmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      {children && <RadixDialog.Trigger asChild>{children}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-md data-[state=open]:animate-[overlay-in_240ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[overlay-out_200ms_ease-in]" />
        <RadixDialog.Content className="fixed right-0 top-0 z-50 h-screen w-full bg-paper overflow-y-auto shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-[sheet-in-right_340ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[sheet-out-right_240ms_cubic-bezier(0.55,0,1,0.45)] md:w-[720px]">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-7 py-5 border-b border-line-1 bg-paper">
            <div className="flex items-center gap-3">
              <RadixDialog.Close
                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card hover:bg-paper transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </RadixDialog.Close>
              <RadixDialog.Title className="text-base font-semibold">
                {invoice
                  ? `${invoice.number ?? '—'} · ${invoice.client?.name ?? 'N/A'}`
                  : t('newInvoice')}
              </RadixDialog.Title>
            </div>
            {invoice && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-full bg-paper-2 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    aria-pressed={mode === 'detail'}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      mode === 'detail' ? 'bg-card text-ink shadow-soft' : 'text-ink/55'
                    }`}
                  >
                    {t('tabs.detail')}
                  </button>
                  <button
                    type="button"
                    onClick={openPreview}
                    aria-pressed={mode === 'preview'}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      mode === 'preview' ? 'bg-card text-ink shadow-soft' : 'text-ink/55'
                    }`}
                  >
                    {tPreview('open')}
                  </button>
                </div>
                <InvoiceQuickActions
                  invoice={{ id: invoice.id, status: invoice.status, number: invoice.number }}
                  showView={false}
                  onDone={() => setOpen(false)}
                />
                <a
                  href={`/api/invoices/${invoiceId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex h-9 items-center rounded-full border border-line-1 bg-card px-3.5 text-sm font-medium hover:bg-paper transition-colors"
                >
                  PDF
                </a>
              </div>
            )}
          </div>

          <div className="p-7">
            {invoice && mode === 'preview' ? (
              preview ? (
                <InvoicePreview
                  data={preview.data}
                  templateId={previewTemplate}
                  onTemplateChange={onTemplateChange}
                  className="h-[calc(100vh-9rem)]"
                />
              ) : (
                <div className="h-[calc(100vh-9rem)] rounded-[16px] bg-paper-2 animate-pulse" />
              )
            ) : loading && !invoice ? (
              <div className="space-y-4">
                <div className="h-24 rounded-[24px] bg-paper-2 animate-pulse" />
                <div className="h-40 rounded-[24px] bg-paper-2 animate-pulse" />
                <div className="h-32 rounded-[24px] bg-paper-2 animate-pulse" />
              </div>
            ) : invoice ? (
              <div className="flex flex-col gap-6">
                <section className="rounded-[24px] border border-line-1 bg-card p-7 flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <Chip tone={STATUS_TONE[invoice.status as InvoiceStatus]}>
                      {tStatus(invoice.status)}
                    </Chip>
                    <div className="mt-3 text-5xl font-semibold tracking-tight tnum font-mono">
                      {formatMoney(BigInt(invoice.total_cents), currency)}
                    </div>
                    <div className="mt-1 text-sm text-ink/70">
                      {tFields('dueAt')} {invoice.due_at}
                      {invoice.status === 'overdue' && (
                        <span className="ml-2 text-neg">· {t('overdueLabel')}</span>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-line-1 bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="text-ink/60 text-xs uppercase tracking-wide">
                      <tr className="border-b border-line-1">
                        <th className="text-left font-medium px-4 py-3">
                          {tFields('description')}
                        </th>
                        <th className="text-right font-medium px-4 py-3">{tFields('quantity')}</th>
                        <th className="text-right font-medium px-4 py-3">{tFields('unitPrice')}</th>
                        <th className="text-right font-medium px-4 py-3">{tFields('vat')}</th>
                        <th className="text-right font-medium px-4 py-3">{tFields('amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((li) => (
                        <tr key={li.id} className="border-b border-line-1 last:border-0">
                          <td className="px-4 py-3">{li.description}</td>
                          <td className="px-4 py-3 text-right tnum font-mono">
                            {formatQty(li.quantity)}
                          </td>
                          <td className="px-4 py-3 text-right tnum font-mono">
                            {formatMoney(BigInt(li.unit_price_cents), currency)}
                          </td>
                          <td className="px-4 py-3 text-right">{li.vat_rate}%</td>
                          <td className="px-4 py-3 text-right tnum font-mono">
                            {formatMoney(BigInt(li.amount_cents), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="rounded-[24px] border border-line-1 bg-card p-4 ml-auto w-full md:w-auto md:min-w-[280px]">
                  <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
                    <dt className="text-ink/60">{tFields('subtotal')}</dt>
                    <dd className="tnum font-mono">
                      {formatMoney(BigInt(invoice.subtotal_cents), currency)}
                    </dd>
                    <dt className="text-ink/60">{tFields('vatTotal')}</dt>
                    <dd className="tnum font-mono">
                      {formatMoney(BigInt(invoice.vat_cents), currency)}
                    </dd>
                    <dt className="font-semibold pt-2 border-t border-line-1 mt-1">
                      {tFields('total')}
                    </dt>
                    <dd className="tnum font-mono font-semibold pt-2 border-t border-line-1 mt-1">
                      {formatMoney(BigInt(invoice.total_cents), currency)}
                    </dd>
                  </dl>
                </section>

                {invoice.events.length > 0 && (
                  <section className="rounded-[24px] border border-line-1 bg-card p-6 flex flex-col gap-4">
                    <h2 className="text-lg font-semibold tracking-tight">{tTimeline('title')}</h2>
                    <ol className="flex flex-col">
                      {invoice.events.map((e) => (
                        <li
                          key={e.id}
                          className="grid grid-cols-[110px_24px_1fr] items-center gap-3 py-2.5 border-b border-line-1 last:border-0"
                        >
                          <span className="text-xs text-ink-3 tabular-nums">
                            {dateTimeFmt.format(new Date(e.created_at))}
                          </span>
                          <span className="inline-flex items-center justify-center">
                            <span
                              className={`h-2 w-2 rounded-full ${EVENT_DOT[e.type] ?? 'bg-ink-3'}`}
                            />
                          </span>
                          <span className="text-sm">{tTimeline(e.type)}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
