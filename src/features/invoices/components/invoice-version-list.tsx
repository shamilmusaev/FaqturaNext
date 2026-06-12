'use client'

import { useEffect, useState } from 'react'
import { listInvoiceVersionsAction } from '../actions'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

interface Props {
  invoiceId: string
  selectedId: string | null
  onSelect: (id: string) => void
}

export function InvoiceVersionList({ invoiceId, selectedId, onSelect }: Props) {
  const t = useTranslations('invoices.versions')
  const locale = useLocale()
  const [versions, setVersions] = useState<NonNullable<Awaited<ReturnType<typeof listInvoiceVersionsAction>>['versions']>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    listInvoiceVersionsAction(invoiceId)
      .then((res) => {
        if (!active) return
        if (res.error) setError(res.error)
        else setVersions(res.versions ?? [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [invoiceId])

  const dateTimeFmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[12px] bg-paper-2 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-neg">{error}</p>
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-[16px] border border-line-1 bg-card p-6 text-center">
        <p className="text-sm text-ink/60">{t('noVersions')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink/80 mb-1">{t('versionHistory')}</h3>
      {versions.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect(v.id)}
          className={`flex flex-col gap-1 rounded-[12px] border p-3 text-left transition-colors ${
            selectedId === v.id
              ? 'border-brand bg-brand/5'
              : 'border-line-1 bg-card hover:bg-paper-2'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('version', { number: v.version_number })}
            </span>
            <span className="text-xs text-ink/50">
              {t('lines', { count: v.line_count })}
            </span>
          </div>
          <span className="text-xs text-ink/50">
            {dateTimeFmt.format(new Date(v.created_at))}
          </span>
        </button>
      ))}
    </div>
  )
}
