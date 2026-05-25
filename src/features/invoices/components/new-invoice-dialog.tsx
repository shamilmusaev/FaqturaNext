'use client'

import { Button } from '@/components/ui/button'
import { CloseIcon, PlusIcon } from '@/components/ui/icons'
import { InvoiceForm } from '@/features/invoices/components/invoice-form'
import * as RadixDialog from '@radix-ui/react-dialog'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface ClientOption {
  id: string
  name: string
}

interface DialogProps {
  clients: ClientOption[]
  children: ReactNode
}

/**
 * Wraps a custom trigger in a client dialog that opens the invoice form
 * without changing the URL. Use anywhere on /overview where clicking
 * should not navigate the user out of the dashboard context.
 */
export function NewInvoiceDialog({ clients, children }: DialogProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('invoices')

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Trigger asChild>{children}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-md data-[state=open]:animate-[overlay-in_240ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[overlay-out_200ms_ease-in]" />
        <RadixDialog.Content className="fixed right-0 top-0 z-50 h-screen w-full bg-paper overflow-y-auto shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-[sheet-in-right_340ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[sheet-out-right_240ms_cubic-bezier(0.55,0,1,0.45)] md:w-[760px]">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-7 py-5 border-b border-line-1 bg-paper">
            <div className="flex items-center gap-3">
              <RadixDialog.Close
                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card hover:bg-paper transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </RadixDialog.Close>
              <RadixDialog.Title className="text-base font-semibold">
                {t('newInvoice')}
              </RadixDialog.Title>
            </div>
          </div>
          <div className="p-7">
            {clients.length === 0 ? (
              <p className="text-ink/60">{t('errors.needClientFirst')}</p>
            ) : (
              <InvoiceForm
                clients={clients}
                cancelHref={'/invoices' as Route}
                onCancel={() => setOpen(false)}
                onSuccess={() => setOpen(false)}
              />
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

interface ButtonProps {
  clients: ClientOption[]
  label: string
}

/** Header-style primary button + dialog. */
export function NewInvoiceDialogButton({ clients, label }: ButtonProps) {
  return (
    <NewInvoiceDialog clients={clients}>
      <Button>
        <PlusIcon className="h-4 w-4" /> {label}
      </Button>
    </NewInvoiceDialog>
  )
}
