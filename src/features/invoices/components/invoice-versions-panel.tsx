'use client'

import { CloseIcon, HistoryIcon } from '@/components/ui/icons'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { InvoiceVersionDiff } from './invoice-version-diff'
import { InvoiceVersionList } from './invoice-version-list'

interface Props {
  invoiceId: string
  open: boolean
  onClose: () => void
}

export function InvoiceVersionsPanel({ invoiceId, open, onClose }: Props) {
  const t = useTranslations('invoices.versions')
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

  return (
    <RadixDialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-md data-[state=open]:animate-[overlay-in_240ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[overlay-out_200ms_ease-in]"
        />
        <RadixDialog.Content
          className="fixed right-0 top-0 z-50 h-screen w-full bg-paper overflow-y-auto shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-[sheet-in-right_340ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[sheet-out-right_240ms_cubic-bezier(0.55,0,1,0.45)] md:w-[900px]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-7 py-5 border-b border-line-1 bg-paper">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card">
                <HistoryIcon className="h-4 w-4" />
              </div>
              <RadixDialog.Title className="text-base font-semibold">{t('title')}</RadixDialog.Title>
            </div>
            <RadixDialog.Close
              className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line-1 bg-card hover:bg-paper transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="h-4 w-4" />
            </RadixDialog.Close>
          </div>

          <div className="p-7">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              <div className="w-full md:w-[280px] md:shrink-0">
                <InvoiceVersionList
                  invoiceId={invoiceId}
                  selectedId={selectedVersionId}
                  onSelect={setSelectedVersionId}
                />
              </div>
              <div className="flex-1 min-w-0">
                {selectedVersionId ? (
                  <InvoiceVersionDiff
                    versionId={selectedVersionId}
                    invoiceId={invoiceId}
                  />
                ) : (
                  <div className="rounded-[16px] border border-line-1 bg-card p-6 text-center">
                    <p className="text-sm text-ink/60">{t('selectVersion')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
