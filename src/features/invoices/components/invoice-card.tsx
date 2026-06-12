'use client'

import { Chip } from '@/components/ui/chip'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/money'
import { useState } from 'react'
import type { InvoiceStatus } from '../schema'
import { STATUS_TONE } from '../status-tone'
import { InvoiceDetailDialog } from './invoice-detail-dialog'
import { InvoiceQuickActions } from './invoice-quick-actions'
import { useInvoiceSelection } from './invoice-selection'
import { InvoiceThumb } from './invoice-thumb'

export interface InvoiceCardData {
  id: string
  number: string
  status: InvoiceStatus
  statusLabel: string
  clientName: string
  totalCents: number
  currency: string
  thumb: string
}

export function InvoiceCard({ inv }: { inv: InvoiceCardData }) {
  const [open, setOpen] = useState(false)
  const selection = useInvoiceSelection()
  const selected = selection?.isSelected(inv.id) ?? false

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-[18px] border bg-card transition-colors',
        selected ? 'border-brand ring-2 ring-brand/40' : 'border-line-1 hover:border-line-2',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <div className="relative aspect-[1/1.414] overflow-hidden">
          <InvoiceThumb src={inv.thumb} alt={inv.number} />
          {selection && (
            <button
              type="button"
              aria-label="select"
              aria-pressed={selected}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                selection.toggle(inv.id)
              }}
              className={cn(
                'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-colors',
                selected
                  ? 'border-brand bg-brand text-white'
                  : 'border-line-1 bg-card/90 text-transparent hover:border-ink/40',
              )}
            >
              ✓
            </button>
          )}
          <div className="absolute right-2 top-2">
            <Chip tone={STATUS_TONE[inv.status]} className="whitespace-nowrap shadow-soft">
              {inv.statusLabel}
            </Chip>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-3.5 pt-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{inv.clientName}</div>
            <div className="truncate text-[11px] text-ink/45">{inv.number}</div>
          </div>
          <div className="tnum shrink-0 text-sm font-semibold text-ink/90">
            {formatMoney(inv.totalCents, (inv.currency || 'SEK') as 'SEK')}
          </div>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-end border-t border-line-1 px-2 py-1.5">
        <InvoiceQuickActions
          invoice={{ id: inv.id, status: inv.status, number: inv.number }}
          onView={() => setOpen(true)}
        />
      </div>
      <InvoiceDetailDialog invoiceId={inv.id} open={open} onOpenChange={setOpen} />
    </div>
  )
}
