import { getTranslations } from 'next-intl/server'

export default async function ReportsPage() {
  const t = await getTranslations('nav')
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('reports')}</h1>
      <p className="mt-2 text-ink/60">Coming soon.</p>
    </div>
  )
}
