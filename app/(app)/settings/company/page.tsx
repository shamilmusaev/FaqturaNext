import { CompanyForm } from '@/features/settings/components/company-form'
import { ReadOnlyBanner } from '@/features/settings/components/read-only-banner'
import { getCurrentOrganization } from '@/features/settings/queries'
import { requireUser } from '@/lib/auth'

export default async function SettingsCompanyPage() {
  const [{ role }, org] = await Promise.all([requireUser(), getCurrentOrganization()])
  const readOnly = role !== 'owner' && role !== 'admin'
  return (
    <>
      <ReadOnlyBanner visible={readOnly} />
      <CompanyForm org={org} readOnly={readOnly} />
    </>
  )
}
