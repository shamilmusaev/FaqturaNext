import { Button } from '@/components/ui/button'
import { getInvoice } from '@/features/invoices/queries'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params
  const [invoice, t] = await Promise.all([getInvoice(id), getTranslations('invoices')])
  if (!invoice) notFound()
  if (invoice.status !== 'draft') {
    redirect(`/invoices/${id}` as Route)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link href={`/invoices/${id}` as Route} className="text-sm text-ink/60 hover:text-ink">
        ← {t('back')}
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('edit')} · {invoice.number}
      </h1>
      <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-8 text-center text-ink/60">
        {t('editPlaceholder')}
        <div className="mt-4">
          <Link href={`/invoices/${id}` as Route}>
            <Button variant="secondary">{t('back')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
