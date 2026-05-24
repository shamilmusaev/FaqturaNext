import { requireUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function SettingsPage() {
  const { email, organizationId, role } = await requireUser()
  const t = await getTranslations('settings')
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink/60">{t('email')}</dt>
        <dd>{email}</dd>
        <dt className="text-ink/60">{t('organization')}</dt>
        <dd className="font-mono">{organizationId}</dd>
        <dt className="text-ink/60">{t('role')}</dt>
        <dd>{role}</dd>
      </dl>
    </div>
  )
}
