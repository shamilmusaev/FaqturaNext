'use client'

import { Button } from '@/components/ui/button'
import { CloseIcon, PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { toast } from '@/components/ui/toast'
import { addCents, formatMoney } from '@/lib/money'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState, useTransition } from 'react'
import { createInvoiceAction } from '../actions'
import type { InvoiceInput, LineItemInput } from '../schema'
import { calcInvoiceTotals, type SwedishVatRate } from '../vat'

interface ClientOption {
  id: string
  name: string
}

interface Props {
  clients: ClientOption[]
  cancelHref: Route
  defaultCurrency?: string
}

interface DraftLine {
  description: string
  quantity: number
  unit: string
  unitPriceCents: bigint
  vatRate: SwedishVatRate
}

const VAT_RATES: SwedishVatRate[] = [25, 12, 6, 0]

function emptyLine(): DraftLine {
  return { description: '', quantity: 1, unit: '', unitPriceCents: 0n, vatRate: 25 }
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function InvoiceForm({ clients, cancelHref, defaultCurrency = 'SEK' }: Props) {
  const t = useTranslations('invoices')
  const tFields = useTranslations('invoices.fields')
  const tActions = useTranslations('invoices.actions')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [issuedAt, setIssuedAt] = useState(todayPlusDays(0))
  const [dueAt, setDueAt] = useState(todayPlusDays(30))
  const [currency, setCurrency] = useState(defaultCurrency)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [serverError, setServerError] = useState<string | null>(null)

  const totals = useMemo(() => {
    return calcInvoiceTotals(
      lines.map((l) => ({
        quantity: Number(l.quantity) || 0,
        unitPriceCents: l.unitPriceCents,
        vatRate: l.vatRate,
      })),
    )
  }, [lines])

  const updateLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!clientId) {
      setServerError('Pick a client')
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
      }))
    if (validLines.length === 0) {
      setServerError('Add at least one line item')
      return
    }

    const input: InvoiceInput = {
      clientId,
      issuedAt,
      dueAt,
      currency,
      notes: notes.trim() || undefined,
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
      toast.success('Invoice created')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid md:grid-cols-2 gap-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('client')}</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="h-11 rounded-[12px] border border-line-1 bg-card px-3 text-[15px]"
          >
            {clients.length === 0 && <option value="">— no clients —</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('currency')}</span>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('issuedAt')}</span>
          <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink/80">{tFields('dueAt')}</span>
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Line items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
            <PlusIcon className="h-4 w-4" /> {tActions('addLine')}
          </Button>
        </header>
        <div className="flex flex-col gap-3">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="rounded-[24px] border border-line-1 bg-card p-4 flex flex-col gap-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_repeat(4,1fr)_auto] gap-3 items-end">
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
                    defaultValueCents={line.unitPriceCents}
                    onValueChange={(v) => updateLine(idx, { unitPriceCents: v })}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-ink/60">
                  {tFields('vat')}
                  <select
                    value={line.vatRate}
                    onChange={(e) => updateLine(idx, { vatRate: Number(e.target.value) as SwedishVatRate })}
                    className="h-11 rounded-[12px] border border-line-1 bg-card px-3 text-[15px]"
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
                  addCents([BigInt(Math.round(line.quantity * Number(line.unitPriceCents)))]),
                  currency as 'SEK',
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-line-1 bg-card p-4 md:max-w-sm md:ml-auto">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-ink/60">{tFields('subtotal')}</dt>
          <dd className="tnum font-mono">{formatMoney(totals.subtotalCents, currency as 'SEK')}</dd>
          <dt className="text-ink/60">{tFields('vatTotal')}</dt>
          <dd className="tnum font-mono">{formatMoney(totals.vatCents, currency as 'SEK')}</dd>
          <dt className="font-semibold pt-2 border-t border-line-1 mt-1">{tFields('total')}</dt>
          <dd className="tnum font-mono font-semibold pt-2 border-t border-line-1 mt-1">
            {formatMoney(totals.totalCents, currency as 'SEK')}
          </dd>
        </dl>
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
        <Link href={cancelHref} className="text-sm text-ink/60 hover:text-ink">
          {t('back')}
        </Link>
      </div>
    </form>
  )
}
