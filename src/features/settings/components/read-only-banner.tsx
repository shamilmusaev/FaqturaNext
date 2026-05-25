import { getTranslations } from 'next-intl/server'

export async function ReadOnlyBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  const t = await getTranslations('settings.common')
  return (
    <div className="mb-6 rounded-2xl border border-line-1 bg-paper-2 px-4 py-3 text-sm text-ink/70">
      {t('readOnly')}
    </div>
  )
}
