'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger

export function DialogContent({
  children,
  side = 'right',
  className,
}: {
  children: ReactNode
  side?: 'right' | 'center'
  className?: string
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-ink/30 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed bg-card focus:outline-none',
          side === 'right'
            ? 'right-0 top-0 h-screen w-full md:w-[720px] border-l border-line-1'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg rounded-[24px] border border-line-1',
          className,
        )}
      >
        {children}
        <RadixDialog.Close
          className="absolute right-4 top-4 p-2 rounded-md hover:bg-line-1/40"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <RadixDialog.Title className="text-xl font-semibold tracking-tight">{children}</RadixDialog.Title>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <RadixDialog.Description className="text-ink/60 text-sm">{children}</RadixDialog.Description>
}
