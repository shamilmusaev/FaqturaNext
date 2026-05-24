import { Button } from '@/components/ui/button'
import { ClientsIcon, PlusIcon } from '@/components/ui/icons'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function ClientsEmpty() {
  const t = await getTranslations('clients')
  return (
    <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-12 text-center">
      <ClientsIcon className="mx-auto h-10 w-10 text-ink/40" />
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{t('empty')}</h2>
      <p className="mt-1 text-ink/60">{t('emptyHint')}</p>
      <Link href={'/clients/new' as Route} className="inline-block mt-6">
        <Button>
          <PlusIcon className="h-4 w-4" />
          {t('createCta')}
        </Button>
      </Link>
    </div>
  )
}
