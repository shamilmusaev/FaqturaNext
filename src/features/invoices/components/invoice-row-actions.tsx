'use client'

interface InvoiceRowActionsProps {
  invoiceNumber: string
}

export function InvoiceRowCheckbox({ invoiceNumber }: InvoiceRowActionsProps) {
  return (
    <input
      type="checkbox"
      aria-label={`select-${invoiceNumber}`}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 accent-ink"
    />
  )
}

export function InvoiceRowMore() {
  return (
    <button
      type="button"
      aria-label="more"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink/50 hover:text-ink hover:bg-line-1/50"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="8" r="1.4" />
        <circle cx="8" cy="8" r="1.4" />
        <circle cx="13" cy="8" r="1.4" />
      </svg>
    </button>
  )
}
