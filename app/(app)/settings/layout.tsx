import { getTranslations } from 'next-intl/server'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('settings')
  return (
    <div className="max-w-4xl pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-ink/55">{t('subtitle')}</p>
      </header>
      {children}
    </div>
  )
}
