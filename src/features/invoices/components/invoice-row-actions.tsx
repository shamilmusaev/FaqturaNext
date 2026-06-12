'use client'

import { useInvoiceSelection } from './invoice-selection'

export function InvoiceRowCheckbox({ id, invoiceNumber }: { id: string; invoiceNumber: string }) {
  const selection = useInvoiceSelection()
  return (
    <input
      type="checkbox"
      aria-label={`select-${invoiceNumber}`}
      checked={selection?.isSelected(id) ?? false}
      onChange={() => selection?.toggle(id)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 accent-ink"
    />
  )
}
