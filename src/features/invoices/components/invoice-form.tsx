'use client'

import { Button } from '@/components/ui/button'
import { CloseIcon, PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { toast } from '@/components/ui/toast'
import { type LineSuggestion, lineSuggestionsAction } from '@/features/ai/actions'
import { LineDescriptionField } from '@/features/ai/components/line-description-field'
import { MagicFillPanel } from '@/features/ai/components/magic-fill-panel'
import { PolishAllButton } from '@/features/ai/components/polish-all-button'
import { PolishButton } from '@/features/ai/components/polish-button'
import { MAX_APPLIED_LINES } from '@/features/ai/convert'
import { addCents, formatMoney } from '@/lib/money'
import { DEFAULT_TEMPLATE_ID, type TemplateId } from '@/lib/pdf/templates/ids'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createInvoiceAction, updateInvoiceAction } from '../actions'
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
  /** Read-only preview of the auto-generated invoice number. */
  numberPreview?: string
  /** Emits the live draft on every change so a sibling preview can render it. */
  onDraftChange?: (draft: FormDraft) => void
  onCancel?: () => void
  onSuccess?: () => void
  /** 'edit' targets an existing draft invoice; defaults to 'create'. */
  mode?: 'create' | 'edit'
  /** The draft invoice id (required in edit mode; tracked internally in create). */
  invoiceId?: string
  /** Seed values for edit mode (existing invoice). */
  initial?: FormDraft
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

