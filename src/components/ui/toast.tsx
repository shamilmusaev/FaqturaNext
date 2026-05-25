'use client'

import { Toaster as SonnerToaster, toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        className: 'rounded-full bg-ink text-white border-0 shadow-pop',
        style: {
          background: 'var(--ink)',
          color: '#F4F1E8',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 24px',
          fontSize: '14px',
          fontFamily: 'var(--font-sans)',
        },
      }}
    />
  )
}

export { toast }
