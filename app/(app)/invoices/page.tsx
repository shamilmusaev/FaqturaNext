import { getTranslations } from 'next-intl/server'

export default async function InvoicesPage() {
  const t = await getTranslations('invoices')
  return <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
}