const PAYMENT_TERMS = [10, 14, 20, 30, 45, 60] as const

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
  numberPreview,
  onDraftChange,
  onCancel,
  onSuccess,
  mode = 'create',
  invoiceId,
  initial,
}: Props) {
  const t = useTranslations('invoices')
  const tFields = useTranslations('invoices.fields')
  const tActions = useTranslations('invoices.actions')
  const tErrors = useTranslations('invoices.errors')
  const tToast = useTranslations('invoices.toast')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [clientId, setClientId] = useState(initial?.clientId || clients[0]?.id || '')
  const [issuedAt, setIssuedAt] = useState(initial?.issuedAt ?? todayPlusDays(0))
  const [dueAt, setDueAt] = useState(initial?.dueAt ?? todayPlusDays(30))
  const [deliveryAt, setDeliveryAt] = useState(initial?.deliveryAt ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [number, setNumber] = useState(initial?.number ?? '')
  const [lines, setLines] = useState<DraftLine[]>(
    () => initial?.lines ?? Array.from({ length: 5 }, emptyLine),
  )
  const [serverError, setServerError] = useState<string | null>(null)
  // Swedish invoice fields (Phase 2).
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [hideOcr, setHideOcr] = useState(initial?.hideOcr ?? true)
  const [reverseVat, setReverseVat] = useState(initial?.reverseVat ?? false)
  const [rotRutType, setRotRutType] = useState<RotRutType | ''>(initial?.rotRutType ?? '')
  const [rotRutCents, setRotRutCents] = useState(initial?.rotRutCents ?? 0n)
  // Autosave bookkeeping: the draft id we write into (known up front in edit mode).
  const draftIdRef = useRef<string | null>(invoiceId ?? null)
  const savingRef = useRef(false)
  const pendingInputRef = useRef<InvoiceInput | null>(null)
  // The in-flight autosave *create* (if any). Submit awaits it so it can't
  // create a second invoice while a create is still resolving draftIdRef.
  const inflightCreateRef = useRef<Promise<void> | null>(null)
  // Skip the very first autosave pass (mount) so seeded/empty state doesn't
  // trigger a redundant write before the user changes anything.
  const autosaveReadyRef = useRef(false)
  // Bumped by fillMockData to remount the uncontrolled MoneyInputs so they pick
  // up the new defaultValueCents.
  const [seedVersion, setSeedVersion] = useState(0)
  // Past line items for ghost autocomplete; refetched when the client changes
  // so rates invoiced to that client are preferred.
  const [suggestions, setSuggestions] = useState<LineSuggestion[]>([])

  useEffect(() => {
    let active = true
    lineSuggestionsAction({ clientId: clientId || undefined }).then((s) => {
      if (active) setSuggestions(s)
    })
    return () => {
      active = false
    }
  }, [clientId])

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
      deliveryAt,
      currency,
      notes,
      number,
      lines,
      hideOcr,
      reverseVat,
      rotRutType: rotRutType || null,
      rotRutCents: rotRutActive ? rotRutCents : 0n,
      ourReference: '',
      theirReference: '',
      orderNumber: '',
    })
  }, [
    onDraftChange,
    clientId,
    issuedAt,
    dueAt,
    deliveryAt,
    currency,
    notes,
    number,
    lines,
    hideOcr,
    reverseVat,
    rotRutType,
    rotRutActive,
    rotRutCents,
  ])

  // Build the validated invoice payload from current state, or null when there
  // isn't enough yet (no client / no usable line) to save.
  const buildInput = (): InvoiceInput | null => {
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
    if (!clientId || !dueAt || validLines.length === 0) return null
    return {
      clientId,
      issuedAt,
      dueAt,
      deliveryAt: deliveryAt || undefined,
      currency,
      notes: notes.trim() || undefined,
      number: number.trim() || undefined,
      template: templateId,
      hideOcr,
      reverseVat,
      rotRutType: rotRutType || null,
      rotRutCents: rotRutActive ? rotRutCents : 0n,
      ourReference: undefined,
      theirReference: undefined,
      orderNumber: undefined,
      paymentTermsDays,
      lineItems: validLines,
    }
  }

  // Persist a background autosave: create the draft on first save, update it
  // afterwards. Serialized via savingRef so overlapping edits coalesce.
  const runAutosave = async (input: InvoiceInput) => {
    if (savingRef.current) {
      pendingInputRef.current = input
      return
    }
    savingRef.current = true
    try {
      if (draftIdRef.current) {
        const res = await updateInvoiceAction(draftIdRef.current, input, false)
        // Surface a failure (e.g. the draft was sent/cancelled elsewhere) so the
        // user knows their edits aren't being saved, instead of failing silently.
        if (res?.error) setServerError(res.error)
        else setServerError(null)
      } else {
        const create = (async () => {
          const res = await createInvoiceAction(input, false)
          if (res.invoiceId) draftIdRef.current = res.invoiceId
        })()
        inflightCreateRef.current = create
        try {
          await create
        } finally {
          inflightCreateRef.current = null
        }
      }
    } catch {
      /* autosave is best-effort; the explicit Save surfaces errors */
    } finally {
      savingRef.current = false
      if (pendingInputRef.current) {
        const next = pendingInputRef.current
        pendingInputRef.current = null
        void runAutosave(next)
      }
    }
  }

  // Debounced autosave: each edit resets a 1.2s timer; once idle we persist.
  // Skips the first (mount) pass so seeded/empty state doesn't write.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on form fields; buildInput/runAutosave intentionally excluded.
  useEffect(() => {
    if (!autosaveReadyRef.current) {
      autosaveReadyRef.current = true
      return
    }
    const input = buildInput()
    if (!input) return
    const timer = setTimeout(() => void runAutosave(input), 1200)
    return () => clearTimeout(timer)
  }, [
    clientId,
    issuedAt,
    dueAt,
    deliveryAt,
    currency,
    notes,
    number,
    lines,
    hideOcr,
    reverseVat,
    rotRutType,
    rotRutActive,
    rotRutCents,
    paymentTermsDays,
    templateId,
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

  // Accept a ghost-text suggestion: fill the whole row from the past line item.
  // Bump seedVersion so the uncontrolled MoneyInput shows the recalled price.
  const acceptSuggestion = (idx: number, s: LineSuggestion) => {
    updateLine(idx, {
      description: s.description,
      unitPriceCents: BigInt(s.unitPriceCents),
      unit: s.unit ?? '',
      vatRate: s.vatRate as SwedishVatRate,
    })
    setSeedVersion((v) => v + 1)
  }

  // Magic Fill: replace the empty pre-seeded rows and append the AI-generated
  // lines after any the user already filled in. Bump seedVersion to remount the
  // uncontrolled MoneyInputs onto the new prices (same trick as fillMockData).
  const applyGeneratedLines = (generated: DraftLine[]) => {
    setLines((prev) => {
      const kept = prev.filter((l) => l.description.trim() !== '')
      return [...kept, ...generated].slice(0, MAX_APPLIED_LINES)
    })
    setSeedVersion((v) => v + 1)
  }

  // Dev convenience: fill every field with realistic sample data so the preview
  // shows a complete invoice in one click.
  const fillMockData = () => {
    setClientId(clients[0]?.id ?? '')
    setIssuedAt(todayPlusDays(0))
    setDueAt(todayPlusDays(30))
    setPaymentTermsDays(30)
    setCurrency('SEK')
    // Payment terms live in the Betalningsvillkor field; don't hardcode days
    // here or the note contradicts the chosen term.
    setNotes('Tack för förtroendet!')
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
    const input = buildInput()
    if (!input) {
      setServerError(tErrors('atLeastOneLine'))
      return
    }

    // Finalize into the autosaved draft if one exists, otherwise create fresh.
    // Both redirect to the detail page on success, so code after the await only
    // runs on failure.
    start(async () => {
      // Let any in-flight autosave create finish first so we update that draft
      // instead of creating a duplicate.
      if (inflightCreateRef.current) {
        try {
          await inflightCreateRef.current
        } catch {
          /* fall through; we'll create fresh below */
        }
      }
      const id = draftIdRef.current
      const res = id
        ? await updateInvoiceAction(id, input, 'detail')
        : await createInvoiceAction(input, 'detail')
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
      <MagicFillPanel currency={currency} clientId={clientId} onApply={applyGeneratedLines} />
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
          <span className="text-ink/80">{tFields('deliveryAt')}</span>
          <Input type="date" value={deliveryAt} onChange={(e) => setDeliveryAt(e.target.value)} />
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
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('number')}</span>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={numberPreview}
            maxLength={50}
          />
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('lineItems')}</h2>
          <div className="flex items-center gap-2">
            <PolishAllButton
              items={lines
                .map((l, idx) => ({ idx, description: l.description }))
                .filter((i) => i.description.trim())}
              onApply={(results) => {
                for (const r of results) updateLine(r.idx, { description: r.text })
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setLines((p) => [...p, emptyLine()])}
            >
              <PlusIcon className="h-4 w-4" /> {tActions('addLine')}
            </Button>
          </div>
        </header>
        <div className="flex flex-col gap-3">
          {lines.map((line, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: lines reorder only on add/remove; index is stable per render.
              key={idx}
              className="rounded-[24px] border border-line-1 bg-card p-4 flex flex-col gap-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 items-end lg:grid-cols-[4rem_3.5rem_minmax(5.75rem,1fr)_4.25rem_5.5rem_2.5rem]">
                <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-xs text-ink/60 lg:col-span-full">
                  {tFields('description')}
                  <LineDescriptionField
                    value={line.description}
                    onChange={(text) => updateLine(idx, { description: text })}
                    onAccept={(s) => acceptSuggestion(idx, s)}
                    suggestions={suggestions}
                    siblings={lines.filter((_, i) => i !== idx).map((l) => l.description)}
                    required
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('quantity')}
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    className="px-2 text-right tnum font-mono"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('unit')}
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(idx, { unit: e.target.value })}
                    placeholder="h, st"
                    maxLength={20}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('unitPrice')}
                  <MoneyInput
                    key={`price-${idx}-${seedVersion}`}
                    className="px-2"
                    defaultValueCents={line.unitPriceCents}
                    onValueChange={(v) => updateLine(idx, { unitPriceCents: v })}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('discount')}
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="px-2 text-right tnum font-mono"
                    value={line.discountPercent}
                    onChange={(e) =>
                      updateLine(idx, {
                        discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs text-ink/60">
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
                  className="self-end justify-self-end"
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

      <section className="rounded-[24px] border border-line-1 bg-card p-5 md:max-w-md md:ml-auto">
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideOcr}
              onChange={(e) => setHideOcr(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            {t('options.hideOcr')}
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

      </section>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-ink/80">
          {tFields('notes')}
          <PolishButton value={notes} context="notes" onReplace={setNotes} />
        </span>
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
          {tActions(mode === 'edit' ? 'save' : 'create')}
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
