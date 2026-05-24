import { Button } from '@/components/ui/button'
import { ArrowRight } from '@/components/ui/icons'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export async function QuickSend() {
  const t = await getTranslations('overview.quickSend')
  return (
    <section className="rounded-[24px] bg-ink text-white p-6 flex flex-col gap-4">
      <span className="text-xs uppercase tracking-wider text-white/60">{t('label')}</span>
      <h2 className="text-2xl font-semibold tracking-tight">{t('title')}</h2>
      <p className="text-sm text-white/70">{t('subtitle')}</p>
      <Link href={'/invoices/new' as Route} className="inline-block mt-2 w-fit">
        <Button variant="primary" className="bg-brand hover:bg-brand/90">
          {t('cta')} <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  )
}
