'use client'

import { useEffect, useMemo, useState } from 'react'
import { getInvoiceVersionAction } from '../actions'
import { useTranslations } from 'next-intl'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { createInvoiceFromVersionAction, restoreInvoiceFromVersionAction } from '../actions'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { toast } from '@/components/ui/toast'

interface LineItem {
  description: string
  quantity: number
  unit: string | null
  unit_price_cents: number | string
  vat_rate: number
  discount_percent: number
  amount_cents: number | string
}

interface Props {
  versionId: string
  invoiceId: string
}

export function InvoiceVersionDiff({ versionId, invoiceId }: Props) {
  const t = useTranslations('invoices.versions')
  const tFields = useTranslations('invoices.fields')
  const tToast = useTranslations('invoices.toast')
  const router = useRouter()
  const [version, setVersion] = useState<Awaited<ReturnType<typeof getInvoiceVersionAction>>['version'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<'copy' | 'restore' | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getInvoiceVersionAction(versionId)
      .then((res) => {
        if (!active) return
        if (res.error) setError(res.error)
        else setVersion(res.version ?? null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [versionId])

  const lineItems = useMemo(() => {
    if (!version) return []
    return ((version.snapshot.lineItems ?? []) as unknown) as LineItem[]
  }, [version])

  const header = useMemo(() => {
    if (!version) return null
    return version.snapshot.header as Record<string, unknown>
  }, [version])

  const currency = (header?.currency as string) || 'SEK'
  const totalCents = Number(header?.total_cents ?? 0)
  const subtotalCents = Number(header?.subtotal_cents ?? 0)
  const vatCents = Number(header?.vat_cents ?? 0)

  const handleDuplicate = async () => {
    setRestoring('copy')
    const res = await createInvoiceFromVersionAction(versionId)
    setRestoring(null)
    if (res.error) {
      toast.error(res.error)
      return
    }
    if (res.invoiceId) {
      toast.success(tToast('created'))
      router.push(`/invoices/${res.invoiceId}` as Route)
    }
  }

  const handleRestore = async () => {
    if (!window.confirm(t('restoreConfirm'))) return
    setRestoring('restore')
    const res = await restoreInvoiceFromVersionAction(versionId, invoiceId)
    setRestoring(null)
    if (res.error) {
      toast.error(res.error)
      return
    }
    if (res.invoiceId) {
      toast.success(tToast('restored'))
      router.push(`/invoices/${res.invoiceId}` as Route)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-[16px] bg-paper-2 animate-pulse" />
        <div className="h-48 rounded-[16px] bg-paper-2 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-neg">{error}</p>
  }

  if (!version || !header) {
    return <p className="text-sm text-ink/60">{t('noVersions')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">
          {t('version', { number: version.version_number })}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRestore}
            disabled={restoring !== null}
          >
            {restoring === 'restore' ? t('restoring') : t('restore')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDuplicate}
            disabled={restoring !== null}
          >
            {restoring === 'copy' ? t('restoring') : t('copyToNew')}
          </Button>
        </div>
      </div>

      {/* Header snapshot */}
      <section className="rounded-[16px] border border-line-1 bg-card p-4">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink/60">{tFields('client')}</dt>
          <dd className="text-right">{String(header.client_id ?? '—')}</dd>
          <dt className="text-ink/60">{tFields('issuedAt')}</dt>
          <dd className="text-right">{String(header.issued_at ?? '—')}</dd>
          <dt className="text-ink/60">{tFields('dueAt')}</dt>
          <dd className="text-right">{String(header.due_at ?? '—')}</dd>
          <dt className="text-ink/60">{tFields('currency')}</dt>
          <dd className="text-right">{currency}</dd>
          <dt className="text-ink/60">{tFields('notes')}</dt>
          <dd className="text-right truncate max-w-[200px]">{String(header.notes ?? '—')}</dd>
        </dl>
      </section>

      {/* Line items */}
      <section className="rounded-[16px] border border-line-1 bg-card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap min-w-[480px]">
          <thead className="text-ink/60 text-xs uppercase tracking-wide">
            <tr className="border-b border-line-1">
              <th className="text-left font-medium px-3 py-2.5 w-auto min-w-[120px]">{tFields('description')}</th>
              <th className="text-right font-medium px-3 py-2.5">{tFields('quantity')}</th>
              <th className="text-right font-medium px-3 py-2.5">{tFields('unitPrice')}</th>
              <th className="text-right font-medium px-3 py-2.5">{tFields('vat')}</th>
              <th className="text-right font-medium px-3 py-2.5">{tFields('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li, idx) => (
              <tr key={idx} className="border-b border-line-1 last:border-0">
                <td className="px-3 py-2.5 whitespace-normal min-w-[120px]">{li.description}</td>
                <td className="px-3 py-2.5 text-right tnum font-mono">
                  {li.quantity}
                  {li.unit && <span className="text-ink/50 ml-1">{li.unit}</span>}
                </td>
                <td className="px-3 py-2.5 text-right tnum font-mono">
                  {formatMoney(BigInt(li.unit_price_cents), currency as 'SEK')}
                </td>
                <td className="px-3 py-2.5 text-right">{li.vat_rate}%</td>
                <td className="px-3 py-2.5 text-right tnum font-mono">
                  {formatMoney(BigInt(li.amount_cents), currency as 'SEK')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="rounded-[16px] border border-line-1 bg-card p-4 ml-auto w-full md:w-auto md:min-w-[280px]">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-ink/60">{tFields('subtotal')}</dt>
          <dd className="tnum font-mono">{formatMoney(BigInt(subtotalCents), currency as 'SEK')}</dd>
          <dt className="text-ink/60">{tFields('vatTotal')}</dt>
          <dd className="tnum font-mono">{formatMoney(BigInt(vatCents), currency as 'SEK')}</dd>
          <dt className="font-semibold pt-2 border-t border-line-1 mt-1">{tFields('total')}</dt>
          <dd className="tnum font-mono font-semibold pt-2 border-t border-line-1 mt-1">
            {formatMoney(BigInt(totalCents), currency as 'SEK')}
          </dd>
        </dl>
      </section>
    </div>
  )
}
