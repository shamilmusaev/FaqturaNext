import { getTranslations } from 'next-intl/server'

export default async function OverviewPage() {
  const t = await getTranslations('overview')
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-ink/60">{t('placeholder')}</p>
    </div>
  )
}
