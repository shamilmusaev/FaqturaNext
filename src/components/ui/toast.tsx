'use client'

import { Toaster as SonnerToaster, toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className:
          'rounded-[12px] border border-line-1 bg-card text-ink shadow-[var(--shadow-card)]',
      }}
    />
  )
}

export { toast }
