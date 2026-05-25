import { LocalizationForm } from '@/features/settings/components/localization-form'
import { ReadOnlyBanner } from '@/features/settings/components/read-only-banner'
import { getCurrentOrganization } from '@/features/settings/queries'
import { requireUser } from '@/lib/auth'
import type { Locale } from '@/i18n/config'
import { getLocale } from 'next-intl/server'

export default async function SettingsLocalizationPage() {
  const [{ role }, org, locale] = await Promise.all([
    requireUser(),
    getCurrentOrganization(),
    getLocale(),
  ])
  const readOnly = role !== 'owner' && role !== 'admin'
  return (
    <>
      <ReadOnlyBanner visible={readOnly} />
      <LocalizationForm org={org} uiLocale={locale as Locale} readOnly={readOnly} />
    </>
  )
}
