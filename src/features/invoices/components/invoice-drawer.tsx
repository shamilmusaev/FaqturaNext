'use client'

import { CloseIcon } from '@/components/ui/icons'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function InvoiceDrawer({
  title,
  width = 'editor',
  children,
}: {
  title: string
  width?: 'editor' | 'detail'
  children: ReactNode
}) {
  const router = useRouter()
  const widthClass = width === 'editor' ? 'md:w-[760px]' : 'md:w-[720px]'

  return (
    <RadixDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/30 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixDialog.Content
          className={`fixed right-0 top-0 z-50 h-screen w-full bg-paper overflow-y-auto shadow-2xl focus:outline-none ${widthClass}`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-7 py-5 border-b border-line-1 bg-paper">
            <div className="flex items-center gap-3">
              <RadixDialog.Close
                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card hover:bg-paper transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </RadixDialog.Close>
              <RadixDialog.Title className="text-base font-semibold">{title}</RadixDialog.Title>
            </div>
          </div>
          <div className="p-7">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
