import { Button } from '@/components/ui/button'
import { getInvoice } from '@/features/invoices/queries'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()
  if (invoice.status !== 'draft') {
    redirect(`/invoices/${id}` as Route)
  }
  const t = await getTranslations('invoices')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link href={`/invoices/${id}` as Route} className="text-sm text-ink/60 hover:text-ink">
        ← {t('back')}
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('edit')} · {invoice.number}
      </h1>
      <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-8 text-center text-ink/60">
        Inline editing of invoice line items will land in a follow-up. For now, cancel this
        draft and create a new invoice if you need to make changes.
        <div className="mt-4">
          <Link href={`/invoices/${id}` as Route}>
            <Button variant="secondary">{t('back')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
