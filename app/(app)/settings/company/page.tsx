import { CompanyForm } from '@/features/settings/components/company-form'
import { LogoUpload } from '@/features/settings/components/logo-upload'
import { ReadOnlyBanner } from '@/features/settings/components/read-only-banner'
import { getCurrentOrganization } from '@/features/settings/queries'
import { requireUser } from '@/lib/auth'

export default async function SettingsCompanyPage() {
  const [{ role }, org] = await Promise.all([requireUser(), getCurrentOrganization()])
  const readOnly = role !== 'owner' && role !== 'admin'
  return (
    <>
      <ReadOnlyBanner visible={readOnly} />
      <LogoUpload orgId={org.id} orgName={org.name} logoUrl={org.logo_url} readOnly={readOnly} />
      <CompanyForm org={org} readOnly={readOnly} />
    </>
  )
}
