import { Button } from '@/components/ui/button'
import { ArrowRight } from '@/components/ui/icons'
import { listActiveClientOptions } from '@/features/clients/queries'
import { getTranslations } from 'next-intl/server'
import { NewInvoiceDialog } from '@/features/invoices/components/new-invoice-dialog'

export async function QuickSend() {
  const t = await getTranslations('overview.quickSend')
  const tVat = await getTranslations('overview.vatDue')
  const clients = await listActiveClientOptions()
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[24px] border border-ink bg-ink text-white p-6">
        <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-white/55">
          {t('label')}
        </span>
        <h2 className="mt-2 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
          {t('title')}
        </h2>
        <p className="mt-2 text-[13px] text-white/55">{t('subtitle')}</p>
        <div className="mt-4 w-fit">
          <NewInvoiceDialog clients={clients}>
            <Button variant="primary" className="bg-brand hover:bg-brand/90">
              {t('cta')} <ArrowRight className="h-4 w-4" />
            </Button>
          </NewInvoiceDialog>
        </div>
      </section>

      <section className="rounded-[24px] border border-line-1 bg-card p-5">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-ink-2">{tVat('title')}</div>
            <div className="mt-1.5 text-[28px] font-semibold tracking-[-0.03em] tnum">
              {tVat('amount')}
            </div>
          </div>
          <span className="rounded-full bg-warn-bg px-2.5 py-1 text-[11px] font-medium text-warn">
            {tVat('due')}
          </span>
        </div>
        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full w-[64%] rounded-full bg-warn" />
        </div>
        <div className="mt-2 text-[11px] text-ink-3">{tVat('aside')}</div>
      </section>
    </div>
  )
}
