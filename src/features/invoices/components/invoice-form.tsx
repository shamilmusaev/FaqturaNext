'use client'

import { Button } from '@/components/ui/button'
import { CloseIcon, PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { toast } from '@/components/ui/toast'
import { addCents, formatMoney } from '@/lib/money'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { createInvoiceAction } from '../actions'
import type { DraftLine, FormDraft } from '../preview-data'
import type { InvoiceInput, LineItemInput, RotRutType } from '../schema'
import { type SwedishVatRate, calcInvoiceTotals } from '../vat'

interface ClientOption {
  id: string
  name: string
}

interface Props {
  clients: ClientOption[]
  cancelHref: Route
  defaultCurrency?: string
  /** Currently selected template, submitted alongside the invoice. */
  templateId?: TemplateId
  /** Emits the live draft on every change so a sibling preview can render it. */
  onDraftChange?: (draft: FormDraft) => void
  onCancel?: () => void
  onSuccess?: () => void
}

const VAT_RATES: SwedishVatRate[] = [25, 12, 6, 0]

function emptyLine(): DraftLine {
  return {
    description: '',
    quantity: 1,
    unit: '',
    unitPriceCents: 0n,
    vatRate: 25,
    discountPercent: 0,
  }
}

const PAYMENT_TERMS = [10, 14, 30, 45, 60] as const

// Shared <select> styling: custom chevron with comfortable right padding so the
// arrow never crowds the border or the text.
const SELECT_CLASS =
  'h-11 w-full appearance-none rounded-[12px] border border-line-1 bg-card pl-3 pr-9 text-[15px]'
const SELECT_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b8579' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '16px',
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function InvoiceForm({
  clients,
  cancelHref,
  defaultCurrency = 'SEK',
  templateId = DEFAULT_TEMPLATE_ID,
  onDraftChange,
  onCancel,
  onSuccess,
}: Props) {
  const t = useTranslations('invoices')
  const tFields = useTranslations('invoices.fields')
  const tActions = useTranslations('invoices.actions')
  const tErrors = useTranslations('invoices.errors')
  const tToast = useTranslations('invoices.toast')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [issuedAt, setIssuedAt] = useState(todayPlusDays(0))
  const [dueAt, setDueAt] = useState(todayPlusDays(30))
  const [currency, setCurrency] = useState(defaultCurrency)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [serverError, setServerError] = useState<string | null>(null)
  // Swedish invoice fields (Phase 2).
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [reverseVat, setReverseVat] = useState(false)
  const [rotRutType, setRotRutType] = useState<RotRutType | ''>('')
  const [rotRutCents, setRotRutCents] = useState(0n)
  const [ourReference, setOurReference] = useState('')
  const [theirReference, setTheirReference] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  // Bumped by fillMockData to remount the uncontrolled MoneyInputs so they pick
  // up the new defaultValueCents.
  const [seedVersion, setSeedVersion] = useState(0)

  const rotRutActive = rotRutType !== '' && rotRutCents > 0n

  const totals = useMemo(() => {
    return calcInvoiceTotals(
      lines.map((l) => ({
        quantity: Number(l.quantity) || 0,
        unitPriceCents: l.unitPriceCents,
        vatRate: l.vatRate,
        discountPercent: l.discountPercent,
      })),
      { reverseVat, rotRutCents: rotRutActive ? rotRutCents : 0n },
    )
  }, [lines, reverseVat, rotRutActive, rotRutCents])

  // Mirror the live draft up to the editor so the preview can re-render. Effect
  // (not inline) keeps render pure and runs after each committed state change.
  useEffect(() => {
    onDraftChange?.({
      clientId,
      issuedAt,
      dueAt,
      currency,
      notes,
      lines,
      reverseVat,
      rotRutType: rotRutType || null,
      rotRutCents: rotRutActive ? rotRutCents : 0n,
      ourReference,
      theirReference,
      orderNumber,
    })
  }, [
    onDraftChange,
    clientId,
    issuedAt,
    dueAt,
    currency,
    notes,
    lines,
    reverseVat,
    rotRutType,
    rotRutActive,
    rotRutCents,
    ourReference,
    theirReference,
    orderNumber,
  ])

  // Keep the due date in step with the payment-terms shortcut.
  const applyPaymentTerms = (days: number) => {
    setPaymentTermsDays(days)
    const base = new Date(issuedAt)
    if (!Number.isNaN(base.getTime())) {
      base.setDate(base.getDate() + days)
      setDueAt(base.toISOString().slice(0, 10))
    }
  }

  const updateLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  // Dev convenience: fill every field with realistic sample data so the preview
  // shows a complete invoice in one click.
  const fillMockData = () => {
    setClientId(clients[0]?.id ?? '')
    setIssuedAt(todayPlusDays(0))
    setDueAt(todayPlusDays(30))
    setPaymentTermsDays(30)
    setCurrency('SEK')
    setNotes('Tack för förtroendet! Betalning inom 30 dagar.')
    setOurReference('Anna Lind')
    setTheirReference('Erik Svensson')
    setOrderNumber('PO-2026-077')
    setReverseVat(false)
    setRotRutType('')
    setRotRutCents(0n)
    setLines([
      {
        description: 'Webbdesign & UI/UX',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 1000000n,
        vatRate: 25,
        discountPercent: 0,
      },
      {
        description: 'Frontend-utveckling',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 1500000n,
        vatRate: 25,
        discountPercent: 0,
      },
      {
        description: 'Backend-utveckling',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 1800000n,
        vatRate: 25,
        discountPercent: 10,
      },
      {
        description: 'CMS-integration',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 700000n,
        vatRate: 25,
        discountPercent: 0,
      },
      {
        description: 'Testing & QA',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 500000n,
        vatRate: 25,
        discountPercent: 0,
      },
      {
        description: 'Lansering & Support',
        quantity: 1,
        unit: 'st',
        unitPriceCents: 500000n,
        vatRate: 25,
        discountPercent: 0,
      },
      {
        description: 'Konsulttid',
        quantity: 8,
        unit: 'h',
        unitPriceCents: 95000n,
        vatRate: 25,
        discountPercent: 0,
      },
    ])
    setServerError(null)
    setSeedVersion((v) => v + 1)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!clientId) {
      setServerError(tErrors('pickClient'))
      return
    }
    const validLines: LineItemInput[] = lines
      .filter((l) => l.description.trim() && l.quantity > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: l.quantity,
        unit: l.unit.trim() || undefined,
        unitPriceCents: l.unitPriceCents,
        vatRate: l.vatRate as 0 | 6 | 12 | 25,
        discountPercent: l.discountPercent || 0,
      }))
    if (validLines.length === 0) {
      setServerError(tErrors('atLeastOneLine'))
      return
    }

    const input: InvoiceInput = {
      clientId,
      issuedAt,
      dueAt,
      currency,
      notes: notes.trim() || undefined,
      template: templateId,
      reverseVat,
      rotRutType: rotRutType || null,
      rotRutCents: rotRutActive ? rotRutCents : 0n,
      ourReference: ourReference.trim() || undefined,
      theirReference: theirReference.trim() || undefined,
      orderNumber: orderNumber.trim() || undefined,
      paymentTermsDays,
      lineItems: validLines,
    }

    start(async () => {
      const res = await createInvoiceAction(input)
      if (res.error) {
        setServerError(res.error)
        return
      }
      if (res.fieldErrors) {
        setServerError(Object.values(res.fieldErrors).join('; '))
        return
      }
      toast.success(tToast('created'))
      router.refresh()
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={fillMockData}>
          {tActions('fillMock')}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('client')}</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className={SELECT_CLASS}
            style={SELECT_STYLE}
          >
            {clients.length === 0 && <option value="">No clients</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('currency')}</span>
          <Input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('issuedAt')}</span>
          <Input
            type="date"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('dueAt')}</span>
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('paymentTerms')}</span>
          <select
            value={paymentTermsDays}
            onChange={(e) => applyPaymentTerms(Number(e.target.value))}
            className={SELECT_CLASS}
            style={SELECT_STYLE}
          >
            {PAYMENT_TERMS.map((d) => (
              <option key={d} value={d}>
                {tFields('netDays', { days: d })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t('lineItems')}</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines((p) => [...p, emptyLine()])}
          >
            <PlusIcon className="h-4 w-4" /> {tActions('addLine')}
          </Button>
        </header>
        <div className="flex flex-col gap-3">
          {lines.map((line, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: lines reorder only on add/remove; index is stable per render.
              key={idx}
              className="rounded-[24px] border border-line-1 bg-card p-4 flex flex-col gap-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1.7fr_0.6fr_0.6fr_1.2fr_0.7fr_0.95fr_auto] gap-2 items-end">
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('description')}
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(idx, { description: e.target.value })}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('quantity')}
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    className="px-2"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('unit')}
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(idx, { unit: e.target.value })}
                    placeholder="h, st"
                    maxLength={20}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('unitPrice')}
                  <MoneyInput
                    key={`price-${idx}-${seedVersion}`}
                    className="px-2"
                    defaultValueCents={line.unitPriceCents}
                    onValueChange={(v) => updateLine(idx, { unitPriceCents: v })}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('discount')}
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="px-2"
                    value={line.discountPercent}
                    onChange={(e) =>
                      updateLine(idx, {
                        discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('vat')}
                  <select
                    value={line.vatRate}
                    onChange={(e) =>
                      updateLine(idx, { vatRate: Number(e.target.value) as SwedishVatRate })
                    }
                    className={SELECT_CLASS}
                    style={SELECT_STYLE}
                  >
                    {VAT_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(idx)}
                  aria-label={tActions('removeLine')}
                >
                  <CloseIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right text-sm text-ink/60 tnum font-mono">
                {formatMoney(
                  addCents([
                    BigInt(
                      Math.round(
                        line.quantity *
                          Number(line.unitPriceCents) *
                          (1 - (line.discountPercent || 0) / 100),
                      ),
                    ),
                  ]),
                  currency as 'SEK',
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-line-1 bg-card p-4 md:max-w-sm md:ml-auto">
        <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
          <dt className="text-ink/60">{tFields('subtotal')}</dt>
          <dd className="tnum font-mono text-right">
            {formatMoney(totals.subtotalCents, currency as 'SEK')}
          </dd>
          <dt className="text-ink/60">{tFields('vatTotal')}</dt>
          <dd className="tnum font-mono text-right">
            {formatMoney(totals.vatCents, currency as 'SEK')}
          </dd>
          <dt className="font-semibold pt-2 border-t border-line-1 mt-1">{tFields('total')}</dt>
          <dd className="tnum font-mono font-semibold text-right pt-2 border-t border-line-1 mt-1">
            {formatMoney(totals.totalCents, currency as 'SEK')}
          </dd>
        </dl>
      </section>

      <section className="grid md:grid-cols-2 gap-5">
        <div className="rounded-[24px] border border-line-1 bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('options.title')}</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reverseVat}
              onChange={(e) => setReverseVat(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            {t('options.reverseVat')}
          </label>
          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="flex flex-col gap-1.5 text-xs text-ink/60">
              {t('options.rotRut')}
              <select
                value={rotRutType}
                onChange={(e) => setRotRutType(e.target.value as RotRutType | '')}
                className={SELECT_CLASS}
                style={SELECT_STYLE}
              >
                <option value="">{t('options.none')}</option>
                <option value="ROT">ROT</option>
                <option value="RUT">RUT</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-ink/60">
              {t('options.rotRutAmount')}
              <MoneyInput
                key={`rotrut-${seedVersion}`}
                defaultValueCents={rotRutCents}
                onValueChange={setRotRutCents}
                disabled={rotRutType === ''}
              />
            </label>
          </div>
        </div>

        <div className="rounded-[24px] border border-line-1 bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('references.title')}</h3>
          <label className="flex flex-col gap-1.5 text-xs text-ink/60">
            {tFields('ourReference')}
            <Input
              value={ourReference}
              onChange={(e) => setOurReference(e.target.value)}
              maxLength={200}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink/60">
            {tFields('theirReference')}
            <Input
              value={theirReference}
              onChange={(e) => setTheirReference(e.target.value)}
              maxLength={200}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink/60">
            {tFields('orderNumber')}
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              maxLength={100}
            />
          </label>
        </div>
      </section>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink/80">{tFields('notes')}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-[12px] border border-line-1 bg-card px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        />
      </label>

      {serverError && <p className="text-sm text-neg">{serverError}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {tActions('create')}
        </Button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:text-ink">
            {t('back')}
          </button>
        ) : (
          <Link href={cancelHref} className="text-sm text-ink/60 hover:text-ink">
            {t('back')}
          </Link>
        )}
      </div>
    </form>
  )
}
