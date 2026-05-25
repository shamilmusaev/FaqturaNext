import { InvoicingForm } from '@/features/settings/components/invoicing-form'
import { ReadOnlyBanner } from '@/features/settings/components/read-only-banner'
import { getCurrentOrganization } from '@/features/settings/queries'
import { requireUser } from '@/lib/auth'

export default async function SettingsInvoicingPage() {
  const [{ role }, org] = await Promise.all([requireUser(), getCurrentOrganization()])
  const readOnly = role !== 'owner' && role !== 'admin'
  return (
    <>
      <ReadOnlyBanner visible={readOnly} />
      <InvoicingForm org={org} readOnly={readOnly} />
    </>
  )
}
